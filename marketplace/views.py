from django.db import transaction
from django.db.models import Sum, Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from drf_yasg.utils import swagger_auto_schema

from .models import SellOrder
from .serializers import (
    CreateSellOrderSerializer,
    SellOrderListSerializer,
    BuyFromSellOrderSerializer
)

from credits.models import CreditWallet
from transactions.models import Transaction
from projects.models import Project


# 1️⃣ CREATE SELL ORDER
class CreateSellOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(request_body=CreateSellOrderSerializer)
    @transaction.atomic
    def post(self, request):
        serializer = CreateSellOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project_id = serializer.validated_data['project_id']
        credits_to_sell = serializer.validated_data['credits_for_sale']
        price_per_credit = serializer.validated_data['price_per_credit']

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ NEW: ownership check
        if project.user != request.user:
            return Response(
                {'error': 'You do not own this project'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 🔥 FIX: allow ISSUED credits with NULL project (old data)
        wallets = CreditWallet.objects.select_for_update().filter(
            user=request.user,
            credit_type='ISSUED'
        ).filter(
            Q(project=project) | Q(project__isnull=True)
        )

        if not wallets.exists():
            return Response(
                {'error': 'No issued credits found for this project'},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_available = wallets.aggregate(
            total=Sum('available_credits')
        )['total'] or 0

        if total_available < credits_to_sell:
            return Response(
                {'error': 'Not enough available credits to create sell order'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Deduct credits + fix old NULL project
        wallet = wallets.first()
        wallet.available_credits -= credits_to_sell
        wallet.used_credits += credits_to_sell
        wallet.project = project
        wallet.save()

        sell_order = SellOrder.objects.create(
            seller=request.user,
            project=project,
            credits_for_sale=credits_to_sell,
            price_per_credit=price_per_credit,
            status='ACTIVE'
        )

        # === BLOCKCHAIN INTEGRATION ===
        blockchain_tx_hash = None
        try:
            from blockchain.services import blockchain_service, BLOCKCHAIN_ENABLED
            
            if BLOCKCHAIN_ENABLED and hasattr(request.user, 'profile') and request.user.profile.metamask_wallet_address:
                # Convert price to wei (assuming price is in INR, use a simple conversion)
                price_in_wei = int(float(price_per_credit) * 1e18)  # Simplified
                
                blockchain_tx_hash = blockchain_service.create_sell_order(
                    order_id=sell_order.id,
                    seller_wallet=request.user.profile.metamask_wallet_address,
                    credits=credits_to_sell,
                    price_per_credit=price_in_wei,
                    project_id=project.id
                )
                
                # Store tx hash if model supports it
                if blockchain_tx_hash and hasattr(sell_order, 'blockchain_tx_hash'):
                    sell_order.blockchain_tx_hash = blockchain_tx_hash
                    sell_order.save(update_fields=['blockchain_tx_hash'])
                    
        except ImportError:
            pass  # Blockchain module not available
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Blockchain sell order creation failed: {e}")

        return Response(
            {
                'message': 'Sell order created successfully',
                'sell_order_id': sell_order.id,
                'blockchain_tx_hash': blockchain_tx_hash
            },
            status=status.HTTP_201_CREATED
        )



# 2️⃣ LIST ACTIVE SELL ORDERS
class ActiveSellOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = SellOrder.objects.filter(status='ACTIVE').order_by('-created_at')
        serializer = SellOrderListSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# 3️⃣ BUY FROM SELL ORDER
class BuyFromSellOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(request_body=BuyFromSellOrderSerializer)
    @transaction.atomic
    def post(self, request):
        serializer = BuyFromSellOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        buyer = request.user
        sell_order_id = serializer.validated_data['sell_order_id']
        credits_to_buy = serializer.validated_data['credits_to_buy']

        try:
            sell_order = SellOrder.objects.select_for_update().get(
                id=sell_order_id,
                status='ACTIVE'
            )
        except SellOrder.DoesNotExist:
            return Response(
                {'error': 'Sell order not available'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if sell_order.seller == buyer:
            return Response(
                {'error': 'You cannot buy your own sell order'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if sell_order.credits_for_sale < credits_to_buy:
            return Response(
                {'error': 'Not enough credits available in sell order'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sell_order.credits_for_sale -= credits_to_buy
        if sell_order.credits_for_sale == 0:
            sell_order.status = 'SOLD'
        sell_order.save()

        CreditWallet.objects.create(
            user=buyer,
            project=sell_order.project,
            credit_type='PURCHASED',
            available_credits=credits_to_buy,
            used_credits=0
        )

        tx_record = Transaction.objects.create(
            sell_order=sell_order,
            project=sell_order.project,
            seller=sell_order.seller,
            buyer=buyer,
            credits_transferred=credits_to_buy
        )

        # === BLOCKCHAIN INTEGRATION ===
        blockchain_tx_hash = None
        try:
            from blockchain.services import blockchain_service, BLOCKCHAIN_ENABLED
            
            if BLOCKCHAIN_ENABLED and hasattr(buyer, 'profile') and buyer.profile.metamask_wallet_address:
                blockchain_tx_hash = blockchain_service.execute_purchase(
                    order_id=sell_order.id,
                    buyer_wallet=buyer.profile.metamask_wallet_address,
                    credits_to_buy=credits_to_buy
                )
                
                # Store tx hash if model supports it
                if blockchain_tx_hash and hasattr(tx_record, 'blockchain_tx_hash'):
                    tx_record.blockchain_tx_hash = blockchain_tx_hash
                    tx_record.save(update_fields=['blockchain_tx_hash'])
                    
        except ImportError:
            pass
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Blockchain purchase execution failed: {e}")

        return Response(
            {
                'message': 'Credits purchased successfully',
                'blockchain_tx_hash': blockchain_tx_hash
            },
            status=status.HTTP_200_OK
        )


# 4️⃣ CANCEL SELL ORDER
class CancelSellOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, sell_order_id):
        try:
            sell_order = SellOrder.objects.select_for_update().get(
                id=sell_order_id,
                seller=request.user,
                status='ACTIVE'
            )
        except SellOrder.DoesNotExist:
            return Response(
                {'error': 'Sell order not found or cannot be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        remaining_credits = sell_order.credits_for_sale

        wallet = CreditWallet.objects.select_for_update().filter(
            user=request.user,
            project=sell_order.project,
            credit_type='ISSUED'
        ).first()

        if wallet:
            wallet.available_credits += remaining_credits
            wallet.used_credits -= remaining_credits
            wallet.save()

        sell_order.status = 'CANCELLED'
        sell_order.save()

        # === BLOCKCHAIN INTEGRATION ===
        blockchain_tx_hash = None
        try:
            from blockchain.services import blockchain_service, BLOCKCHAIN_ENABLED
            
            if BLOCKCHAIN_ENABLED:
                blockchain_tx_hash = blockchain_service.cancel_sell_order(
                    order_id=sell_order.id
                )
                    
        except ImportError:
            pass
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Blockchain sell order cancellation failed: {e}")

        return Response(
            {
                'message': 'Sell order cancelled and credits returned',
                'blockchain_tx_hash': blockchain_tx_hash
            },
            status=status.HTTP_200_OK
        )

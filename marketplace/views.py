from django.db import transaction
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


# 1️⃣ CREATE SELL ORDER
class CreateSellOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(request_body=CreateSellOrderSerializer)
    @transaction.atomic
    def post(self, request):
        serializer = CreateSellOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sell_order = SellOrder.objects.create(
            seller=request.user,
            project_id=serializer.validated_data['project_id'],
            credits_for_sale=serializer.validated_data['credits_for_sale'],
            price_per_credit=serializer.validated_data['price_per_credit'],
            status='ACTIVE'
        )

        return Response(
            {
                'message': 'Sell order created successfully',
                'sell_order_id': sell_order.id
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

        # 🚫 Seller cannot buy own order
        if sell_order.seller == buyer:
            return Response(
                {'error': 'You cannot buy your own sell order'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if sell_order.credits_for_sale < credits_to_buy:
            return Response(
                {'error': 'Not enough credits available'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1️⃣ Reduce sell order credits
        sell_order.credits_for_sale -= credits_to_buy
        if sell_order.credits_for_sale == 0:
            sell_order.status = 'SOLD'
        sell_order.save()

        # 2️⃣ Add credits to buyer wallet
        CreditWallet.objects.create(
            user=buyer,
            project=sell_order.project,
            credit_type='PURCHASED',
            available_credits=credits_to_buy,
            used_credits=0
        )

        # 3️⃣ Create transaction record
        Transaction.objects.create(
            sell_order=sell_order,
            project=sell_order.project,
            seller=sell_order.seller,
            buyer=buyer,
            credits_transferred=credits_to_buy
        )

        return Response(
            {'message': 'Credits purchased successfully'},
            status=status.HTTP_200_OK
        )


# 4️⃣ CANCEL SELL ORDER (RETURN UNUSED CREDITS)
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

        # 🔁 Return credits to wallet
        wallet = CreditWallet.objects.select_for_update().get(
            user=request.user,
            project=sell_order.project,
            credit_type='ISSUED'
        )

        wallet.available_credits += remaining_credits
        wallet.used_credits -= remaining_credits
        wallet.save()

        sell_order.status = 'CANCELLED'
        sell_order.save()

        return Response(
            {'message': 'Sell order cancelled and credits returned'},
            status=status.HTTP_200_OK
        )

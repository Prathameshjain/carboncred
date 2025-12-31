from django.db import transaction
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import CreditWallet
from .serializers import (
    CreditWalletSerializer,
    CreditSummarySerializer,
    SellCreditSerializer,
    BuyCreditSerializer
)


# 1️⃣ Get Credit Summary (Dashboard)
class CreditSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        wallets = CreditWallet.objects.filter(user=user)

        total_available = wallets.aggregate(
            total=Sum('available_credits')
        )['total'] or 0

        total_used = wallets.aggregate(
            total=Sum('used_credits')
        )['total'] or 0

        issued_available = wallets.filter(
            credit_type='ISSUED'
        ).aggregate(total=Sum('available_credits'))['total'] or 0

        purchased_available = wallets.filter(
            credit_type='PURCHASED'
        ).aggregate(total=Sum('available_credits'))['total'] or 0

        data = {
            'total_available': total_available,
            'total_used': total_used,
            'issued_available': issued_available,
            'purchased_available': purchased_available
        }

        serializer = CreditSummarySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


# 2️⃣ Get Issued Credits
class IssuedCreditsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallets = CreditWallet.objects.filter(
            user=request.user,
            credit_type='ISSUED'
        )

        serializer = CreditWalletSerializer(wallets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# 3️⃣ Get Purchased Credits
class PurchasedCreditsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallets = CreditWallet.objects.filter(
            user=request.user,
            credit_type='PURCHASED'
        )

        serializer = CreditWalletSerializer(wallets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# 4️⃣ Sell Credits (Core Business Logic)
class SellCreditsView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SellCreditSerializer

    @transaction.atomic
    def post(self, request):
        serializer = SellCreditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project_id = serializer.validated_data['project_id']
        credits_to_sell = serializer.validated_data['credits_to_sell']

        try:
            wallet = CreditWallet.objects.select_for_update().get(
                user=request.user,
                project_id=project_id,
                credit_type='ISSUED'
            )
        except CreditWallet.DoesNotExist:
            return Response(
                {'error': 'Issued credits not found for this project'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if wallet.available_credits < credits_to_sell:
            return Response(
                {'error': 'Not enough available credits'},
                status=status.HTTP_400_BAD_REQUEST
            )

        wallet.available_credits -= credits_to_sell
        wallet.used_credits += credits_to_sell
        wallet.save()

        return Response(
            {'message': 'Credits marked for sale successfully'},
            status=status.HTTP_200_OK
        )


# 5️⃣ Add Purchased Credits (After Buy)
class BuyCreditsView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BuyCreditSerializer

    @transaction.atomic
    def post(self, request):
        serializer = BuyCreditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        buyer = request.user
        credits_bought = serializer.validated_data['credits_bought']

        CreditWallet.objects.create(
            user=buyer,
            project_id=None,
            credit_type='PURCHASED',
            available_credits=credits_bought,
            used_credits=0
        )

        return Response(
            {'message': 'Purchased credits added to wallet'},
            status=status.HTTP_201_CREATED
        )

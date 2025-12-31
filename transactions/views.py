# transactions/views.py

from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Transaction
from .serializers import TransactionListSerializer


class MyTransactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        transactions = Transaction.objects.filter(
            Q(buyer=user) | Q(seller=user)
        ).order_by("-timestamp")

        serializer = TransactionListSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

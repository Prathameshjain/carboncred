# transactions/serializers.py

from rest_framework import serializers
from .models import Transaction


class TransactionListSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    seller_username = serializers.CharField(source="seller.username", read_only=True)
    buyer_username = serializers.CharField(source="buyer.username", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "project_name",
            "seller_username",
            "buyer_username",
            "credits_transferred",
            "timestamp",
        ]

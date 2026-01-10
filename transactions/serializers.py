# transactions/serializers.py

from rest_framework import serializers
from .models import Transaction


class TransactionListSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source="project.id", read_only=True)
    project_name = serializers.CharField(source="project.project_name", read_only=True)
    project_type = serializers.CharField(source="project.classification", read_only=True)
    project_location = serializers.SerializerMethodField()
    seller_id = serializers.IntegerField(source="seller.id", read_only=True)
    seller_username = serializers.CharField(source="seller.username", read_only=True)
    buyer_id = serializers.IntegerField(source="buyer.id", read_only=True)
    buyer_username = serializers.CharField(source="buyer.username", read_only=True)
    price_per_credit = serializers.DecimalField(
        source="sell_order.price_per_credit", 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "project_id",
            "project_name",
            "project_type",
            "project_location",
            "seller_id",
            "seller_username",
            "buyer_id",
            "buyer_username",
            "credits_transferred",
            "price_per_credit",
            "total_amount",
            "timestamp",
        ]

    def get_project_location(self, obj):
        # Try to get location from project if it exists
        try:
            return obj.project.location if hasattr(obj.project, 'location') else "N/A"
        except:
            return "N/A"

    def get_total_amount(self, obj):
        try:
            return float(obj.credits_transferred * obj.sell_order.price_per_credit)
        except:
            return 0

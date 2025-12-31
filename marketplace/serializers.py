from rest_framework import serializers
from .models import SellOrder


class CreateSellOrderSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    credits_for_sale = serializers.IntegerField(min_value=1)
    price_per_credit = serializers.DecimalField(
        max_digits=10,
        decimal_places=2
    )


class SellOrderListSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.username', read_only=True)

    class Meta:
        model = SellOrder
        fields = [
            'id',
            'seller_name',
            'project',
            'credits_for_sale',
            'price_per_credit',
            'status',
            'created_at'
        ]


class BuyFromSellOrderSerializer(serializers.Serializer):
    sell_order_id = serializers.IntegerField()
    credits_to_buy = serializers.IntegerField(min_value=1)

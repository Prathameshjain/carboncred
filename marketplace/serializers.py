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
    seller = serializers.IntegerField(source='seller.id', read_only=True)
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True)
    project_type = serializers.CharField(source='project.classification', read_only=True, default="Carbon Credit")
    project_location = serializers.CharField(source='project.location', read_only=True, default="Global")
    project_verified = serializers.SerializerMethodField()

    class Meta:
        model = SellOrder
        fields = [
            'id',
            'seller',
            'seller_name',
            'project',
            'project_name',
            'project_type',
            'project_location',
            'project_verified',
            'credits_for_sale',
            'price_per_credit',
            'status',
            'created_at'
        ]

    def get_project_verified(self, obj):
        try:
            return obj.project.verification_status == 'VERIFIED' if obj.project else False
        except:
            return False


class BuyFromSellOrderSerializer(serializers.Serializer):
    sell_order_id = serializers.IntegerField()
    credits_to_buy = serializers.IntegerField(min_value=1)

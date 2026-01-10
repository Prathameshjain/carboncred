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
    project_name = serializers.SerializerMethodField()
    project_type = serializers.SerializerMethodField()
    project_location = serializers.SerializerMethodField()
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

    def get_project_name(self, obj):
        try:
            from projects.models import Project
            project = Project.objects.filter(id=obj.project).first()
            return project.project_name if project else f"Project #{obj.project}"
        except:
            return f"Project #{obj.project}"

    def get_project_type(self, obj):
        try:
            from projects.models import Project
            project = Project.objects.filter(id=obj.project).first()
            return project.project_type if project else "Carbon Credit"
        except:
            return "Carbon Credit"

    def get_project_location(self, obj):
        try:
            from projects.models import Project
            project = Project.objects.filter(id=obj.project).first()
            return project.location if project else "Global"
        except:
            return "Global"

    def get_project_verified(self, obj):
        try:
            from projects.models import Project
            project = Project.objects.filter(id=obj.project).first()
            return project.verification_status == 'VERIFIED' if project else False
        except:
            return False


class BuyFromSellOrderSerializer(serializers.Serializer):
    sell_order_id = serializers.IntegerField()
    credits_to_buy = serializers.IntegerField(min_value=1)

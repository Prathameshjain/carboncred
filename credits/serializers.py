from rest_framework import serializers
from .models import CreditWallet


# 1️⃣ Wallet Read Serializer (GET APIs)
# Used to SHOW wallet data to frontend
class CreditWalletSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source='project.id', read_only=True, allow_null=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True, allow_null=True)
    project_type = serializers.CharField(source='project.classification', read_only=True, allow_null=True)
    project_location = serializers.SerializerMethodField()
    blockchain_minted = serializers.SerializerMethodField()
    blockchain_tx_hash = serializers.SerializerMethodField()

    class Meta:
        model = CreditWallet
        fields = [
            'id',
            'user',
            'project_id',
            'project_name',
            'project_type',
            'project_location',
            'credit_type',
            'available_credits',
            'used_credits',
            'created_at',
            'blockchain_minted',
            'blockchain_tx_hash',
        ]
        read_only_fields = fields

    def get_project_location(self, obj):
        try:
            return obj.project.location if obj.project else None
        except:
            return None

    def get_blockchain_minted(self, obj):
        try:
            return obj.project.blockchain_minted if obj.project else False
        except:
            return False

    def get_blockchain_tx_hash(self, obj):
        try:
            return obj.project.blockchain_tx_hash if obj.project else None
        except:
            return None


# 2️⃣ Dashboard Summary Serializer
# Used to SEND calculated numbers (not DB rows)
class CreditSummarySerializer(serializers.Serializer):
    total_available = serializers.IntegerField()
    total_used = serializers.IntegerField()
    issued_available = serializers.IntegerField()
    purchased_available = serializers.IntegerField()


# 3️⃣ Sell Credits Input Serializer
# Used when user clicks "Sell"
class SellCreditSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    credits_to_sell = serializers.IntegerField(min_value=1)


# 4️⃣ Buy Credits Input Serializer
# Used after purchase is successful
class BuyCreditSerializer(serializers.Serializer):
    seller_user_id = serializers.IntegerField()
    project_id = serializers.IntegerField()
    credits_bought = serializers.IntegerField(min_value=1)

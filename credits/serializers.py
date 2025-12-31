from rest_framework import serializers
from .models import CreditWallet


# 1️⃣ Wallet Read Serializer (GET APIs)
# Used to SHOW wallet data to frontend
class CreditWalletSerializer(serializers.ModelSerializer):

    class Meta:
        model = CreditWallet
        fields = [
            'id',
            'user',
            'project_id',
            'credit_type',
            'available_credits',
            'used_credits',
            'created_at'
        ]
        read_only_fields = fields


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

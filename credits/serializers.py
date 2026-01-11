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
    portfolio_value = serializers.SerializerMethodField()

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
            'price_per_credit',
            'portfolio_value',
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
        """
        For ISSUED credits: return project's blockchain_minted flag
        For PURCHASED credits: check if purchase transaction exists
        """
        try:
            if obj.credit_type == 'PURCHASED':
                from transactions.models import Transaction
                return Transaction.objects.filter(
                    buyer=obj.user,
                    project=obj.project,
                    blockchain_tx_hash__isnull=False
                ).exclude(blockchain_tx_hash='').exists()
            else:
                return obj.project.blockchain_minted if obj.project else False
        except:
            return False

    def get_blockchain_tx_hash(self, obj):
        """
        For ISSUED credits: return project's minting tx hash
        For PURCHASED credits: return purchase transaction tx hash from direct link
        """
        try:
            if obj.credit_type == 'PURCHASED':
                # Use direct transaction link if available (new data)
                if obj.transaction and obj.transaction.blockchain_tx_hash:
                    return obj.transaction.blockchain_tx_hash
                
                # Fallback for old data without direct link - match by created_at timestamp
                from transactions.models import Transaction
                from django.db.models import Q
                from datetime import timedelta
                
                # Find transaction within 1 second of wallet creation
                time_window = timedelta(seconds=1)
                transaction = Transaction.objects.filter(
                    buyer=obj.user,
                    project=obj.project,
                    timestamp__gte=obj.created_at - time_window,
                    timestamp__lte=obj.created_at + time_window
                ).first()
                
                if transaction and transaction.blockchain_tx_hash:
                    return transaction.blockchain_tx_hash
                return None
            else:
                # For ISSUED credits, return project minting hash
                return obj.project.blockchain_tx_hash if obj.project else None
        except:
            return None

    def get_portfolio_value(self, obj):
        """
        Calculate portfolio value in INR:
        - PURCHASED: available_credits × price_per_credit (actual purchase price)
        - ISSUED: available_credits × price_per_credit (if sold) or default rate
        """
        DEFAULT_RATE = 1500  # ₹1500 per credit default
        
        try:
            total_credits = obj.available_credits + obj.used_credits
            
            if obj.price_per_credit:
                # Use stored price (from purchase or sale)
                return float(obj.price_per_credit) * total_credits
            elif obj.credit_type == 'PURCHASED' and obj.transaction:
                # Fallback: get price from related sell order
                from marketplace.models import SellOrder
                if obj.transaction.sell_order:
                    return float(obj.transaction.sell_order.price_per_credit) * total_credits
            
            # Default rate for ISSUED credits with no sale history
            return DEFAULT_RATE * total_credits
        except:
            return DEFAULT_RATE * (obj.available_credits + obj.used_credits)


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

from django.contrib import admin
from .models import CreditWallet

@admin.register(CreditWallet)
class CreditWalletAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'project_id',
        'credit_type',
        'available_credits',
        'used_credits',
        'created_at'
    )
    list_filter = ('credit_type',)
    search_fields = ('user__username', 'user__email', 'project_id')

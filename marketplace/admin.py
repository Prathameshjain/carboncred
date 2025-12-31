# marketplace/admin.py

from django.contrib import admin
from .models import SellOrder

@admin.register(SellOrder)
class SellOrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'seller',
        'project',
        'credits_for_sale',
        'price_per_credit',
        'status',
        'created_at',
    )

    list_filter = ('status', 'created_at')
    search_fields = ('seller__username', 'project__project_name')

# transactions/admin.py

from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "project",
        "seller",
        "buyer",
        "credits_transferred",
        "timestamp",
    )
    readonly_fields = list_display

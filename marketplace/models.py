# marketplace/models.py

from django.db import models
from django.contrib.auth.models import User
from projects.models import Project

class SellOrder(models.Model):

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('SOLD', 'Sold'),
        ('CANCELLED', 'Cancelled'),
    ]

    seller = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='sell_orders'
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name='sell_orders'
    )

    credits_for_sale = models.PositiveIntegerField()

    price_per_credit = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )

    # ========== BLOCKCHAIN INTEGRATION ==========
    blockchain_tx_hash = models.CharField(
        max_length=66, null=True, blank=True,
        help_text="Transaction hash from blockchain sell order creation"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} | {self.credits_for_sale} credits"

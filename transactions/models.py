# transactions/models.py

from django.db import models
from django.contrib.auth.models import User
from projects.models import Project
from marketplace.models import SellOrder

class Transaction(models.Model):
    sell_order = models.ForeignKey(
        SellOrder,
        on_delete=models.PROTECT,
        related_name="transactions"
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name="transactions"
    )

    seller = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="credits_sold"
    )

    buyer = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="credits_bought"
    )

    credits_transferred = models.PositiveIntegerField()

    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Tx #{self.id} | {self.credits_transferred} credits"

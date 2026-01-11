from django.db import models
from django.contrib.auth.models import User

class CreditWallet(models.Model):

    CREDIT_TYPE_CHOICES = (
        ('ISSUED', 'Issued'),
        ('PURCHASED', 'Purchased'),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='credit_wallets'
    )

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    credit_type = models.CharField(
        max_length=10,
        choices=CREDIT_TYPE_CHOICES
    )

    available_credits = models.PositiveIntegerField()
    used_credits = models.PositiveIntegerField(default=0)

    # Link to the transaction that created this wallet entry (for PURCHASED credits)
    transaction = models.ForeignKey(
        'transactions.Transaction',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='credit_wallets',
        help_text="The transaction that created this credit entry (for purchased credits)"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'project', 'credit_type']),
        ]

    def __str__(self):
        return f"{self.user_id} | {self.credit_type} | {self.available_credits}"

from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    name = models.CharField(max_length=255)
    email = models.EmailField()
    registration_no = models.CharField(max_length=100, unique=True)
    registration_year = models.PositiveIntegerField()
    owner_name = models.CharField(max_length=255)

    phone = models.CharField(max_length=20)

    pan_id = models.CharField(max_length=20, unique=True)
    metamask_wallet_address = models.CharField(max_length=255, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'name',
        'email',
        'registration_no',
        'registration_year',
        'phone',
        'metamask_wallet_address',
        'created_at'
    )

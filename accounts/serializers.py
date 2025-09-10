from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile

class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    company_name = serializers.CharField(write_only=True)
    location = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=Profile.ROLE_CHOICES, write_only=True)
    active_since = serializers.DateField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2',
                  'company_name', 'location', 'phone', 'role', 'active_since')
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.pop("password2")

        company_name = validated_data.pop("company_name")
        location = validated_data.pop("location")
        phone = validated_data.pop("phone")
        role = validated_data.pop("role")
        active_since = validated_data.pop("active_since")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=password
        )

        Profile.objects.create(
            user=user,
            company_name=company_name,
            location=location,
            phone=phone,
            role=role,
            active_since=active_since
        )

        return user

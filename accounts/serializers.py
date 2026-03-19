from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import Profile

class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    # Profile fields
    name = serializers.CharField(write_only=True)
    registration_no = serializers.CharField(write_only=True)
    registration_year = serializers.IntegerField(write_only=True)
    owner_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)
    pan_id = serializers.CharField(write_only=True)
    metamask_wallet_address = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'password',
            'password2',
            'name',
            'registration_no',
            'registration_year',
            'owner_name',
            'phone',
            'pan_id',
            'metamask_wallet_address'
        )
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        import re
        from datetime import datetime

        # Password match
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "Passwords do not match."})

        # Username — 3–30 chars, alphanumeric + underscore
        username = data.get('username', '')
        if len(username) < 3 or len(username) > 30:
            raise serializers.ValidationError({"username": "Username must be 3–30 characters."})
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            raise serializers.ValidationError({"username": "Username can only contain letters, numbers, and underscores."})

        # Phone — Indian mobile (starts 6-9, 10 digits)
        phone = data.get('phone', '')
        if not re.match(r'^[6-9]\d{9}$', phone):
            raise serializers.ValidationError({"phone": "Enter a valid 10-digit Indian mobile number."})

        # PAN — 5 letters, 4 digits, 1 letter
        pan = data.get('pan_id', '').upper()
        if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', pan):
            raise serializers.ValidationError({"pan_id": "PAN must be in format ABCDE1234F."})
        data['pan_id'] = pan  # normalize to uppercase

        # MetaMask wallet
        wallet = data.get('metamask_wallet_address', '')
        if not re.match(r'^0x[a-fA-F0-9]{40}$', wallet):
            raise serializers.ValidationError({"metamask_wallet_address": "Enter a valid Ethereum wallet address (0x + 40 hex chars)."})

        # Registration year
        current_year = datetime.now().year
        year = data.get('registration_year', 0)
        if not year or year < 1800 or year > current_year:
            raise serializers.ValidationError({"registration_year": f"Registration year must be between 1800 and {current_year}."})

        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.pop("password2")

        name = validated_data.pop("name")
        registration_no = validated_data.pop("registration_no")
        registration_year = validated_data.pop("registration_year")
        owner_name = validated_data.pop("owner_name")
        phone = validated_data.pop("phone")
        pan_id = validated_data.pop("pan_id")
        metamask_wallet_address = validated_data.pop("metamask_wallet_address")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=password
        )

        Profile.objects.create(
            user=user,
            name=name,
            email=user.email,
            registration_no=registration_no,
            registration_year=registration_year,
            owner_name=owner_name,
            phone=phone,
            pan_id=pan_id,
            metamask_wallet_address=metamask_wallet_address
        )

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        data['user'] = user
        return data


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'user_id',
            'username',
            'name',
            'email',
            'registration_no',
            'registration_year',
            'owner_name',
            'phone',
            'pan_id',
            'metamask_wallet_address',
            'created_at',
        ]
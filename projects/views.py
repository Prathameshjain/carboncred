
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Project
from django.contrib.auth.models import User
from accounts.models import Profile
from rest_framework import serializers

class ProjectSerializer(serializers.ModelSerializer):
	class Meta:
		model = Project
		fields = [
			"id", "title", "type", "location", "budget", "plannedCredits",
			"status", "createdAt"
		]
		read_only_fields = ["id", "status", "createdAt"]

	def to_representation(self, instance):
		rep = super().to_representation(instance)
		rep["id"] = f"proj_{instance.id}"
		return rep

class IsIssuer(permissions.BasePermission):
	def has_permission(self, request, view):
		if not request.user.is_authenticated:
			return False
		try:
			return request.user.profile.role == "issuer"
		except Profile.DoesNotExist:
			return False

class ProjectCreateAPIView(generics.CreateAPIView):
	serializer_class = ProjectSerializer
	permission_classes = [permissions.IsAuthenticated, IsIssuer]

	def perform_create(self, serializer):
		serializer.save(issuer=self.request.user)

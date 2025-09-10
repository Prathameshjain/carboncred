
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Project
from django.contrib.auth.models import User
from accounts.models import Profile
from rest_framework import serializers



class ProjectDetailSerializer(serializers.ModelSerializer):
	impactScore = serializers.SerializerMethodField()
	evidenceFiles = serializers.SerializerMethodField()

	class Meta:
		model = Project
		fields = [
			"id", "title", "type", "location", "budget", "plannedCredits",
			"status", "impactScore", "evidenceFiles", "createdAt"
		]

	def get_impactScore(self, obj):
		# Placeholder: implement actual impact score logic if available
		return getattr(obj, "impactScore", None)

	def get_evidenceFiles(self, obj):
		# Placeholder: return a list of IPFS hashes if available
		return getattr(obj, "evidenceFiles", [])

class ProjectListSerializer(serializers.ModelSerializer):
	impactScore = serializers.SerializerMethodField()
	location = serializers.SerializerMethodField()

	class Meta:
		model = Project
		fields = ["id", "title", "type", "location", "status", "impactScore"]

	def get_impactScore(self, obj):
		return getattr(obj, "impactScore", None)

	def get_location(self, obj):
		loc = obj.location
		if isinstance(loc, dict):
			if "region" in loc:
				return loc["region"]
			if "latitude" in loc and "longitude" in loc:
				return f"Lat: {loc['latitude']}, Lon: {loc['longitude']}"
		return str(loc)
from rest_framework.generics import RetrieveAPIView

class ProjectDetailAPIView(RetrieveAPIView):
	queryset = Project.objects.all()
	serializer_class = ProjectDetailSerializer
	lookup_field = "id"

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
from rest_framework import filters

class ProjectListAPIView(generics.ListAPIView):
	serializer_class = ProjectListSerializer
	queryset = Project.objects.all()
	filter_backends = [filters.OrderingFilter]

	def get_queryset(self):
		qs = Project.objects.all()
		user = self.request.user
		params = self.request.query_params

		# Filtering by status, type, region
		status_param = params.get("status")
		type_param = params.get("type")
		region_param = params.get("region")

		if status_param:
			qs = qs.filter(status=status_param)
		if type_param:
			qs = qs.filter(type=type_param)
		if region_param:
			qs = qs.filter(location__region__icontains=region_param)

		# Role-based visibility
		if user.is_authenticated:
			try:
				role = user.profile.role
				if role == "buyer":
					qs = qs.filter(status="approved")
				# regulators see all, issuers see their own + all?
			except Profile.DoesNotExist:
				qs = qs.none()
		else:
			# Unauthenticated users see only approved
			qs = qs.filter(status="approved")

		return qs

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

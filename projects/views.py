from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
import datetime
import random

# Minimal serializer for evidence upload
class EvidenceUploadSerializer(serializers.Serializer):
	file = serializers.FileField()
	type = serializers.ChoiceField(choices=["satellite", "drone", "document"])

# Minimal mock IPFS upload function
def mock_ipfs_upload(file):
	# In real use, upload to IPFS and return the hash
	return f"Qm{random.randint(10000,99999)}abc"

# Evidence upload API view
class ProjectEvidenceUploadAPIView(APIView):
	parser_classes = [MultiPartParser, FormParser]
	permission_classes = [IsAuthenticated]

	@swagger_auto_schema(operation_id="projects_upload_evidence", request_body=EvidenceUploadSerializer, responses={200: "Evidence uploaded"})
	def post(self, request, id):
		serializer = EvidenceUploadSerializer(data=request.data)
		if serializer.is_valid():
			uploaded_file = serializer.validated_data["file"]
			print(f"[UPLOAD] Project ID: {id}, File name: {uploaded_file.name}, Size: {uploaded_file.size} bytes, Content type: {uploaded_file.content_type}")
			# Mock IPFS upload
			ipfs_hash = mock_ipfs_upload(uploaded_file)
			file_url = f"ipfs://{ipfs_hash}"
			uploaded_at = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
			return Response({
				"projectId": f"proj_{id}",
				"fileUrl": file_url,
				"uploadedAt": uploaded_at
			}, status=status.HTTP_200_OK)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
from rest_framework.generics import UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework import serializers
from django.utils import timezone
from .models import Project
from drf_yasg.utils import swagger_auto_schema

class ProjectUpdateSerializer(serializers.ModelSerializer):
	updatedAt = serializers.DateTimeField(read_only=True)

	class Meta:
		model = Project
		fields = ["id", "budget", "plannedCredits", "updatedAt"]
		read_only_fields = ["id", "updatedAt"]

class ProjectUpdateAPIView(UpdateAPIView):
	@swagger_auto_schema(operation_id="projects_update_Full")
	def put(self, request, *args, **kwargs):
		return super().put(request, *args, **kwargs)

	@swagger_auto_schema(operation_id="projects_update_Selective")
	def patch(self, request, *args, **kwargs):
		return super().patch(request, *args, **kwargs)

	def get_view_name(self):
		if self.request and self.request.method == "PUT":
			return "projects_update_Full"
		elif self.request and self.request.method == "PATCH":
			return "projects_update_Selective"
		return super().get_view_name()

	queryset = Project.objects.all()
	serializer_class = ProjectUpdateSerializer
	lookup_field = "id"
	permission_classes = [IsAuthenticated]

	def get_object(self):
		obj = super().get_object()
		user = self.request.user
		# Only issuer who owns the project can update
		if not hasattr(user, "profile") or user.profile.role != "issuer" or obj.issuer != user:
			raise PermissionDenied("Only the issuer who created this project can update it.")
		# Only if not verified/approved
		if obj.status == "approved":
			raise PermissionDenied("Cannot update a verified/approved project.")
		return obj

	def perform_update(self, serializer):
		serializer.save(updatedAt=timezone.now())

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Project
from django.contrib.auth.models import User
from accounts.models import Profile



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
	@swagger_auto_schema(operation_id="projects_byid_read")
	def get(self, request, *args, **kwargs):
		return super().get(request, *args, **kwargs)

	def get_view_name(self):
		return "projects_byid_read"

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
	@swagger_auto_schema(operation_id="projects_list_all")
	def get(self, request, *args, **kwargs):
		return super().get(request, *args, **kwargs)

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
	@swagger_auto_schema(operation_id="projects_create")
	def post(self, request, *args, **kwargs):
		return super().post(request, *args, **kwargs)

	def get_view_name(self):
		return "projects_create"

	serializer_class = ProjectSerializer
	permission_classes = [permissions.IsAuthenticated, IsIssuer]

	def perform_create(self, serializer):
		serializer.save(issuer=self.request.user)

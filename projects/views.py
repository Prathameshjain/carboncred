from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Project, ProjectImage
from .serializers import (
    ProjectSerializer,
    ProjectImageSerializer,
    ProjectCreateSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer
)
from .verification_service import verification_service


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing projects with ML verification integration.
    
    Endpoints:
        GET /projects/ - List all projects for the user
        POST /projects/ - Create a new project with images (triggers ML verification)
        GET /projects/{id}/ - Get project details
        PUT /projects/{id}/ - Update project (not verification fields)
        DELETE /projects/{id}/ - Delete project
        POST /projects/{id}/reverify/ - Re-run verification
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        """Only return projects of logged-in user."""
        return Project.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ProjectCreateSerializer
        elif self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['retrieve', 'reverify']:
            return ProjectDetailSerializer
        return ProjectSerializer

    def create(self, request, *args, **kwargs):
        """
        Create a new project with images and automatically trigger ML verification.
        
        Request (multipart/form-data):
            - project_name: string (required)
            - classification: SOLAR | VEGETATION | PLANTATION | METHANE (required)
            - project_area_hectares: decimal (required)
            - project_cost_lakh_inr: decimal (required)
            - claimed_improvement_pct: decimal (required)
            - project_latitude: decimal (optional)
            - project_longitude: decimal (optional)
            - before_image: file (required - at least one image)
            - after_image: file (optional)
            - before_image_date: date YYYY-MM-DD (optional)
            - after_image_date: date YYYY-MM-DD (optional)
        
        Response includes full verification result with all ML metrics.
        """
        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        validated_data = serializer.validated_data
        
        # Extract image data (not part of Project model)
        before_image = validated_data.pop('before_image', None)
        after_image = validated_data.pop('after_image', None)
        before_image_date = validated_data.pop('before_image_date', None)
        after_image_date = validated_data.pop('after_image_date', None)
        
        # Collect image files for verification
        image_files = []
        if before_image:
            image_files.append({
                'file': before_image,
                'type': 'BEFORE',
                'date': before_image_date
            })
        if after_image:
            image_files.append({
                'file': after_image,
                'type': 'AFTER',
                'date': after_image_date
            })
        
        # Run ML verification with images
        try:
            verification_response = verification_service.verify_project(
                project_name=validated_data['project_name'],
                classification=validated_data['classification'],
                project_area_hectares=float(validated_data['project_area_hectares']),
                project_cost_lakh_inr=float(validated_data['project_cost_lakh_inr']),
                claimed_improvement_pct=float(validated_data['claimed_improvement_pct']),
                project_latitude=float(validated_data.get('project_latitude')) if validated_data.get('project_latitude') else None,
                project_longitude=float(validated_data.get('project_longitude')) if validated_data.get('project_longitude') else None,
                image_files=image_files,
            )
            
            # Map verification result to model fields
            verification_fields = verification_service.map_result_to_model_fields(
                verification_response,
                validated_data['classification']
            )
            
        except Exception as e:
            # If verification fails, still create project with PENDING status
            verification_fields = {
                'final_decision': 'PENDING',
                'explanation': f'Verification failed: {str(e)}',
                'decision_reasons': [f'Error: {str(e)}'],
            }
        
        # Create the project with user input + verification results
        project = Project.objects.create(
            user=request.user,
            **validated_data,
            **verification_fields
        )
        
        # Save uploaded images to ProjectImage model
        for img_data in image_files:
            ProjectImage.objects.create(
                project=project,
                image_file=img_data['file'],
                image_type=img_data['type'],
                captured_date=img_data['date']
            )
        
        # Return full project details
        response_serializer = ProjectDetailSerializer(project)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def reverify(self, request, pk=None):
        """
        Re-run ML verification on an existing project.
        
        Uses the images already uploaded for this project.
        
        Useful when:
        - New images have been uploaded
        - Verification algorithm has been updated
        - Manual review requested re-verification
        """
        project = self.get_object()
        
        # Get existing images for this project
        project_images = project.images.all()
        image_files = []
        for img in project_images:
            if img.image_file:
                image_files.append({
                    'file': img.image_file,
                    'type': img.image_type,
                    'date': img.captured_date
                })
        
        try:
            # Run verification with current project data and images
            verification_response = verification_service.verify_project(
                project_name=project.project_name,
                classification=project.classification,
                project_area_hectares=float(project.project_area_hectares),
                project_cost_lakh_inr=float(project.project_cost_lakh_inr),
                claimed_improvement_pct=float(project.claimed_improvement_pct),
                project_latitude=float(project.project_latitude) if project.project_latitude else None,
                project_longitude=float(project.project_longitude) if project.project_longitude else None,
                image_files=image_files,
            )
            
            # Map results to model fields
            verification_fields = verification_service.map_result_to_model_fields(
                verification_response,
                project.classification
            )
            
            # Update project with new verification results
            for field, value in verification_fields.items():
                setattr(project, field, value)
            project.save()
            
            serializer = ProjectDetailSerializer(project)
            return Response({
                'message': 'Project re-verified successfully',
                'project': serializer.data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Verification failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProjectImageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project images."""
    
    serializer_class = ProjectImageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only return images of user's projects."""
        return ProjectImage.objects.filter(
            project__user=self.request.user
        )
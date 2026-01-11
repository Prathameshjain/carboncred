from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from .models import Project, ProjectImage
from .serializers import (
    ProjectSerializer,
    ProjectImageSerializer,
    ProjectCreateSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer
)
from .verification_service import verification_service
from credits.models import CreditWallet


def calculate_credits_from_project(project):
    """
    Calculate the number of carbon credits to issue based on project verification data.
    
    Credit calculation logic:
    - For VEGETATION: Based on estimated_co2_tco2_year (1 credit = 1 tCO2)
    - For SOLAR: Based on avoided_co2_tco2_year (1 credit = 1 tCO2)
    
    Returns:
        int: Number of credits to issue (0 if not verified)
    """
    if project.final_decision != 'VERIFIED':
        return 0
    
    classification = project.classification.upper()
    
    if classification in ['VEGETATION', 'PLANTATION']:
        # Vegetation projects: credits based on carbon sequestration
        co2_value = project.estimated_co2_tco2_year or 0
        credits = int(co2_value)  # 1 credit per tCO2/year
    elif classification == 'SOLAR':
        # Solar projects: credits based on avoided CO2
        co2_value = project.avoided_co2_tco2_year or project.estimated_co2_tco2_year or 0
        credits = int(co2_value)  # 1 credit per tCO2/year
    elif classification == 'METHANE':
        # Methane projects: credits based on CO2 equivalent
        co2_value = project.estimated_co2_tco2_year or 0
        credits = int(co2_value)
    else:
        credits = 0
    
    return max(0, credits)  # Ensure non-negative


def issue_credits_to_wallet(user, project, credits_amount):
    """
    Issue credits to user's wallet for a verified project.
    
    Creates a CreditWallet entry with type='ISSUED' linked to the project.
    Updates the project's credits_issued field.
    Also mints tokens on blockchain if user has MetaMask wallet configured.
    
    Args:
        user: Django User instance
        project: Project instance
        credits_amount: Number of credits to issue
    
    Returns:
        CreditWallet instance or None if no credits to issue
    """
    if credits_amount <= 0:
        return None
    
    # Check if credits already issued for this project
    existing_wallet = CreditWallet.objects.filter(
        user=user,
        project=project,
        credit_type='ISSUED'
    ).first()
    
    if existing_wallet:
        # Credits already issued for this project
        return existing_wallet
    
    # Create new wallet entry for issued credits
    wallet = CreditWallet.objects.create(
        user=user,
        project=project,
        credit_type='ISSUED',
        available_credits=credits_amount,
        used_credits=0
    )
    
    # Update project's credits_issued field
    project.credits_issued = credits_amount
    project.save(update_fields=['credits_issued'])
    
    # === BLOCKCHAIN INTEGRATION ===
    # Mint tokens on blockchain if user has MetaMask wallet
    try:
        from blockchain.services import blockchain_service, BLOCKCHAIN_ENABLED
        
        if BLOCKCHAIN_ENABLED and hasattr(user, 'profile') and user.profile.metamask_wallet_address:
            from datetime import datetime
            
            tx_hash = blockchain_service.mint_credits(
                owner_wallet=user.profile.metamask_wallet_address,
                amount=credits_amount,
                project_id=project.id,
                vintage_year=datetime.now().year
            )
            
            if tx_hash:
                # Store blockchain tx hash on project (requires model update)
                if hasattr(project, 'blockchain_tx_hash'):
                    project.blockchain_tx_hash = tx_hash
                    project.blockchain_minted = True
                    project.save(update_fields=['blockchain_tx_hash', 'blockchain_minted'])
                    
    except ImportError:
        # Blockchain module not available, continue without
        pass
    except Exception as e:
        # Log error but don't fail the credit issuance
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Blockchain minting failed for project {project.id}: {e}")
    
    return wallet


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

    @transaction.atomic
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
        If verified, credits are automatically issued to user's wallet.
        """
        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        validated_data = serializer.validated_data
        
        # Check for duplicate project name for this user
        project_name = validated_data.get('project_name')
        if Project.objects.filter(user=request.user, project_name=project_name).exists():
            return Response(
                {'detail': f'You already have a project named "{project_name}". Please use a different name.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
        
        # Issue credits to wallet if project is VERIFIED
        if project.final_decision == 'VERIFIED':
            credits_amount = calculate_credits_from_project(project)
            if credits_amount > 0:
                issue_credits_to_wallet(request.user, project, credits_amount)
        
        # Return full project details
        response_serializer = ProjectDetailSerializer(project)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def reverify(self, request, pk=None):
        """
        Re-run ML verification on an existing project.
        
        Uses the images already uploaded for this project.
        
        Useful when:
        - New images have been uploaded
        - Verification algorithm has been updated
        - Manual review requested re-verification
        
        If verification changes to VERIFIED, credits are issued to wallet.
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
            
            # Issue credits to wallet if project is now VERIFIED
            if project.final_decision == 'VERIFIED':
                credits_amount = calculate_credits_from_project(project)
                if credits_amount > 0:
                    issue_credits_to_wallet(request.user, project, credits_amount)
            
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
from rest_framework import serializers
from .models import Project, ProjectImage


class ProjectImageSerializer(serializers.ModelSerializer):
    """Serializer for project images."""
    
    class Meta:
        model = ProjectImage
        fields = [
            'id',
            'project',
            'image_type',
            'image_file',
            'captured_date',
            'created_at'
        ]
        read_only_fields = ['created_at']


class ProjectImageUploadSerializer(serializers.Serializer):
    """Serializer for image upload within project creation."""
    image_file = serializers.ImageField()
    image_type = serializers.ChoiceField(
        choices=['BEFORE', 'AFTER', 'SATELLITE', 'DRONE'],
        default='SATELLITE'
    )
    captured_date = serializers.DateField(required=False, allow_null=True)


class ProjectCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new project with images.
    Accepts user input fields and images - verification fields are auto-populated.
    """
    
    # Image fields for multipart upload
    before_image = serializers.ImageField(required=False, write_only=True)
    after_image = serializers.ImageField(required=False, write_only=True)
    before_image_date = serializers.DateField(required=False, write_only=True)
    after_image_date = serializers.DateField(required=False, write_only=True)
    
    class Meta:
        model = Project
        fields = [
            'project_name',
            'classification',
            'project_area_hectares',
            'project_cost_lakh_inr',
            'claimed_improvement_pct',
            'project_latitude',
            'project_longitude',
            # Image upload fields
            'before_image',
            'after_image',
            'before_image_date',
            'after_image_date',
            # Plantation numeric inputs
            'tree_count', 'avg_dbh_mm', 'avg_height_cm', 'species_factor',
            # Solar numeric inputs
            'energy_generated_kwh', 'grid_emission_factor', 'solar_efficiency_pct',
            # Methane numeric inputs
            'biogas_volume_m3_year', 'methane_fraction_pct', 'biogas_plant_capacity_kw',
            # Cookstove numeric inputs
            'stoves_count', 'wood_saved_kg_per_stove_year', 'fnrb_scaled',
            'wood_emission_factor_scaled', 'cookstove_efficiency_pct',
            # Wind numeric inputs
            'wind_energy_generated_kwh', 'wind_grid_emission_factor',
            'wind_turbine_efficiency_pct', 'wind_turbine_count',
        ]
    
    def validate_classification(self, value):
        """Ensure classification is valid."""
        valid_choices = ['SOLAR', 'VEGETATION', 'PLANTATION', 'METHANE', 'COOKSTOVE', 'WIND']
        if value.upper() not in valid_choices:
            raise serializers.ValidationError(
                f"Invalid classification. Must be one of: {', '.join(valid_choices)}"
            )
        return value.upper()
    
    def validate_project_area_hectares(self, value):
        """Ensure area is positive."""
        if value <= 0:
            raise serializers.ValidationError("Project area must be greater than 0.")
        return value
    
    def validate_claimed_improvement_pct(self, value):
        """Ensure claimed improvement is reasonable."""
        if value < 0 or value > 100:
            raise serializers.ValidationError(
                "Claimed improvement percentage must be between 0 and 100."
            )
        return value
    
    def validate(self, data):
        """Domain-aware validation for images and required numeric fields."""
        IMAGE_REQUIRED   = {'SOLAR', 'VEGETATION', 'PLANTATION'}
        PHOTO_REQUIRED   = {'COOKSTOVE'}
        NUMERIC_REQUIRED = {
            'METHANE':  'biogas_volume_m3_year',
            'WIND':     'wind_energy_generated_kwh',
        }

        classification = data.get('classification', '').upper()
        before_image   = data.get('before_image')
        after_image    = data.get('after_image')

        if classification in IMAGE_REQUIRED:
            if not before_image and not after_image:
                raise serializers.ValidationError({
                    'before_image': 'At least one image is required for this domain.'
                })
        elif classification in PHOTO_REQUIRED:
            if not before_image and not after_image:
                raise serializers.ValidationError({
                    'before_image': 'Geotagged photos are mandatory for cookstove verification.'
                })
        elif classification in NUMERIC_REQUIRED:
            required_field = NUMERIC_REQUIRED[classification]
            if not data.get(required_field):
                raise serializers.ValidationError({
                    required_field: f'This field is required for {classification} projects.'
                })

        return data


class ProjectDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for reading project details including all verification data.
    """
    
    images = ProjectImageSerializer(many=True, read_only=True)
    project_owner_name = serializers.CharField(
        source='user.username',
        read_only=True
    )
    project_type = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            # Basic info
            'id',
            'project_name',
            'project_owner_name',
            'classification',
            'project_type',
            
            # User inputs
            'project_area_hectares',
            'project_cost_lakh_inr',
            'claimed_improvement_pct',
            'project_latitude',
            'project_longitude',
            
            # Verification report metadata
            'report_id',
            'generated_at',
            'final_decision',
            'confidence_score',
            'claim_alignment',
            'explanation',
            'decision_reasons',
            
            # Common metrics
            'area_hectares',
            'estimated_co2_tco2_year',
            'claim_gap_pct',
            
            # Vegetation metrics
            'vegetation_score',
            'mean_iou',
            'mean_dice',
            'temporal_consistency',
            'vegetation_coverage_pct',
            'vegetation_growth_pct',
            'ndvi_change',
            'soil_health_index',
            'aqi_improvement_proxy',
            
            # Solar metrics
            'solar_probability',
            'estimated_panel_area_m2',
            'estimated_energy_mwh_year',
            'avoided_co2_tco2_year',
            'land_use_conflict',

            # Domain numeric inputs
            'tree_count', 'avg_dbh_mm', 'avg_height_cm', 'species_factor',
            'energy_generated_kwh', 'grid_emission_factor', 'solar_efficiency_pct',
            'biogas_volume_m3_year', 'methane_fraction_pct', 'biogas_plant_capacity_kw',
            'stoves_count', 'wood_saved_kg_per_stove_year', 'fnrb_scaled',
            'wood_emission_factor_scaled', 'cookstove_efficiency_pct',
            'wind_energy_generated_kwh', 'wind_grid_emission_factor',
            'wind_turbine_efficiency_pct', 'wind_turbine_count',

            # Computed output fields
            'formula_computed_credits', 'ml_estimated_credits', 'cross_check_gap_pct',
            
            # Credits
            'credits_issued',
            
            # Blockchain
            'blockchain_minted',
            'blockchain_tx_hash',
            
            # Full JSON (optional, for debugging)
            'verification_result_json',
            
            # Timestamps
            'created_at',
            'updated_at',
            
            # Related images
            'images',
        ]
        read_only_fields = [
            'id', 'project_owner_name', 'report_id', 'generated_at',
            'final_decision', 'confidence_score', 'claim_alignment',
            'explanation', 'decision_reasons', 'area_hectares',
            'estimated_co2_tco2_year', 'vegetation_score', 'mean_iou',
            'mean_dice', 'temporal_consistency', 'vegetation_coverage_pct',
            'vegetation_growth_pct', 'ndvi_change', 'soil_health_index',
            'aqi_improvement_proxy', 'claim_gap_pct', 'solar_probability',
            'estimated_panel_area_m2', 'estimated_energy_mwh_year',
            'avoided_co2_tco2_year', 'land_use_conflict',
            'formula_computed_credits', 'ml_estimated_credits', 'cross_check_gap_pct',
            'credits_issued', 'blockchain_minted', 'blockchain_tx_hash',
            'verification_result_json', 'created_at', 'updated_at', 'images'
        ]
    
    def get_project_type(self, obj):
        """Return ML project type based on classification."""
        mapping = {
            'SOLAR':      'solar',
            'VEGETATION': 'vegetation',
            'PLANTATION': 'vegetation',
            'METHANE':    'methane',
            'COOKSTOVE':  'cookstove',
            'WIND':       'wind',
        }
        return mapping.get(obj.classification, 'unknown')


class ProjectListSerializer(serializers.ModelSerializer):
    """
    Compact serializer for listing projects.
    """
    
    project_owner_name = serializers.CharField(
        source='user.username',
        read_only=True
    )
    
    class Meta:
        model = Project
        fields = [
            'id',
            'project_name',
            'project_owner_name',
            'classification',
            'final_decision',
            'confidence_score',
            'claim_alignment',
            'estimated_co2_tco2_year',
            'credits_issued',
            'report_id',
            'project_area_hectares',
            'project_cost_lakh_inr',
            'claimed_improvement_pct',
            'explanation',
            'created_at',
            # Blockchain fields for displaying blockchain record in verification reports
            'blockchain_minted',
            'blockchain_tx_hash',
            # Domain numeric inputs
            'tree_count', 'avg_dbh_mm', 'avg_height_cm', 'species_factor',
            'energy_generated_kwh', 'grid_emission_factor', 'solar_efficiency_pct',
            'biogas_volume_m3_year', 'methane_fraction_pct', 'biogas_plant_capacity_kw',
            'stoves_count', 'wood_saved_kg_per_stove_year', 'fnrb_scaled',
            'wood_emission_factor_scaled', 'cookstove_efficiency_pct',
            'wind_energy_generated_kwh', 'wind_grid_emission_factor',
            'wind_turbine_efficiency_pct', 'wind_turbine_count',
            # Computed output fields
            'formula_computed_credits', 'ml_estimated_credits', 'cross_check_gap_pct',
        ]


class ProjectSerializer(serializers.ModelSerializer):
    """
    Legacy serializer for backward compatibility.
    """
    
    images = ProjectImageSerializer(many=True, read_only=True)
    project_owner_name = serializers.CharField(
        source='user.username',
        read_only=True
    )

    class Meta:
        model = Project
        fields = [
            'id',
            'report_id',
            'project_name',
            'project_owner_name',
            'classification',
            'final_decision',
            'confidence_score',
            'claim_alignment',
            'decision_reasons',
            'area_hectares',
            'estimated_co2_tco2_year',
            'credits_issued',
            'created_at',
            'images'
        ]

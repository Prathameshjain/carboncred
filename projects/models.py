from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    """
    Project model that stores both user-submitted project data and 
    ML verification results.
    """
    
    CLASSIFICATION_CHOICES = [
        ('SOLAR',      'Solar'),
        ('VEGETATION', 'Vegetation'),
        ('PLANTATION', 'Plantation'),
        ('METHANE',    'Methane'),
        ('COOKSTOVE',  'Cookstove / ICS'),
        ('WIND',       'Wind Energy'),
    ]

    FINAL_DECISION_CHOICES = [
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
        ('REVIEW_REQUIRED', 'Review Required'),
        ('PENDING', 'Pending'),
    ]

    CLAIM_ALIGNMENT_CHOICES = [
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
    ]

    # Owner
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='projects'
    )

    # ========== USER INPUT FIELDS ==========
    project_name = models.CharField(max_length=255)
    classification = models.CharField(max_length=20, choices=CLASSIFICATION_CHOICES)
    
    # Project area and cost
    project_area_hectares = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=0,
        help_text="Project area in hectares"
    )
    project_cost_lakh_inr = models.DecimalField(
        max_digits=12, decimal_places=2,
        default=0,
        help_text="Project cost in Lakh INR"
    )
    
    # User's claimed improvement percentage
    claimed_improvement_pct = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=0,
        help_text="User's claimed improvement percentage"
    )
    
    # Project coordinates (optional)
    project_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    project_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )

    # ========== ML VERIFICATION REPORT FIELDS ==========
    # Report metadata
    report_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    generated_at = models.DateTimeField(null=True, blank=True)

    # Decision fields
    final_decision = models.CharField(
        max_length=20,
        choices=FINAL_DECISION_CHOICES,
        default='PENDING'
    )
    confidence_score = models.DecimalField(
        max_digits=5, decimal_places=4, null=True, blank=True
    )
    claim_alignment = models.CharField(
        max_length=20,
        choices=CLAIM_ALIGNMENT_CHOICES,
        null=True, blank=True
    )

    # Explanation and reasons
    explanation = models.TextField(null=True, blank=True)
    decision_reasons = models.JSONField(default=list, blank=True)

    # ========== COMMON KEY METRICS ==========
    # Area (from verification - may differ from user input)
    area_hectares = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    
    # Estimated CO2 impact
    estimated_co2_tco2_year = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )

    # ========== VEGETATION-SPECIFIC METRICS ==========
    vegetation_score = models.DecimalField(
        max_digits=5, decimal_places=4, null=True, blank=True
    )
    mean_iou = models.DecimalField(
        max_digits=5, decimal_places=4, null=True, blank=True
    )
    mean_dice = models.DecimalField(
        max_digits=5, decimal_places=4, null=True, blank=True
    )
    temporal_consistency = models.DecimalField(
        max_digits=5, decimal_places=4, null=True, blank=True
    )
    vegetation_coverage_pct = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    vegetation_growth_pct = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    ndvi_change = models.DecimalField(
        max_digits=5, decimal_places=4, null=True, blank=True
    )
    soil_health_index = models.DecimalField(
        max_digits=5, decimal_places=4, null=True, blank=True
    )
    aqi_improvement_proxy = models.DecimalField(
        max_digits=5, decimal_places=4, null=True, blank=True
    )
    claim_gap_pct = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    # ========== SOLAR-SPECIFIC METRICS ==========
    solar_probability = models.DecimalField(
        max_digits=5, decimal_places=4, null=True, blank=True
    )
    estimated_panel_area_m2 = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    estimated_energy_mwh_year = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    avoided_co2_tco2_year = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    land_use_conflict = models.BooleanField(null=True, blank=True)

    # ========== PLANTATION NUMERIC INPUTS ==========
    tree_count = models.PositiveIntegerField(null=True, blank=True)
    avg_dbh_mm = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Average Diameter at Breast Height in millimeters'
    )
    avg_height_cm = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Average tree height in centimeters'
    )
    species_factor = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Species wood density factor 1-100 e.g. Teak=70 Softwood=40'
    )

    # ========== SOLAR NUMERIC INPUTS ==========
    energy_generated_kwh = models.BigIntegerField(
        null=True, blank=True,
        help_text='Annual energy generated in kWh'
    )
    grid_emission_factor = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Scaled grid emission factor e.g. 715 means 0.715 kg CO2/kWh'
    )
    solar_efficiency_pct = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Panel efficiency percentage e.g. 98 means 98 percent'
    )

    # ========== METHANE NUMERIC INPUTS ==========
    biogas_volume_m3_year = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True,
        help_text='Annual biogas produced in cubic meters per year'
    )
    methane_fraction_pct = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Methane content percentage e.g. 60 means 60 percent'
    )
    biogas_plant_capacity_kw = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    # ========== COOKSTOVE NUMERIC INPUTS ==========
    stoves_count = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Number of stoves distributed and verified'
    )
    wood_saved_kg_per_stove_year = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Wood saved per stove per year in kg'
    )
    fnrb_scaled = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Fraction of Non-Renewable Biomass scaled e.g. 85 means 85 percent'
    )
    wood_emission_factor_scaled = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Emission factor of wood scaled e.g. 150 means 1.5 kg CO2 per kg'
    )
    cookstove_efficiency_pct = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Stove usage rate percentage e.g. 90 means 90 percent'
    )

    # ========== WIND NUMERIC INPUTS ==========
    wind_energy_generated_kwh = models.BigIntegerField(
        null=True, blank=True,
        help_text='Annual wind energy generated in kWh'
    )
    wind_grid_emission_factor = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Scaled grid emission factor same as solar'
    )
    wind_turbine_efficiency_pct = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Turbine efficiency percentage'
    )
    wind_turbine_count = models.PositiveIntegerField(null=True, blank=True)

    # ========== COMPUTED OUTPUT FIELDS ==========
    formula_computed_credits = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Credits computed by domain formula before ML cross-check'
    )
    ml_estimated_credits = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Credits estimated by ML image analysis for cross-check'
    )
    cross_check_gap_pct = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text='Percentage gap between formula and ML estimate'
    )

    # ========== CREDIT ISSUANCE ==========
    credits_issued = models.PositiveIntegerField(default=0)

    # ========== FULL VERIFICATION JSON ==========
    # Store the complete verification result JSON for reference
    verification_result_json = models.JSONField(null=True, blank=True)
    
    # Path to saved JSON report file (relative to MEDIA_ROOT)
    report_file_path = models.CharField(max_length=255, null=True, blank=True)

    # ========== BLOCKCHAIN INTEGRATION ==========
    blockchain_tx_hash = models.CharField(
        max_length=66, null=True, blank=True,
        help_text="Transaction hash from blockchain credit minting"
    )
    blockchain_minted = models.BooleanField(
        default=False,
        help_text="Whether credits have been minted on blockchain"
    )

    # ========== TIMESTAMPS ==========
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project_name} ({self.report_id or 'Pending'})"


class ProjectImage(models.Model):
    """
    Project images for before/after comparison.
    """
    IMAGE_TYPE_CHOICES = [
        ('BEFORE', 'Before'),
        ('AFTER', 'After'),
        ('SATELLITE', 'Satellite'),
        ('DRONE', 'Drone'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='images'
    )

    image_type = models.CharField(max_length=15, choices=IMAGE_TYPE_CHOICES)
    image_file = models.ImageField(upload_to='projects/')
    captured_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.project_name} - {self.image_type}"
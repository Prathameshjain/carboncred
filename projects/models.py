from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    """
    Project model that stores both user-submitted project data and 
    ML verification results.
    """
    
    CLASSIFICATION_CHOICES = [
        ('SOLAR', 'Solar'),
        ('VEGETATION', 'Vegetation'),
        ('PLANTATION', 'Plantation'),
        ('METHANE', 'Methane'),
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

    # ========== CREDIT ISSUANCE ==========
    credits_issued = models.PositiveIntegerField(default=0)

    # ========== FULL VERIFICATION JSON ==========
    # Store the complete verification result JSON for reference
    verification_result_json = models.JSONField(null=True, blank=True)

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
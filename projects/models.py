from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    CLASSIFICATION_CHOICES = [
        ('SOLAR', 'Solar'),
        ('PLANTATION', 'Plantation'),
        ('METHANE', 'Methane'),
    ]

    FINAL_DECISION_CHOICES = [
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
        ('PENDING', 'Pending'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='projects'
    )

    # From AI report
    report_id = models.CharField(max_length=50, unique=True)
    generated_at = models.DateTimeField()

    project_name = models.CharField(max_length=255)
    classification = models.CharField(max_length=20, choices=CLASSIFICATION_CHOICES)

    final_decision = models.CharField(
        max_length=10,
        choices=FINAL_DECISION_CHOICES
    )

    confidence_score = models.DecimalField(max_digits=5, decimal_places=2)
    claim_alignment = models.CharField(max_length=20)

    explanation = models.TextField()
    decision_reasons = models.JSONField()

    # Common metrics (kept minimal & generic)
    area_hectares = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estimated_co2_tco2_year = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )

    credits_issued = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project_name} ({self.report_id})"


class ProjectImage(models.Model):
    IMAGE_TYPE_CHOICES = [
        ('BEFORE', 'Before'),
        ('AFTER', 'After'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='images'
    )

    image_type = models.CharField(max_length=10, choices=IMAGE_TYPE_CHOICES)
    image_file = models.ImageField(upload_to='projects/')
    captured_date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.project_name} - {self.image_type}"


""" 
---------------------------------------------------------------------

from django.db import models
from django.db.models import JSONField
from django.conf import settings

class Project(models.Model):
	STATUS_CHOICES = [
		("pending_verification", "Pending Verification"),
		("approved", "Approved"),
		("rejected", "Rejected"),
	]

	id = models.AutoField(primary_key=True)
	title = models.CharField(max_length=255)
	type = models.CharField(max_length=100)
	location = JSONField()  # Store as GeoJSON: {"latitude": ..., "longitude": ...}
	budget = models.DecimalField(max_digits=15, decimal_places=2)
	plannedCredits = models.PositiveIntegerField()
	status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="pending_verification")
	createdAt = models.DateTimeField(auto_now_add=True)
	issuer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")

	def __str__(self):
		return self.title

 """
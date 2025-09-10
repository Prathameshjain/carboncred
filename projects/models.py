
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

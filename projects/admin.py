
from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
	list_display = ("id", "title", "type", "budget", "plannedCredits", "status", "createdAt", "issuer")

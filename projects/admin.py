from django.contrib import admin
from .models import Project, ProjectImage
from django.utils.html import format_html


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'project_name',
        'classification',
        'final_decision',
        'confidence_score',
        'credits_issued',
        'created_at',
    )
    list_filter = ('classification', 'final_decision')
    search_fields = ('project_name', 'report_id')
    readonly_fields = ('created_at',)


@admin.register(ProjectImage)
class ProjectImageAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'project',
        'image_type',
        'captured_date',
        'created_at',
    )
    list_filter = ('image_type',)
    readonly_fields = ('created_at',)


""" 
--------------------------------------------------------------------------------------------

from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
	list_display = ("id", "title", "type", "budget", "plannedCredits", "status", "createdAt", "issuer")

 """
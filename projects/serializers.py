from rest_framework import serializers
from .models import Project, ProjectImage


class ProjectImageSerializer(serializers.ModelSerializer):
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


class ProjectSerializer(serializers.ModelSerializer):
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

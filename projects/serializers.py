from rest_framework import serializers
from .models import Project, ProjectImage


class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ['id', 'project', 'image_type', 'image_file', 'captured_date', 'created_at']


class ProjectSerializer(serializers.ModelSerializer):
    images = ProjectImageSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'report_id', 'project_name', 'project_owner_name', 'classification',
            'starting_date', 'ending_date', 'latitude', 'longitude',
            'project_area', 'cost', 'confidence_score', 'claim_alignment',
            'final_decision', 'credits_issued', 'created_at', 'images'
        ]

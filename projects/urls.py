from django.urls import path

from .views import ProjectCreateAPIView, ProjectListAPIView, ProjectDetailAPIView, ProjectUpdateAPIView, ProjectEvidenceUploadAPIView

urlpatterns = [
    path('', ProjectListAPIView.as_view(), name='projects_list_all'),
    path('create/', ProjectCreateAPIView.as_view(), name='projects_create'),
    path('<int:id>/', ProjectDetailAPIView.as_view(), name='projects_byid_read'),
    path('<int:id>/update/', ProjectUpdateAPIView.as_view(), name='projects_update'),
    path('<int:id>/upload-evidence/', ProjectEvidenceUploadAPIView.as_view(), name='projects_upload_evidence'),
]

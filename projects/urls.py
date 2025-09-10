from django.urls import path

from .views import ProjectCreateAPIView, ProjectListAPIView

urlpatterns = [
    path('', ProjectListAPIView.as_view(), name='project-list'),
    path('create/', ProjectCreateAPIView.as_view(), name='project-create'),
]

from django.urls import path

from .views import ProjectCreateAPIView, ProjectListAPIView, ProjectDetailAPIView

urlpatterns = [
    path('', ProjectListAPIView.as_view(), name='project-list'),
    path('create/', ProjectCreateAPIView.as_view(), name='project-create'),
    path('<int:id>/', ProjectDetailAPIView.as_view(), name='project-detail'),
]

"""
URL configuration for backend project.
"""

from django.contrib import admin
from django.urls import path, include

# drf-yasg imports for schema generation
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


schema_view = get_schema_view(
    openapi.Info(
        title="Carbon Credit API",
        default_version='v1',
        description="API documentation",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # App APIs
    path('api/accounts/', include('accounts.urls')),
    path('api/credits/', include('credits.urls')),
    path('api/marketplace/', include('marketplace.urls')),
    path('api/transactions/', include('transactions.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/analytics/', include('analytics.urls')),
    

    # API Docs
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

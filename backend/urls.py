"""
URL configuration for backend project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings

# drf-yasg imports for schema generation
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from django.conf.urls.static import static

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
]

# API docs — only exposed in DEBUG mode
if settings.DEBUG:
    urlpatterns += [
        path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
        path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    ]

# Always serve media and static files (Gunicorn does not serve static files natively)
# Nginx can take over for high traffic, but this ensures it works in Docker
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
if hasattr(settings, 'STATIC_ROOT') and settings.STATIC_ROOT:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

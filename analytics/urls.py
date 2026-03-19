from django.urls import path
from .views import (
    UserProjectStatusView,
    UserProjectTypesView,
    UserCO2OverTimeView,
    UserCreditsPerProjectView,
    UserConfidenceScoresView,
    UserMarketplaceActivityView,
    UserPnLView,
    PlatformDomainDistributionView,
    PlatformCO2OverTimeView,
    PlatformMonthlyProjectsView,
    PlatformVerificationByDomainView,
    PlatformMarketplaceVolumeView,
    PlatformGrowthView,
    PlatformCreditsByDomainView,
    PlatformGeographicView,
)

urlpatterns = [
    # User analytics (auth required)
    path('user/project-status/',      UserProjectStatusView.as_view()),
    path('user/project-types/',        UserProjectTypesView.as_view()),
    path('user/co2-over-time/',        UserCO2OverTimeView.as_view()),
    path('user/credits-per-project/',  UserCreditsPerProjectView.as_view()),
    path('user/confidence-scores/',    UserConfidenceScoresView.as_view()),
    path('user/marketplace-activity/', UserMarketplaceActivityView.as_view()),
    path('user/pnl/',                  UserPnLView.as_view()),

    # Platform analytics (public)
    path('platform/domain-distribution/',    PlatformDomainDistributionView.as_view()),
    path('platform/co2-over-time/',          PlatformCO2OverTimeView.as_view()),
    path('platform/monthly-projects/',        PlatformMonthlyProjectsView.as_view()),
    path('platform/verification-by-domain/', PlatformVerificationByDomainView.as_view()),
    path('platform/marketplace-volume/',      PlatformMarketplaceVolumeView.as_view()),
    path('platform/growth/',                  PlatformGrowthView.as_view()),
    path('platform/credits-by-domain/',       PlatformCreditsByDomainView.as_view()),
    path('platform/geographic/',              PlatformGeographicView.as_view()),
]

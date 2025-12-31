from django.urls import path
from .views import (
    CreditSummaryView,
    IssuedCreditsView,
    PurchasedCreditsView,
    SellCreditsView,
    BuyCreditsView
)

urlpatterns = [
    # Dashboard
    path('summary/', CreditSummaryView.as_view(), name='credit-summary'),

    # Wallet lists
    path('issued/', IssuedCreditsView.as_view(), name='issued-credits'),
    path('purchased/', PurchasedCreditsView.as_view(), name='purchased-credits'),

    # Actions
    path('sell/', SellCreditsView.as_view(), name='sell-credits'),
    path('buy/', BuyCreditsView.as_view(), name='buy-credits'),
]

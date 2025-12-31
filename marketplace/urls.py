from django.urls import path
from .views import (
    CreateSellOrderView,
    ActiveSellOrdersView,
    BuyFromSellOrderView,
    CancelSellOrderView
)

urlpatterns = [
    path('sell/', CreateSellOrderView.as_view(), name='sell-credits'),
    path('orders/', ActiveSellOrdersView.as_view(), name='active-sell-orders'),
    path('buy/', BuyFromSellOrderView.as_view(), name='buy-credits'),
    path('sell-orders/<int:sell_order_id>/cancel/', CancelSellOrderView.as_view()),

]

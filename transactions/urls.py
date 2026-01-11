# transactions/urls.py

from django.urls import path
from .views import MyTransactionsView

urlpatterns = [
    path("my/", MyTransactionsView.as_view(), name="my-transactions"),
]

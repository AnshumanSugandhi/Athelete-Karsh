# bookings/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AvailabilitySlotViewSet, BookingViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'slots', AvailabilitySlotViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
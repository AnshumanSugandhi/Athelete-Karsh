# core/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import our new views
from sports.views import SportViewSet, SpecialtyViewSet
from bookings.views import AvailabilitySlotViewSet, BookingViewSet

# 1. Initialize the Router
router = DefaultRouter()

# 2. Register the endpoints
# This automatically creates /api/sports/, /api/specialties/, etc.
router.register(r'sports', SportViewSet, basename='sport')
router.register(r'specialties', SpecialtyViewSet, basename='specialty')
router.register(r'slots', AvailabilitySlotViewSet, basename='slot')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Standard Login / Logout API endpoints
    path('api/auth/', include('dj_rest_auth.urls')),
    
    # Add our new API router endpoints
    path('api/', include(router.urls)),
]
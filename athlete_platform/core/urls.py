# core/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
# Import our new views
from sports.views import SportViewSet, SpecialtyViewSet
from bookings.views import AvailabilitySlotViewSet, BookingViewSet 
from accounts.views import UserProfileView, AdminUserViewSet, GoogleLogin
from learning.views import ModuleViewSet
from chat.views import ConversationViewSet, MessageViewSet
from performance.views import DailyLogViewSet
from bookings.views import ReviewViewSet

# 1. Initialize the Router
router = DefaultRouter()

# 2. Register the endpoints
# This automatically creates /api/sports/, /api/specialties/, etc.
router.register(r'sports', SportViewSet, basename='sport')
router.register(r'specialties', SpecialtyViewSet, basename='specialty')
router.register(r'slots', AvailabilitySlotViewSet, basename='slot')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')
router.register(r'learning', ModuleViewSet, basename='learning-module')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'performance', DailyLogViewSet, basename='performance')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Standard Login / Logout / Password API endpoints
    path('api/auth/', include('dj_rest_auth.urls')),
    
    # ADD THIS LINE FOR REGISTRATION:
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # Google OAuth Endpoint
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),
    
    # Your Custom Profile Endpoint
    path('api/profile/', UserProfileView.as_view(), name='user-profile'),
    
    # Your API router endpoints (sports, specialties, slots, bookings)
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
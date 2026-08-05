# core/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Standard Login / Logout API endpoints
    path('api/auth/', include('dj_rest_auth.urls')),
    
    # (We will add the Google-specific endpoint here next)
]
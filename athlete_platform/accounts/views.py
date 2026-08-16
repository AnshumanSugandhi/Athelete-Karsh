# accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .serializers import UserProfileSerializer
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView


User = get_user_model()

class AdminUserViewSet(viewsets.ModelViewSet):
    """Allows Admins to view, edit, and delete any user account on the platform."""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    
class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Fetch the logged-in user's profile."""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """Update the logged-in user's profile."""
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class GoogleLogin(SocialLoginView):
    """
    Handles Google OAuth login.
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'postmessage'
    client_class = OAuth2Client

    def post(self, request, *args, **kwargs):
        print("--- GOOGLE LOGIN REQUEST DATA ---")
        print(request.data)
        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code >= 400:
                print("--- GOOGLE LOGIN ERROR RESPONSE ---")
                print(response.data)
            return response
        except Exception as e:
            print("--- GOOGLE LOGIN EXCEPTION ---")
            print(str(e))
            raise
# accounts/serializers.py
from rest_framework import serializers
from .models import CustomUser, AthleteProfile, ProfessionalProfile
from sports.serializers import SpecialtySerializer
from django.contrib.auth import get_user_model
# Add these imports at the top
from dj_rest_auth.registration.serializers import RegisterSerializer

class AthleteProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AthleteProfile
        fields = ['date_of_birth', 'gender', 'city', 'state', 'preferred_language', 'primary_sport', 'playing_role']

class ProfessionalProfileSerializer(serializers.ModelSerializer):
    # We nest the SpecialtySerializer so React gets the full object (name, sport context) 
    # instead of just receiving an ID number.
    speciality = SpecialtySerializer(read_only=True)
    
    class Meta:
        model = ProfessionalProfile
        fields = ['speciality', 'is_certified', 'address', 'academy_name', 'bank_details']

class UserSerializer(serializers.ModelSerializer):
    """
    The master user payload. It conditionally includes profile data based on the user's role.
    """
    athlete_profile = AthleteProfileSerializer(read_only=True)
    professional_profile = ProfessionalProfileSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role', 'athlete_profile', 'professional_profile'
        ]
        
User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'avatar', 'dob', 'blood_type']
        read_only_fields = ['id', 'username', 'role']
        


class CustomRegisterSerializer(RegisterSerializer):
    # 1. Define the custom fields so the serializer accepts them from React
    role = serializers.CharField(max_length=20, required=False)
    speciality_id = serializers.IntegerField(required=False, allow_null=True)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        # 2. Extract the role from the request, default to ATHLETE if missing
        data['role'] = self.validated_data.get('role', 'ATHLETE')
        data['speciality_id'] = self.validated_data.get('speciality_id')
        return data

    def save(self, request):
        # 3. Save the standard user (username, email, password)
        user = super().save(request)
        # 4. Attach the custom role and save again
        user.role = self.cleaned_data.get('role')
        
        # Attach speciality_id temporarily for the signal to use
        speciality_id = self.cleaned_data.get('speciality_id')
        if speciality_id:
            user._speciality_id = speciality_id
            
        user.save()
        return user
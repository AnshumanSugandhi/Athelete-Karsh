# accounts/serializers.py
from rest_framework import serializers
from .models import CustomUser, AthleteProfile, ProfessionalProfile
from sports.serializers import SpecialtySerializer

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
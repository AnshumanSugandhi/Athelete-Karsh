# sports/serializers.py
from rest_framework import serializers
from .models import Sport, Specialty

class SportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sport
        fields = ['id', 'name', 'is_active']

class SpecialtySerializer(serializers.ModelSerializer):
    # This automatically pulls the text name of the sport, saving React an extra API call
    sport_name = serializers.CharField(source='sport.name', read_only=True)

    class Meta:
        model = Specialty
        fields = ['id', 'name', 'sport', 'sport_name', 'is_cross_sport']
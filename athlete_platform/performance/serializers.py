from rest_framework import serializers
from .models import DailyLog

class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = [
            'id', 'athlete', 'date', 'sleep_hours', 'fatigue_level',
            'training_duration_mins', 'perceived_exertion', 'notes',
            'muscle_soreness', 'stress_level', 'resting_heart_rate', 
            'weight_kg', 'diet_quality', 'hydration_liters'
        ]
        read_only_fields = ['athlete']

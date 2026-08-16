from rest_framework import serializers
from .models import DailyLog

class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = [
            'id', 'athlete', 'date', 'sleep_hours', 'fatigue_level',
            'training_duration_mins', 'perceived_exertion', 'notes'
        ]
        read_only_fields = ['athlete']

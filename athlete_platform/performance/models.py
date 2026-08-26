from django.db import models
from accounts.models import CustomUser

class DailyLog(models.Model):
    athlete = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='daily_logs')
    date = models.DateField()
    sleep_hours = models.DecimalField(max_digits=4, decimal_places=1, help_text="Hours of sleep last night")
    fatigue_level = models.IntegerField(help_text="1 (Very Fresh) to 10 (Exhausted)")
    training_duration_mins = models.IntegerField(default=0, help_text="Total minutes of training today")
    perceived_exertion = models.IntegerField(default=0, help_text="RPE from 1 (Very Light) to 10 (Max Effort)")
    
    # Recovery & Readiness
    muscle_soreness = models.IntegerField(default=1, help_text="1 (None) to 10 (Extreme)")
    stress_level = models.IntegerField(default=1, help_text="1 (Very Low) to 10 (Very High)")
    
    # Health Metrics
    resting_heart_rate = models.IntegerField(blank=True, null=True, help_text="Resting Heart Rate in BPM")
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Weight in KG")
    
    # Nutrition
    diet_quality = models.IntegerField(default=5, help_text="1 (Poor) to 10 (Excellent)")
    hydration_liters = models.DecimalField(max_digits=4, decimal_places=1, default=2.0, help_text="Liters of water consumed")

    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('athlete', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.athlete.username} - {self.date}"

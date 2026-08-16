from django.db import models
from accounts.models import CustomUser

class DailyLog(models.Model):
    athlete = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='daily_logs')
    date = models.DateField()
    sleep_hours = models.DecimalField(max_digits=4, decimal_places=1, help_text="Hours of sleep last night")
    fatigue_level = models.IntegerField(help_text="1 (Very Fresh) to 10 (Exhausted)")
    training_duration_mins = models.IntegerField(default=0, help_text="Total minutes of training today")
    perceived_exertion = models.IntegerField(default=0, help_text="RPE from 1 (Very Light) to 10 (Max Effort)")
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('athlete', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.athlete.username} - {self.date}"

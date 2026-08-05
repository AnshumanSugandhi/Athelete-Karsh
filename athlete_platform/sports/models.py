# sports/models.py
from django.db import models

class Sport(models.Model):
    """
    Defines the core sports supported by the platform 
    (e.g., Cricket, Football, Badminton, Tennis, Swimming).
    """
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True, help_text="Toggle off to temporarily disable a sport.")

    def __str__(self):
        return self.name


class Specialty(models.Model):
    """
    Defines the specific coaching roles. 
    Can be tied to a specific sport (Batting Coach) or cross-sport (Gym Trainer).
    """
    name = models.CharField(max_length=100)
    
    # If it's a cross-sport role (like Physiotherapist), the sport field can be left blank.
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name='specialties', null=True, blank=True)
    is_cross_sport = models.BooleanField(default=False, help_text="Check this for Dieticians, Gym Trainers, etc.")

    class Meta:
        verbose_name_plural = "Specialties"  # Fixes the plural spelling in the admin panel

    def __str__(self):
        if self.is_cross_sport:
            return f"{self.name} (Cross-Sport)"
        # Prevents an error if a sport isn't assigned yet
        sport_name = self.sport.name if self.sport else "Unassigned"
        return f"{self.name} ({sport_name})"
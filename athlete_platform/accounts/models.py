# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    """
    Extends the default Django User model to include specific roles.
    We use AbstractUser to keep standard Django auth features (passwords, emails)
    while adding our custom 'role' field.
    """
    
    # 1. Define the role choices as a class attribute for clean referencing
    class Role(models.TextChoices):
        ATHLETE = 'ATHLETE', 'Athlete'
        PROFESSIONAL = 'PROFESSIONAL', 'Professional'
        ADMIN = 'ADMIN', 'Platform Admin'

    # 2. Create the role field using the choices defined above. 
    # We set a default, but we will explicitly set this during registration/creation.
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ATHLETE,
        help_text="Designates the user's permissions and dashboard access."
    )

    # 3. We can add additional fields here later if they apply to EVERY user,
    # but specific details (like a Coach's specialty) will go in separate Profile models.
    
    def __str__(self):
        # Returns the username and their role for easy reading in the admin panel
        return f"{self.username} - {self.role}"
    


class AthleteProfile(models.Model):
    """
    Stores data specific to Athletes. 
    Linked One-to-One with the CustomUser model.
    """
    # Link to the core auth user
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='athlete_profile')
    
    # Athlete-specific fields based on the PRD
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    preferred_language = models.CharField(max_length=50, blank=True)
    primary_sport = models.CharField(max_length=50, blank=True)
    playing_role = models.CharField(max_length=50, blank=True)
    
    # Timestamps for tracking when the profile was created/updated
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Athlete Profile: {self.user.username}"



class ProfessionalProfile(models.Model):
    """
    Stores data specific to Coaches and Professionals.
    Linked One-to-One with the CustomUser model.
    """
    user = models.OneToOneField('CustomUser', on_delete=models.CASCADE, related_name='professional_profile')
    
    # REPLACE the old CharField with this ForeignKey:
    speciality = models.ForeignKey(
        'sports.Specialty', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="The verified taxonomy role (e.g., Batting Coach, Gym Trainer)"
    )
    
    is_certified = models.BooleanField(default=False, help_text="Checked by Admin upon verification")
    address = models.TextField(blank=True)
    academy_name = models.CharField(max_length=150, blank=True)
    session_price = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=0.00, 
        help_text="Standard rate per session in INR"
    )
    
    bank_details = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        speciality_name = self.speciality.name if self.speciality else "Unassigned"
        return f"Pro Profile: {self.user.username} ({speciality_name})"
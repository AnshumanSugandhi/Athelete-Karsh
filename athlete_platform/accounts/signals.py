# accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, AthleteProfile, ProfessionalProfile

@receiver(post_save, sender=CustomUser)
def manage_user_profile(sender, instance, created, **kwargs):
    """
    Handles profile creation for both new users and when an existing user's role is updated.
    """
    if instance.role == CustomUser.Role.ATHLETE:
        # Create Athlete profile if it doesn't exist yet
        if not hasattr(instance, 'athlete_profile'):
            AthleteProfile.objects.create(user=instance)
            
    elif instance.role == CustomUser.Role.PROFESSIONAL:
        # Create Professional profile if it doesn't exist yet
        if not hasattr(instance, 'professional_profile'):
            profile = ProfessionalProfile.objects.create(user=instance)
            if hasattr(instance, '_specialty_id'):
                profile.speciality_id = instance._specialty_id
                profile.save()

@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    """
    Ensures existing linked profiles save updates when the user model is saved.
    """
    if instance.role == CustomUser.Role.ATHLETE and hasattr(instance, 'athlete_profile'):
        instance.athlete_profile.save()
    elif instance.role == CustomUser.Role.PROFESSIONAL and hasattr(instance, 'professional_profile'):
        instance.professional_profile.save()
import os
import django
from datetime import date, time, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import CustomUser, ProfessionalProfile, AthleteProfile
from sports.models import Specialty, Sport
from bookings.models import AvailabilitySlot, Booking
import random

def run():
    print("Deleting all bookings and slots to resolve protected constraints...")
    Booking.objects.all().delete()
    AvailabilitySlot.objects.all().delete()
    
    print("Deleting all users except 'Karsh'...")
    CustomUser.objects.exclude(username='Karsh').delete()

    print("Fetching specialties...")
    specialties = list(Specialty.objects.all())
    
    if not specialties:
        print("No specialties found! Run previous scripts to add them.")
        return

    athletes = []
    coaches = []
    
    password = 'password123'
    
    print("Creating 20 athletes...")
    for i in range(1, 21):
        username = f'athlete_{i}'
        user = CustomUser.objects.create_user(
            username=username, 
            email=f'{username}@example.com', 
            password=password, 
            role=CustomUser.Role.ATHLETE
        )
        # Profile is created via signal, but we can set some data
        if hasattr(user, 'athlete_profile'):
            user.athlete_profile.city = 'Mumbai'
            user.athlete_profile.save()
        athletes.append(username)
        
    print("Creating 10 coaches...")
    for i in range(1, 11):
        username = f'coach_{i}'
        specialty = random.choice(specialties)
        
        # We simulate the signal behavior by passing speciality_id 
        # (Though we can just get the profile after it's created and update it)
        user = CustomUser.objects.create_user(
            username=username, 
            email=f'{username}@example.com', 
            password=password, 
            role=CustomUser.Role.PROFESSIONAL
        )
        
        profile = ProfessionalProfile.objects.get(user=user)
        profile.speciality = specialty
        profile.session_price = random.choice([500.00, 1000.00, 1500.00, 2000.00])
        profile.is_certified = True
        profile.save()
        
        coaches.append(username)
        
        # Open slots for this coach
        # Create a slot for tomorrow and day after
        today = date.today()
        for days_ahead in [1, 2]:
            AvailabilitySlot.objects.create(
                professional=user,
                date=today + timedelta(days=days_ahead),
                start_time=time(10, 0),
                end_time=time(11, 0),
                session_type=random.choice(['ONLINE', 'OFFLINE']),
                price=profile.session_price
            )

    print("Writing usernames to dummy_accounts.txt...")
    txt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dummy_accounts.txt')
    with open(txt_path, 'w') as f:
        f.write("--- DUMMY ACCOUNTS LIST ---\n")
        f.write(f"Common Password: {password}\n\n")
        
        f.write("ATHLETES:\n")
        for a in athletes:
            f.write(f"- {a}\n")
            
        f.write("\nCOACHES:\n")
        for c in coaches:
            f.write(f"- {c}\n")
            
    print(f"Done! Accounts recorded in {txt_path}")

if __name__ == '__main__':
    run()

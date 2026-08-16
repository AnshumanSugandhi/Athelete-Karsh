import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sports.models import Sport, Specialty

# Fetch sports
try:
    cricket = Sport.objects.get(name='Cricket')
    football = Sport.objects.get(name='Football')
    badminton = Sport.objects.get(name='Badminton')
    tennis = Sport.objects.get(name='Tennis')
    swimming = Sport.objects.get(name='Swimming')
except Sport.DoesNotExist as e:
    print(f"Error fetching sports: {e}")
    exit(1)

# Cricket Specialties
cricket_specialties = [
    'Batting Coach',
    'Bowling Coach (Fast)',
    'Bowling Coach (Spin)',
    'Fielding Coach',
    'Wicketkeeping Coach'
]

for name in cricket_specialties:
    Specialty.objects.get_or_create(name=name, sport=cricket, is_cross_sport=False)

# Football Specialties
football_specialties = ['Football Coach', 'Goalkeeping Coach']
for name in football_specialties:
    Specialty.objects.get_or_create(name=name, sport=football, is_cross_sport=False)

# Badminton Specialties
Specialty.objects.get_or_create(name='Badminton Coach', sport=badminton, is_cross_sport=False)

# Tennis Specialties
Specialty.objects.get_or_create(name='Tennis Coach', sport=tennis, is_cross_sport=False)

# Swimming Specialties
Specialty.objects.get_or_create(name='Swimming Coach', sport=swimming, is_cross_sport=False)

# Cross-sport Specialties
cross_sport_specialties = [
    'Gym Trainer',
    'Strength and Conditioning Coach',
    'Meditation and Yoga Trainer',
    'Physiotherapist',
    'Dietician'
]

for name in cross_sport_specialties:
    Specialty.objects.get_or_create(name=name, sport=None, is_cross_sport=True)

print("Successfully added all specialties!")
print(f"Total specialties now: {Specialty.objects.count()}")

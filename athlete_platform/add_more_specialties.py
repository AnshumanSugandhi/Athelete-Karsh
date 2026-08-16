import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sports.models import Sport, Specialty

# Fetch sports
try:
    football = Sport.objects.get(name='Football')
    badminton = Sport.objects.get(name='Badminton')
    tennis = Sport.objects.get(name='Tennis')
    swimming = Sport.objects.get(name='Swimming')
except Sport.DoesNotExist as e:
    print(f"Error fetching sports: {e}")
    exit(1)

new_specialties = {
    football: [
        'Forward/Striker Coach',
        'Midfield Coach',
        'Defender Coach',
        'Set-piece Coach'
    ],
    badminton: [
        'Singles Coach',
        'Doubles Coach',
        'Serve and Return Coach',
        'Footwork Coach'
    ],
    tennis: [
        'Serve Coach',
        'Baseline Coach',
        'Net Play / Volley Coach',
        'Singles Coach (Tennis)',
        'Doubles Coach (Tennis)'
    ],
    swimming: [
        'Freestyle Coach',
        'Breaststroke Coach',
        'Butterfly Coach',
        'Backstroke Coach',
        'Dive/Start Coach'
    ]
}

for sport, specialties in new_specialties.items():
    for name in specialties:
        Specialty.objects.get_or_create(name=name, sport=sport, is_cross_sport=False)

print("Successfully added more granular specialties!")
print(f"Total specialties now: {Specialty.objects.count()}")

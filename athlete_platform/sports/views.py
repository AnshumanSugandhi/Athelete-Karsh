# sports/views.py
from rest_framework import viewsets
from .models import Sport, Specialty
from .serializers import SportSerializer, SpecialtySerializer

class SportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows sports to be viewed.
    React will use this to populate the dropdown filters.
    """
    # Only return active sports
    queryset = Sport.objects.filter(is_active=True)
    serializer_class = SportSerializer

class SpecialtyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing coaching specialties.
    """
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
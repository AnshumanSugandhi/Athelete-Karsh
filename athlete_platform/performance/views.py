from rest_framework import viewsets, permissions
from .models import DailyLog
from .serializers import DailyLogSerializer

class DailyLogViewSet(viewsets.ModelViewSet):
    serializer_class = DailyLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # If the user is an athlete, return only their logs
        if user.role == 'ATHLETE':
            return DailyLog.objects.filter(athlete=user)
            
        # If the user is a professional, return logs of all athletes, or filter by athlete_id if provided
        if user.role == 'PROFESSIONAL':
            athlete_id = self.request.query_params.get('athlete_id')
            if athlete_id:
                return DailyLog.objects.filter(athlete_id=athlete_id)
            return DailyLog.objects.all()
            
        return DailyLog.objects.none()

    def perform_create(self, serializer):
        serializer.save(athlete=self.request.user)

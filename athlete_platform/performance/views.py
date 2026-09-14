from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DailyLog
from .serializers import DailyLogSerializer
from .gemini_service import generate_performance_analysis

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

    @action(detail=False, methods=['get'])
    def ai_analysis(self, request):
        """
        Generates an AI performance analysis based on the athlete's last 7 logs.
        """
        if request.user.role != 'ATHLETE':
            return Response({"error": "Only athletes can generate personal AI analysis."}, status=status.HTTP_403_FORBIDDEN)
            
        # Get the last 7 days of logs for this athlete
        recent_logs = DailyLog.objects.filter(athlete=request.user).order_by('-date')[:7]
        
        if not recent_logs:
            return Response({"analysis": "You don't have any daily logs yet. Please fill out your daily performance tracker first!"})
            
        # Call the Gemini service
        analysis_markdown = generate_performance_analysis(recent_logs)
        
        return Response({
            "analysis": analysis_markdown
        })

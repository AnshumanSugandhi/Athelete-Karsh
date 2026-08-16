from rest_framework import viewsets
from .models import Module
from .serializers import ModuleSerializer

class ModuleViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows learning modules to be viewed and managed.
    """
    queryset = Module.objects.all().order_by('-created_at')
    serializer_class = ModuleSerializer

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
            serializer.save()

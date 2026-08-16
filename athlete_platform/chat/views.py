from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(athlete=user) | Q(professional=user)
        ).order_by('-updated_at')

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        if request.user.role == 'ATHLETE' and not data.get('athlete_id'):
            data['athlete_id'] = request.user.id
        elif request.user.role == 'PROFESSIONAL' and not data.get('professional_id'):
            data['professional_id'] = request.user.id
            
        athlete_id = data.get('athlete_id')
        professional_id = data.get('professional_id')
        
        existing = Conversation.objects.filter(athlete_id=athlete_id, professional_id=professional_id).first()
        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        conversation_id = self.request.query_params.get('conversation')
        
        qs = Message.objects.filter(Q(conversation__athlete=user) | Q(conversation__professional=user))
            
        if conversation_id:
            qs = qs.filter(conversation_id=conversation_id)
            
        return qs.order_by('timestamp')

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        
        # Update conversation's updated_at timestamp
        conversation = serializer.validated_data['conversation']
        conversation.save() # triggers auto_now=True

        # Broadcast the new message via WebSockets
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f'chat_{conversation.id}',
                {
                    'type': 'chat_message',
                    'message': MessageSerializer(message).data
                }
            )

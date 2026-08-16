from rest_framework import serializers
from .models import Conversation, Message
from accounts.models import CustomUser

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'role']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'timestamp', 'is_read']
        read_only_fields = ['is_read']

class ConversationSerializer(serializers.ModelSerializer):
    athlete = UserBasicSerializer(read_only=True)
    professional = UserBasicSerializer(read_only=True)
    athlete_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role='ATHLETE'), source='athlete', write_only=True
    )
    professional_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role='PROFESSIONAL'), source='professional', write_only=True
    )
    latest_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'athlete', 'professional', 'athlete_id', 'professional_id', 'created_at', 'updated_at', 'latest_message']

    def get_latest_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return MessageSerializer(msg).data
        return None

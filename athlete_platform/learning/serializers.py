from rest_framework import serializers
from .models import Module

class ModuleSerializer(serializers.ModelSerializer):
    sport_name = serializers.CharField(source='sport.name', read_only=True, allow_null=True)
    author_name = serializers.CharField(source='author.username', read_only=True, allow_null=True)
    author = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'category', 'sport', 'sport_name', 
            'video_url', 'content', 'author', 'author_name', 'created_at', 'updated_at'
        ]

from django.db import models
from accounts.models import CustomUser

class Conversation(models.Model):
    """
    A direct 1-on-1 chat between an athlete and a professional coach.
    """
    athlete = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='athlete_conversations')
    professional = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='professional_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('athlete', 'professional')

    def __str__(self):
        return f"Chat: {self.athlete.username} & {self.professional.username}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Msg from {self.sender.username} at {self.timestamp.strftime('%H:%M')}"

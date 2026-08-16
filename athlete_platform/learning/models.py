from django.db import models
from accounts.models import CustomUser
from sports.models import Sport

class Module(models.Model):
    CATEGORY_CHOICES = (
        ('TECHNICAL', 'Technical Analysis'),
        ('PSYCHOLOGICAL', 'Psychological Analysis'),
        ('NUTRITION', 'Nutrition & Diet'),
        ('FITNESS', 'Fitness & Conditioning'),
        ('GENERAL', 'General Insights')
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='TECHNICAL')
    
    # Optional sport association (e.g., specific to Cricket)
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name='learning_modules', null=True, blank=True)
    
    # YouTube or other video embed URL
    video_url = models.URLField(blank=True, help_text="e.g., https://www.youtube.com/embed/...")
    
    # Rich text or markdown content
    content = models.TextField(help_text="Detailed analysis and notes.")
    
    # The coach or admin who authored it
    author = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='authored_modules')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.category}] {self.title}"

from django.contrib import admin
from .models import Module

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'sport', 'author', 'created_at')
    list_filter = ('category', 'sport', 'author')
    search_fields = ('title', 'description', 'content')

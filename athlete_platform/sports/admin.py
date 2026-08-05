# sports/admin.py
from django.contrib import admin
from .models import Sport, Specialty

@admin.register(Sport)
class SportAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    search_fields = ('name',)

@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ('name', 'sport', 'is_cross_sport')
    list_filter = ('is_cross_sport', 'sport')
    search_fields = ('name',)
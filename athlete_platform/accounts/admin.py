# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from .models import AthleteProfile, ProfessionalProfile


class CustomUserAdmin(UserAdmin):
    """
    Customizing the admin interface for our CustomUser model.
    We inherit from UserAdmin to keep Django's default password handling and UI.
    """
    model = CustomUser
    
    # 1. Add our custom 'role' field to the detail view layout.
    # We append it as a new section so we don't overwrite the default fields (like username, email, passwords).
    fieldsets = UserAdmin.fieldsets + (
        ('Role & Dashboard Access', {'fields': ('role',)}),
    )
    
    # 2. Define what columns show up in the main table list view.
    # Adding 'role' here makes it easy to scan who is an Athlete vs Professional at a glance.
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_staff']
    
    # 3. Add filters to the right sidebar so admins can quickly filter by role.
    list_filter = ['role', 'is_staff', 'is_active']

# 4. Register the model and the customized admin class together.
admin.site.register(CustomUser, CustomUserAdmin)

@admin.register(AthleteProfile)
class AthleteProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'primary_sport', 'city']
    search_fields = ['user__username', 'primary_sport']

@admin.register(ProfessionalProfile)
class ProfessionalProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'speciality', 'is_certified']
    list_filter = ['is_certified', 'speciality']
    search_fields = ['user__username', 'speciality']
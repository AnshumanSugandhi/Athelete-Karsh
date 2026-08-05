# bookings/admin.py
from django.contrib import admin
from .models import AvailabilitySlot, Booking

@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ('professional', 'date', 'start_time', 'session_type', 'is_booked', 'price')
    list_filter = ('is_booked', 'session_type', 'date')
    search_fields = ('professional__username',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('athlete', 'get_professional', 'get_date', 'payment_status', 'razorpay_order_id')
    list_filter = ('payment_status', 'created_at')
    search_fields = ('athlete__username', 'razorpay_order_id', 'razorpay_payment_id')
    
    # Custom methods to display related slot data cleanly in the table
    def get_professional(self, obj):
        return obj.slot.professional.username
    get_professional.short_description = 'Professional'

    def get_date(self, obj):
        return obj.slot.date
    get_date.short_description = 'Session Date'
# bookings/serializers.py
from rest_framework import serializers
from .models import AvailabilitySlot, Booking

class AvailabilitySlotSerializer(serializers.ModelSerializer):
    professional_name = serializers.CharField(source='professional.username', read_only=True)

    class Meta:
        model = AvailabilitySlot
        fields = [
            'id', 'professional', 'professional_name', 'date', 'start_time', 
            'end_time', 'session_type', 'is_booked', 'price'
        ]
        read_only_fields = ['professional']

# bookings/serializers.py

class BookingSerializer(serializers.ModelSerializer):
    slot_details = AvailabilitySlotSerializer(source='slot', read_only=True)
    athlete_name = serializers.CharField(source='athlete.username', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'athlete', 'athlete_name', 'slot', 'slot_details', 'current_goal', 
            'past_injury', 'payment_status', 'razorpay_order_id', 
            'meeting_link_or_address', 'created_at'
        ]
        # ADD THIS LINE: Tell DRF to ignore these fields during the incoming POST request
        read_only_fields = ['athlete', 'payment_status', 'razorpay_order_id'] 
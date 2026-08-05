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

class BookingSerializer(serializers.ModelSerializer):
    # 1. Rename the nested serializer and map it to the slot source. 
    # This provides the full JSON context (time, date, price) for the frontend to read.
    slot_details = AvailabilitySlotSerializer(source='slot', read_only=True)
    
    athlete_name = serializers.CharField(source='athlete.username', read_only=True)

    class Meta:
        model = Booking
        # 2. Keep 'slot' as a standard writable field (which expects just the ID integer for POST),
        # and add 'slot_details' for the read-only nested view.
        fields = [
            'id', 'athlete', 'athlete_name', 'slot', 'slot_details', 'current_goal', 
            'past_injury', 'payment_status', 'razorpay_order_id', 
            'meeting_link_or_address', 'created_at'
        ]
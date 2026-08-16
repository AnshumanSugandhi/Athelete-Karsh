# bookings/serializers.py
from rest_framework import serializers
from .models import AvailabilitySlot, Booking, Review

class AvailabilitySlotSerializer(serializers.ModelSerializer):
    professional_name = serializers.CharField(source='professional.username', read_only=True)
    professional_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    current_enrollments = serializers.SerializerMethodField()

    class Meta:
        model = AvailabilitySlot
        fields = [
            'id', 'professional', 'professional_name', 'professional_rating', 'reviews_count', 
            'date', 'start_time', 'end_time', 'session_type', 'max_capacity', 
            'current_enrollments', 'meeting_link_or_address', 'price'
        ]
        read_only_fields = ['professional', 'current_enrollments']

    def get_professional_rating(self, obj):
        reviews = obj.professional.reviews_received.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return None

    def get_reviews_count(self, obj):
        return obj.professional.reviews_received.count()

    def get_current_enrollments(self, obj):
        return obj.booking_record.filter(payment_status='PAID').count()

# bookings/serializers.py

class BookingSerializer(serializers.ModelSerializer):
    slot_details = AvailabilitySlotSerializer(source='slot', read_only=True)
    athlete_name = serializers.CharField(source='athlete.username', read_only=True)
    has_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'athlete', 'athlete_name', 'slot', 'slot_details', 'current_goal', 
            'past_injury', 'payment_status', 'razorpay_order_id', 
            'created_at', 'has_reviewed'
        ]
        # Tell DRF to ignore these fields during the incoming POST request
        read_only_fields = ['athlete', 'payment_status', 'razorpay_order_id', 'has_reviewed'] 

    def get_has_reviewed(self, obj):
        return hasattr(obj, 'review')

class ReviewSerializer(serializers.ModelSerializer):
    athlete_name = serializers.CharField(source='athlete.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'booking', 'athlete', 'athlete_name', 'professional', 'rating', 'comment', 'created_at']
        read_only_fields = ['athlete', 'professional']
# bookings/views.py
import razorpay
from django.conf import settings
from rest_framework import viewsets, permissions
from .models import AvailabilitySlot, Booking
from .serializers import AvailabilitySlotSerializer, BookingSerializer

class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    """
    API endpoint for the Dynamic Availability Slot Engine.
    """
    queryset = AvailabilitySlot.objects.all()
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'ATHLETE':
            return queryset.filter(is_booked=False)
        elif self.request.user.role == 'PROFESSIONAL':
            return queryset.filter(professional=self.request.user)
        return queryset


class BookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and submitting session bookings.
    Generates a Razorpay Order ID automatically upon creation.
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """
        Intercepts the booking creation to calculate cost and generate a payment ID.
        """
        # 1. Get the slot the athlete is trying to book
        slot = serializer.validated_data['slot']
        
        # 2. Razorpay requires the amount in the smallest currency unit (paise)
        # So we multiply the INR price by 100
        amount_in_paise = int(slot.price * 100)

        # 3. Initialize the Razorpay Client
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        # 4. Request an Order ID from Razorpay
        order_data = {
            'amount': amount_in_paise,
            'currency': 'INR',
            'payment_capture': '1'  # 1 = Auto-capture the payment instantly
        }
        razorpay_order = client.order.create(data=order_data)

        # 5. Save the booking with the new Order ID attached
        serializer.save(
            athlete=self.request.user,
            razorpay_order_id=razorpay_order['id'],
            payment_status='PENDING'
        )
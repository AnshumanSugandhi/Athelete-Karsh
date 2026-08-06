# bookings/views.py
import razorpay
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AvailabilitySlot, Booking
from .serializers import AvailabilitySlotSerializer, BookingSerializer

class AvailabilitySlotViewSet(viewsets.ModelViewSet):
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

    # ADD THIS METHOD:
    def perform_create(self, serializer):
        """Automatically assigns the logged-in professional to the slot they create."""
        serializer.save(professional=self.request.user)


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    # ADD THIS METHOD:
    def get_queryset(self):
        """Filters bookings so users only see their own data."""
        user = self.request.user
        
        # Athletes only see bookings they purchased
        if user.role == 'ATHLETE':
            return Booking.objects.filter(athlete=user).order_by('-created_at')
            
        # Professionals only see bookings tied to their slots
        elif user.role == 'PROFESSIONAL':
            return Booking.objects.filter(slot__professional=user).order_by('slot__date', 'slot__start_time')
            
        # Admins see everything
        return Booking.objects.all()

    def perform_create(self, serializer):
        slot = serializer.validated_data['slot']
        amount_in_paise = int(slot.price * 100)
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        order_data = {
            'amount': amount_in_paise,
            'currency': 'INR',
            'payment_capture': '1'
        }
        razorpay_order = client.order.create(data=order_data)

        # ---> ADD THESE TWO LINES <---
        # Instantly mark the slot as taken so it disappears from the Athlete grid
        slot.is_booked = True
        slot.save()

        serializer.save(
            athlete=self.request.user,
            razorpay_order_id=razorpay_order['id'],
            payment_status='PENDING'
        )

    @action(detail=True, methods=['post'])
    def verify_payment(self, request, pk=None):
        """
        Receives payment success details from React, mathematically verifies 
        the signature using our secret key, and marks the booking as PAID.
        """
        booking = self.get_object()
        
        # 1. Grab the exact data Razorpay handed to the React frontend
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        # 2. Initialize the Razorpay SDK
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        try:
            # 3. Ask Razorpay to mathematically verify the signature
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
            
            # 4. If the code reaches this line, the payment is 100% authentic!
            booking.payment_status = 'PAID'
            booking.save()
            
            return Response({'status': 'Payment verified and booking secured!'}, status=status.HTTP_200_OK)
            
        except razorpay.errors.SignatureVerificationError:
            # If the signature is fake or tampered with, reject it.
            return Response({'error': 'Invalid payment signature'}, status=status.HTTP_400_BAD_REQUEST)
        
    
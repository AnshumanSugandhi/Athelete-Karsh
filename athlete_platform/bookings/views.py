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

    # ADD THIS NEW METHOD:
    @action(detail=False, methods=['post'])
    def verify_payment(self, request):
        """
        React calls this after Razorpay succeeds. 
        We verify the digital signature to prevent fraud, then lock the slot.
        """
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        try:
            # 1. Ask the SDK to mathematically verify the signature
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
            
            # 2. If it doesn't crash, the payment is 100% authentic!
            # Find the booking and update it
            booking = Booking.objects.get(razorpay_order_id=razorpay_order_id)
            booking.payment_status = 'PAID'
            booking.razorpay_payment_id = razorpay_payment_id
            booking.razorpay_signature = razorpay_signature
            booking.save()

            # 3. Lock the professional's calendar slot!
            slot = booking.slot
            slot.is_booked = True
            slot.save()

            return Response({'status': 'Payment verified successfully'}, status=status.HTTP_200_OK)
            
        except razorpay.errors.SignatureVerificationError:
            return Response({'error': 'Invalid payment signature'}, status=status.HTTP_400_BAD_REQUEST)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
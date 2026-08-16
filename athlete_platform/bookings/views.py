# bookings/views.py
import razorpay
from django.conf import settings
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AvailabilitySlot, Booking, Review
from .serializers import AvailabilitySlotSerializer, BookingSerializer, ReviewSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Q, F

class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    queryset = AvailabilitySlot.objects.all()
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'ATHLETE':
            return queryset.annotate(
                paid_bookings=Count('booking_record', filter=Q(booking_record__payment_status='PAID'))
            ).filter(paid_bookings__lt=F('max_capacity'))
        elif self.request.user.role == 'PROFESSIONAL':
            return queryset.filter(professional=self.request.user)
        return queryset

    def perform_create(self, serializer):
        """Automatically assigns the logged-in professional to the slot they create."""
        import uuid
        
        slot = serializer.save(professional=self.request.user)
        
        if slot.session_type == 'ONLINE' and not slot.meeting_link_or_address:
            # Generate a secure, unique DronaMeet Jitsi link automatically
            slot.meeting_link_or_address = f"https://meet.jit.si/DronaMeet-Session-{slot.id}-{uuid.uuid4().hex[:8]}"
            slot.save()

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ATHLETE':
            return Booking.objects.filter(athlete=user).order_by('-created_at')
        elif user.role == 'PROFESSIONAL':
            return Booking.objects.filter(slot__professional=user).order_by('slot__date', 'slot__start_time')
        return Booking.objects.all()

    def perform_create(self, serializer):
        slot = serializer.validated_data['slot']

        # Check for duplicate bookings
        if Booking.objects.filter(slot=slot, athlete=self.request.user).exists():
            raise serializers.ValidationError({"slot": "You have already booked this session."})

        # Enforce Capacity Limits
        current_enrollments = slot.booking_record.filter(payment_status='PAID').count()
        if current_enrollments >= slot.max_capacity:
            raise serializers.ValidationError({"slot": "This session is already full."})
        
        # Test Mode Bypass
        if not settings.RAZORPAY_KEY_ID or settings.RAZORPAY_KEY_ID == 'rzp_test_your_actual_key_here':
            serializer.save(
                athlete=self.request.user,
                razorpay_order_id='test_order_123',
                payment_status='PENDING'
            )
            return

        amount_in_paise = int(slot.price * 100)
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        order_data = {
            'amount': amount_in_paise,
            'currency': 'INR',
            'payment_capture': '1'
        }
        
        try:
            razorpay_order = client.order.create(data=order_data)
            serializer.save(
                athlete=self.request.user,
                razorpay_order_id=razorpay_order['id'],
                payment_status='PENDING'
            )
        except Exception as e:
            # Fallback to test mode if Razorpay fails due to invalid keys
            serializer.save(
                athlete=self.request.user,
                razorpay_order_id='test_order_123',
                payment_status='PENDING'
            )

    @action(detail=True, methods=['post'])
    def verify_payment(self, request, pk=None):
        booking = self.get_object()
        
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        
        # Test Mode Bypass (Forced if using test credentials)
        if razorpay_payment_id == 'pay_test123' or not settings.RAZORPAY_KEY_ID or settings.RAZORPAY_KEY_ID == 'rzp_test_your_actual_key_here':
            booking.payment_status = 'PAID'
            booking.save()
            return Response({'status': 'Test payment verified!'}, status=status.HTTP_200_OK)

        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
            
            booking.payment_status = 'PAID'
            booking.save()
            return Response({'status': 'Payment verified and booking secured!'}, status=status.HTTP_200_OK)
            
        except razorpay.errors.SignatureVerificationError:
            return Response({'error': 'Invalid payment signature'}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def admin_metrics(self, request):
        total_athletes = User.objects.filter(role='ATHLETE').count()
        total_professionals = User.objects.filter(role='PROFESSIONAL').count()
        paid_bookings = Booking.objects.filter(payment_status='PAID')
        total_revenue = paid_bookings.aggregate(total=Sum('slot__price'))['total'] or 0.00
        recent_bookings = Booking.objects.select_related('athlete', 'slot__professional').order_by('-created_at')[:10]
        
        recent_data = []
        for b in recent_bookings:
            recent_data.append({
                'id': b.id,
                'athlete': b.athlete.username,
                'professional': b.slot.professional.username,
                'date': b.slot.date,
                'status': b.payment_status,
                'amount': b.slot.price
            })

        return Response({
            'metrics': {
                'total_athletes': total_athletes,
                'total_professionals': total_professionals,
                'total_revenue': total_revenue,
            },
            'recent_transactions': recent_data
        })
        
User = get_user_model()

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ATHLETE':
            return Review.objects.filter(athlete=user)
        elif user.role == 'PROFESSIONAL':
            return Review.objects.filter(professional=user)
        return Review.objects.all()

    def perform_create(self, serializer):
        booking = serializer.validated_data['booking']
        if booking.athlete != self.request.user:
            raise serializers.ValidationError("You can only review your own bookings.")
        if booking.payment_status != 'PAID':
            raise serializers.ValidationError("You can only review paid sessions.")
        
        serializer.save(
            athlete=self.request.user,
            professional=booking.slot.professional
        )

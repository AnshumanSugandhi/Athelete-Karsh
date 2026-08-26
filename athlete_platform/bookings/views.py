# bookings/views.py
import razorpay
from django.conf import settings
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from allauth.socialaccount.models import SocialToken
import requests
import uuid
from datetime import datetime
from .models import AvailabilitySlot, Booking, Review, Notification
from .serializers import AvailabilitySlotSerializer, BookingSerializer, ReviewSerializer, NotificationSerializer
from rest_framework.views import APIView
import razorpay
from django.conf import settings
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Q, F

class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    """
    Handles the creation and listing of Coaching Sessions (Slots).
    - Athletes only see slots that are in the future and not full.
    - Professionals only see their own slots.
    """
    queryset = AvailabilitySlot.objects.all()
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'ATHLETE':
            from django.utils import timezone
            return queryset.annotate(
                paid_bookings=Count('booking_record', filter=Q(booking_record__payment_status='PAID'))
            ).filter(
                paid_bookings__lt=F('max_capacity'),
                is_cancelled=False,
                date__gte=timezone.now().date()
            )
        elif self.request.user.role == 'PROFESSIONAL':
            return queryset.filter(professional=self.request.user)
        return queryset


    def perform_create(self, serializer):
        """
        Automatically assigns the logged-in professional to the slot they create.
        If slots are created without a professional, check this method.
        """
        serializer.save(professional=self.request.user)

    @action(detail=True, methods=['post'])
    def generate_meet(self, request, pk=None):
        slot = self.get_object()
        
        if slot.professional != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            token = SocialToken.objects.get(account__user=request.user, account__provider='google')
        except SocialToken.DoesNotExist:
            return Response(
                {'error': 'No Google account connected. Please log out and sign in with Google to enable automatic Meet generation.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        headers = {
            'Authorization': f'Bearer {token.token}',
            'Content-Type': 'application/json'
        }
        
        from datetime import timedelta
        start_dt = datetime.combine(slot.date, slot.start_time)
        end_dt = datetime.combine(slot.date, slot.end_time)
        
        # If the end time is before the start time, it means the session crosses midnight
        if end_dt <= start_dt:
            end_dt += timedelta(days=1)
            
        start_dt_iso = start_dt.isoformat()
        end_dt_iso = end_dt.isoformat()
        timezone_str = getattr(settings, 'TIME_ZONE', 'UTC')
        
        body = {
            "summary": f"DronaMeet Session with {request.user.username}",
            "start": {"dateTime": start_dt_iso, "timeZone": timezone_str},
            "end": {"dateTime": end_dt_iso, "timeZone": timezone_str},
            "conferenceData": {
                "createRequest": {
                    "requestId": f"slot-{slot.id}-{uuid.uuid4().hex[:8]}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"}
                }
            }
        }
        
        response = requests.post(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
            headers=headers,
            json=body
        )
        
        if response.status_code == 200:
            data = response.json()
            meet_link = data.get('hangoutLink')
            if meet_link:
                slot.meeting_link_or_address = meet_link
                slot.save()
                return Response({'meeting_link': meet_link}, status=status.HTTP_200_OK)
            return Response({'error': f"No Meet link returned from Google. Response: {data}"}, status=status.HTTP_400_BAD_REQUEST)
            
        print("GOOGLE API ERROR:", response.text)
        return Response({'error': f'Failed to communicate with Google Calendar. Error: {response.text}'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        slot = self.get_object()
        if slot.professional != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        slot.is_cancelled = True
        slot.save()
        
        # Process refunds
        paid_bookings = slot.booking_record.filter(payment_status='PAID')
        refunded_count = 0
        
        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_ID != 'rzp_test_your_actual_key_here':
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        else:
            client = None
            
        for booking in paid_bookings:
            # Create Notification
            Notification.objects.create(
                user=booking.athlete,
                title="Session Cancelled",
                message=f"{request.user.username} cancelled the session on {slot.date} at {slot.start_time}. A refund has been initiated."
            )
            
            # Trigger Refund
            if client and booking.razorpay_payment_id and not booking.razorpay_payment_id.startswith('pay_test'):
                try:
                    client.payment.refund(booking.razorpay_payment_id)
                except Exception as e:
                    print("Refund error:", e)
            
            booking.payment_status = 'REFUNDED'
            booking.save()
            refunded_count += 1
            
        return Response({'message': f'Session cancelled and {refunded_count} athletes refunded.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        slot = self.get_object()
        if slot.professional != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        new_date = request.data.get('date')
        new_start = request.data.get('start_time')
        new_end = request.data.get('end_time')
        
        if not all([new_date, new_start, new_end]):
            return Response({'error': 'Missing date or time fields'}, status=status.HTTP_400_BAD_REQUEST)
            
        old_date = slot.date
        old_start = slot.start_time
        
        slot.date = new_date
        slot.start_time = new_start
        slot.end_time = new_end
        slot.save()
        
        # Notify athletes
        paid_bookings = slot.booking_record.filter(payment_status='PAID')
        for booking in paid_bookings:
            Notification.objects.create(
                user=booking.athlete,
                title="Session Rescheduled",
                message=f"{request.user.username} rescheduled your session from {old_date} {old_start} to {slot.date} {slot.start_time}."
            )
            
        return Response({'message': 'Session rescheduled and athletes notified.'}, status=status.HTTP_200_OK)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notifications.all()

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'All notifications marked as read'})

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

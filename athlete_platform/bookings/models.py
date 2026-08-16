# bookings/models.py
from django.db import models
from accounts.models import CustomUser

class AvailabilitySlot(models.Model):
    """
    Created by Professionals to define when they are available to work.
    """
    SESSION_CHOICES = (
        ('ONLINE', 'Online Session'),
        ('OFFLINE', 'Offline / In-Person Session'),
    )

    # Links the slot to a specific Professional
    professional = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='available_slots')
    
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    session_type = models.CharField(max_length=10, choices=SESSION_CHOICES, default='OFFLINE')
    
    # Capacity for group sessions (default 10)
    max_capacity = models.IntegerField(default=10)
    
    # The price set by the professional/academy for this specific slot
    price = models.DecimalField(max_digits=8, decimal_places=2, default=1200.00)
    
    # Where the session takes place (populated by professional)
    meeting_link_or_address = models.CharField(max_length=255, blank=True, help_text="Physical address or custom link")

    class Meta:
        ordering = ['date', 'start_time']
        # Prevents a professional from accidentally creating two identical slots at the exact same time
        unique_together = ['professional', 'date', 'start_time']

    def __str__(self):
        return f"{self.professional.username} - {self.date} @ {self.start_time} (Capacity: {self.max_capacity})"


class Booking(models.Model):
    """
    Created when an Athlete successfully pays and claims an AvailabilitySlot.
    """
    PAYMENT_STATUS = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid Successfully'),
        ('FAILED', 'Payment Failed'),
    )
    
    # Links the booking to a specific Athlete
    athlete = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bookings')
    
    # Changed from OneToOne to ForeignKey to allow multiple athletes to book the same slot
    slot = models.ForeignKey(AvailabilitySlot, on_delete=models.PROTECT, related_name='booking_record')
    
    # The digital intake form submitted by the athlete before checkout
    current_goal = models.CharField(max_length=255, blank=True)
    past_injury = models.TextField(blank=True, help_text="Shared with professional at booking")
    
    # Razorpay Gateway Fields
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS, default='PENDING')
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking: {self.athlete.username} with {self.slot.professional.username} on {self.slot.date}"

class Review(models.Model):
    """
    A rating and review left by an Athlete for a Professional after a paid session.
    """
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    athlete = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reviews_given')
    professional = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reviews_received')
    
    rating = models.IntegerField(help_text="1 to 5")
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.athlete.username} for {self.professional.username}: {self.rating} Stars"
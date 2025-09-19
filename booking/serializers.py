from rest_framework import serializers
from .models import Staff, Booking

class AvailabilityQuerySerializer(serializers.Serializer):
    start_iso = serializers.DateTimeField()
    duration_min = serializers.IntegerField(min_value=1, default=60)

class BookingRequestSerializer(serializers.Serializer):
    staff_id = serializers.CharField()
    start_iso = serializers.DateTimeField()
    duration_min = serializers.IntegerField(min_value=1)
    customer_name = serializers.CharField()
    customer_phone = serializers.CharField()
    customer_email = serializers.EmailField()

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = ['id', 'name', 'email', 'phone', 'skills']

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['id', 'staff', 'start', 'end', 'customer_name', 'customer_phone', 'customer_email']

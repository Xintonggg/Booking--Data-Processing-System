from django.shortcuts import render
from django.http import JsonResponse #return the data in json format with the right content type
# Create your views here.

from datetime import timedelta
from django.db.models import Count
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import csv, io, uuid

from .models import Staff, Booking
from .serializers import AvailabilityQuerySerializer, BookingRequestSerializer, StaffSerializer

def test(request):
    return JsonResponse({"status": "ok"})

def overlaps(a_start, a_end, b_start, b_end):
    return a_start < b_end and b_start < a_end

@api_view(['POST'])
def available_staff(request):
    s = AvailabilityQuerySerializer(data=request.data)
    s.is_valid(raise_exception=True)
    start = s.validated_data['start_iso']
    end = start + timedelta(minutes=s.validated_data['duration_min'])

    staff = Staff.objects.all()
    busy_ids = set(Booking.objects.filter(start__lt=end, end__gt=start)
                   .values_list('staff_id', flat=True))
    available = staff.exclude(id__in=busy_ids)

    return Response({"available": StaffSerializer(available, many=True).data})

@api_view(['POST'])
def book(request):
    s = BookingRequestSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    staff_id = s.validated_data['staff_id']
    start = s.validated_data['start_iso']
    end = start + timedelta(minutes=s.validated_data['duration_min'])

    try:
        staff = Staff.objects.get(id=staff_id)
    except Staff.DoesNotExist:
        return Response({"detail": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)

    conflict = Booking.objects.filter(staff=staff, start__lt=end, end__gt=start).exists()
    if conflict:
        return Response({"detail": "Staff not available"}, status=status.HTTP_409_CONFLICT)

    b = Booking.objects.create(
        id=str(uuid.uuid4())[:8],
        staff=staff,
        start=start,
        end=end,
        customer_name=s.validated_data['customer_name'],
        customer_phone=s.validated_data['customer_phone'],
        customer_email=s.validated_data['customer_email'],
    )
    return Response({"ok": True, "booking_id": b.id})

@api_view(['GET'])
def list_bookings(request):
    rows = Booking.objects.select_related('staff').all().order_by('start')
    data = [
        {
            "id": b.id,
            "staff_id": b.staff.id,
            "start": b.start.isoformat(),
            "end": b.end.isoformat(),
            "customer_name": b.customer_name,
            "customer_phone": b.customer_phone,
            "customer_email": b.customer_email,
        }
        for b in rows
    ]
    return Response({"bookings": data})

@api_view(['GET'])
def export_bookings_csv(request):
    rows = Booking.objects.select_related('staff').all().order_by('start')
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id","staff_id","start","end","customer_name","customer_phone","customer_email"])
    for b in rows:
        writer.writerow([b.id, b.staff.id, b.start.isoformat, b.end.isoformat(), b.customer_name, b.customer_phone, b.customer_email])
    return HttpResponse(buf.getvalue(), content_type='text/csv')

from django.db import models

# Create your models here.

class Staff(models.Model):
    id = models.CharField(primary_key = True, max_length = 10)
    name = models.CharField(max_length = 20)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    skills = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.id} - {self.name}"

class Booking(models.Model):
    id = models.CharField(primary_key=True, max_length=20)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='bookings')
    start = models.DateTimeField()
    end = models.DateTimeField()
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=30)
    customer_email = models.EmailField()

    class Meta:
        indexes = [
            models.Index(fields=['staff', 'start']),
            models.Index(fields=['staff', 'end']),
        ]

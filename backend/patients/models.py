import uuid
import datetime
from django.db import models
from django.conf import settings

class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reg_no = models.CharField(max_length=20, unique=True, editable=False)
    full_name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=15, unique=True)
    age = models.IntegerField()
    sex = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')])
    address = models.TextField()
    first_visit_date = models.DateField(default=datetime.date.today)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.reg_no:
            year = datetime.date.today().year
            # Simple logic: Count patients created this year + 1
            # In high concurrency, use a separate Sequence model or DB sequence
            count = Patient.objects.filter(created_at__year=year).count() + 1
            self.reg_no = f"SD-{year}-{count:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.reg_no})"
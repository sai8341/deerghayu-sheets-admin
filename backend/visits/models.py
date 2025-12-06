import uuid
import datetime
from django.db import models
from django.conf import settings
from patients.models import Patient

class Visit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='visits')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    visit_date = models.DateField(default=datetime.date.today)
    
    clinical_history = models.TextField()
    diagnosis = models.TextField()
    treatment_plan = models.TextField()
    investigations = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    follow_up_date = models.DateField(null=True, blank=True)
    no_follow_up_needed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.full_name} - {self.visit_date}"

class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/%Y/%m/')
    name = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.name and self.file:
            self.name = self.file.name
        super().save(*args, **kwargs)
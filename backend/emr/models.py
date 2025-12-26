from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('reception', 'Reception'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='doctor')
    avatar = models.URLField(blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

class Patient(models.Model):
    SEX_CHOICES = (
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    )
    name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=15)
    alt_mobile = models.CharField(max_length=15, blank=True, null=True)
    age = models.IntegerField()
    sex = models.CharField(max_length=10, choices=SEX_CHOICES)
    address = models.TextField()
    reg_no = models.CharField(max_length=50, unique=True)
    first_visit_date = models.DateField()
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    
    # New Field for Initial Registration Documents (Aadhar, Insurance, etc.)
    registration_document = models.FileField(upload_to='patient_docs/', blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.reg_no})"

class Treatment(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.URLField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Price per sitting

    def __str__(self):
        return self.title

class Visit(models.Model):
    STATUS_CHOICES = (
        ('booked', 'Booked / Fee Paid'),
        ('in_progress', 'Consultation In Progress'),
        ('completed', 'Completed'),
    )

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='visits')
    date = models.DateField()
    doctor_name = models.CharField(max_length=255) # Assigned Doctor
    
    # Clinical Data (Filled by Doctor later)
    clinical_history = models.TextField(blank=True)
    diagnosis = models.TextField(blank=True)
    
    # Deprecated: treatment_plan was text. Now structured via VisitTreatment.
    # We keep it as "General Treatment Notes" or similar.
    treatment_plan = models.TextField(blank=True) 
    
    investigations = models.TextField(blank=True)
    notes = models.TextField(blank=True, null=True)
    
    # Billing & Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='booked')
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_paid = models.BooleanField(default=False) # Refers to initial consultation fee payment status
    
    # Final Bill Details
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Fee + Treatments
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Total collected
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Visit for {self.patient.name} on {self.date} ({self.status})"

class VisitAttachment(models.Model):
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name='attachment_files')
    file = models.FileField(upload_to='visit_attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

class VisitTreatment(models.Model):
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name='treatments')
    treatment = models.ForeignKey(Treatment, on_delete=models.CASCADE)
    sittings = models.PositiveIntegerField(default=1)
    cost_per_sitting = models.DecimalField(max_digits=10, decimal_places=2) # Snapshot

    def __str__(self):
        return f"{self.treatment.title} x {self.sittings}"

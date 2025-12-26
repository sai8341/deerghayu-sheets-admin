from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Patient, Visit, VisitAttachment, Treatment

# Register the custom User model
admin.site.register(User, UserAdmin)

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('name', 'reg_no', 'mobile', 'age', 'sex', 'first_visit_date')
    search_fields = ('name', 'reg_no', 'mobile')
    list_filter = ('sex', 'blood_group')

@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ('patient', 'date', 'doctor_name', 'diagnosis')
    search_fields = ('patient__name', 'diagnosis', 'doctor_name')
    list_filter = ('date',)

@admin.register(VisitAttachment)
class VisitAttachmentAdmin(admin.ModelAdmin):
    list_display = ('visit', 'uploaded_at', 'file')

@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'description')

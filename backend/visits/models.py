from django.contrib import admin
from .models import Visit, Attachment

class AttachmentInline(admin.TabularInline):
    model = Attachment
    extra = 0

@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'visit_date', 'diagnosis')
    search_fields = ('patient__full_name', 'diagnosis', 'treatment_plan')
    list_filter = ('visit_date', 'no_follow_up_needed')
    inlines = [AttachmentInline]

@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'visit', 'uploaded_at')
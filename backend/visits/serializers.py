from rest_framework import serializers
from .models import Visit, Attachment
from patients.models import Patient

class AttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = Attachment
        fields = ['id', 'visit', 'file', 'name', 'uploaded_at', 'url']

    def get_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return ''

class VisitSerializer(serializers.ModelSerializer):
    patientId = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(), source='patient', write_only=True
    )
    doctorName = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
    date = serializers.DateField(source='visit_date')
    treatmentPlan = serializers.CharField(source='treatment_plan')
    clinicalHistory = serializers.CharField(source='clinical_history')
    
    class Meta:
        model = Visit
        fields = [
            'id', 'patientId', 'doctorName', 'date', 
            'clinicalHistory', 'diagnosis', 'treatmentPlan', 
            'investigations', 'notes', 'follow_up_date', 
            'no_follow_up_needed', 'attachments'
        ]

    def get_doctorName(self, obj):
        if obj.doctor:
            return f"Dr. {obj.doctor.first_name} {obj.doctor.last_name}"
        return "Unknown"

    def get_attachments(self, obj):
        # Frontend expects an array of strings (URLs)
        request = self.context.get('request')
        urls = []
        for att in obj.attachments.all():
            if att.file and request:
                urls.append(request.build_absolute_uri(att.file.url))
        return urls

    def create(self, validated_data):
        # Assign current user as doctor if not explicitly handled (context required)
        user = self.context['request'].user
        if not validated_data.get('doctor'):
            validated_data['doctor'] = user
        return super().create(validated_data)
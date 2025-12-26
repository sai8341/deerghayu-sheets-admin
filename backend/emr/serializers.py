from rest_framework import serializers
from .models import User, Patient, Visit, VisitAttachment, Treatment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'avatar']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class PatientSerializer(serializers.ModelSerializer):
    firstVisitDate = serializers.DateField(source='first_visit_date')
    regNo = serializers.CharField(source='reg_no')
    altMobile = serializers.CharField(source='alt_mobile', required=False, allow_null=True)
    bloodGroup = serializers.CharField(source='blood_group', required=False, allow_null=True)
    registration_document = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Patient
        fields = ['id', 'name', 'mobile', 'altMobile', 'age', 'sex', 'address', 'regNo', 'firstVisitDate', 'bloodGroup', 'registration_document']

class VisitAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitAttachment
        fields = ['file']

class VisitSerializer(serializers.ModelSerializer):
    patientId = serializers.PrimaryKeyRelatedField(source='patient', queryset=Patient.objects.all())
    doctorName = serializers.CharField(source='doctor_name')
    clinicalHistory = serializers.CharField(source='clinical_history', required=False, allow_blank=True)
    treatmentPlan = serializers.CharField(source='treatment_plan', required=False, allow_blank=True)
    
    # Custom field to return list of file URLs
    attachments = serializers.SerializerMethodField()
    # Write-only field for multiple file uploads
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Visit
        fields = ['id', 'patientId', 'date', 'doctorName', 'clinicalHistory', 'diagnosis', 'treatmentPlan', 'investigations', 'notes', 'attachments', 'files']

    def get_attachments(self, obj):
        # build absolute URI if request is available context
        request = self.context.get('request')
        urls = []
        for att in obj.attachment_files.all():
            if request:
                urls.append(request.build_absolute_uri(att.file.url))
            else:
                urls.append(att.file.url)
        return urls

    def create(self, validated_data):
        files_data = validated_data.pop('files', [])
        visit = Visit.objects.create(**validated_data)
        
        for file in files_data:
            VisitAttachment.objects.create(visit=visit, file=file)
            
        return visit

class TreatmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Treatment
        fields = ['id', 'title', 'description', 'image']

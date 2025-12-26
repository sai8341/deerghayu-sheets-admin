from rest_framework import serializers
from .models import User, Patient, Visit, VisitAttachment, Treatment

class UserSerializer(serializers.ModelSerializer):
    # Frontend sends 'username' as the Full Name. We map this to 'first_name' internally or keep it as username if unique.
    # To avoid confusion and unique constraints, let's treat 'username' field in API as the Display Name.
    # We'll map it to Django's 'username' field but ensure 'email' is used for login.
    
    name = serializers.CharField(source='username', required=False) # Allow writing to 'username' via 'name' alias if needed, or just use username key
    
    role = serializers.SerializerMethodField()
    # Explicitly define write-only password to ensure it's handled
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email', 'role', 'avatar', 'password']
    
    def get_role(self, obj):
        if obj.is_superuser:
            return 'admin'
        return obj.role

    def create(self, validated_data):
        # Extract password to hash it properly
        password = validated_data.pop('password')
        
        # Ensure email is lowercase
        if 'email' in validated_data:
            validated_data['email'] = validated_data['email'].lower()
            
        # Create user using the helper that handles hashing
        user = User.objects.create_user(password=password, **validated_data)
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

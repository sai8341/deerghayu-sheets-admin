from rest_framework import serializers
from .models import User, Patient, Visit, VisitAttachment, Treatment, VisitTreatment, Bill, Payment

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

class TreatmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Treatment
        fields = ['id', 'title', 'description', 'image', 'price']

class VisitTreatmentSerializer(serializers.ModelSerializer):
    treatment = TreatmentSerializer(read_only=True)
    treatment_id = serializers.PrimaryKeyRelatedField(source='treatment', queryset=Treatment.objects.all(), write_only=True)

    class Meta:
        model = VisitTreatment
        fields = ['id', 'treatment', 'treatment_id', 'sittings', 'cost_per_sitting']

class PaymentSerializer(serializers.ModelSerializer):
    receivedBy = serializers.CharField(source='received_by.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'date', 'mode', 'receivedBy']

class BillSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)
    grandTotal = serializers.DecimalField(source='grand_total', max_digits=10, decimal_places=2)
    billNumber = serializers.CharField(source='bill_number', read_only=True)
    balance = serializers.SerializerMethodField()
    totalPaid = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = ['id', 'billNumber', 'grandTotal', 'status', 'payments', 'balance', 'totalPaid']

    def get_totalPaid(self, obj):
        return sum(p.amount for p in obj.payments.all())

    def get_balance(self, obj):
        return obj.grand_total - self.get_totalPaid(obj)

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

    # New Structures
    treatments = VisitTreatmentSerializer(many=True, read_only=True)
    visit_treatments = serializers.ListField(write_only=True, required=False) # For accepting treatment data
    
    status = serializers.ChoiceField(choices=Visit.STATUS_CHOICES, required=False)
    consultationFee = serializers.DecimalField(source='consultation_fee', max_digits=10, decimal_places=2, required=False)
    isPaid = serializers.BooleanField(source='is_paid', required=False)
    
    # Legacy fields (kept for backward compatibility or initial display)
    totalAmount = serializers.DecimalField(source='total_amount', max_digits=10, decimal_places=2, required=False)
    amountPaid = serializers.DecimalField(source='amount_paid', max_digits=10, decimal_places=2, required=False)

    # New Bill Field
    bill = BillSerializer(read_only=True)

    class Meta:
        model = Visit
        fields = ['id', 'patientId', 'date', 'doctorName', 'clinicalHistory', 'diagnosis', 'treatmentPlan', 'investigations', 
                  'notes', 'attachments', 'files', 'status', 'consultationFee', 'isPaid', 'totalAmount', 'amountPaid', 
                  'treatments', 'visit_treatments', 'bill']

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
        visit_treatments_data = validated_data.pop('visit_treatments', [])
        
        visit = Visit.objects.create(**validated_data)
        
        for file_data in files_data:
            VisitAttachment.objects.create(visit=visit, file=file_data)

        # Handle treatments if any (though usually added later)
        if visit_treatments_data:
            for vt_data in visit_treatments_data:
                treatment = Treatment.objects.get(pk=vt_data['treatmentId'])
                VisitTreatment.objects.create(
                    visit=visit,
                    treatment=treatment,
                    sittings=vt_data.get('sittings', 1),
                    cost_per_sitting=treatment.price
                )

        return visit
        
    def update(self, instance, validated_data):
        files_data = validated_data.pop('files', [])
        visit_treatments_data = validated_data.pop('visit_treatments', None)

        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        if files_data:
            for file_data in files_data:
                VisitAttachment.objects.create(visit=instance, file=file_data)
        
        # Update Treatments
        if visit_treatments_data is not None:
            # Clear existing treatments? Or merge? 
            # Logic: If updating treatments, usually easiest to clear and re-add or sync.
            # For simplicity, let's clear and re-add (BE CAREFUL if tracking progress, but here it's simple list)
            instance.treatments.all().delete()
            for vt_data in visit_treatments_data:
                treatment = Treatment.objects.get(pk=vt_data['treatmentId'])
                VisitTreatment.objects.create(
                    visit=instance,
                    treatment=treatment,
                    sittings=vt_data.get('sittings', 1),
                    # Use current price, or valid logic to keep old price if needed. 
                    # Assuming we want fresh price or passed price?
                    # The prompt implies custom pricing might be future, but let's stick to treatment price for now
                    cost_per_sitting=treatment.price 
                )
        
        # Auto-create or Update Bill if we are "finishing" consultation
        # Logic: If totalAmount is present, we should update the Bill.
        
        # Check if Bill exists
        if not hasattr(instance, 'bill'):
            # Create Bill
            Bill.objects.create(
                visit=instance,
                grand_total=instance.total_amount,
                # status depends on payments...
            )
        else:
            instance.bill.grand_total = instance.total_amount
            instance.bill.save()
            
        return instance

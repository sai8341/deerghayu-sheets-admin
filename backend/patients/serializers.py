from rest_framework import serializers
from .models import Patient

class PatientSerializer(serializers.ModelSerializer):
    # Mapping frontend expected keys to backend keys
    name = serializers.CharField(source='full_name')
    regNo = serializers.CharField(source='reg_no', read_only=True)
    firstVisitDate = serializers.DateField(source='first_visit_date')
    
    class Meta:
        model = Patient
        fields = ['id', 'name', 'mobile', 'age', 'sex', 'address', 'regNo', 'firstVisitDate']
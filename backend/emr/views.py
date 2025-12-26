from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db.models import Count
from django.utils import timezone
from .models import User, Patient, Visit, VisitAttachment, Treatment, Bill, Payment
from .serializers import UserSerializer, PatientSerializer, VisitSerializer, TreatmentSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra responses data
        name = self.user.get_full_name()
        if not name:
            name = self.user.username
            
        role = self.user.role
        if self.user.is_superuser:
            role = 'admin'

        data.update({
            'id': self.user.id,
            'name': name,
            'email': self.user.email,
            'role': role,
            'avatar': self.user.avatar
        })
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-id')
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(f"Server Error: {str(e)}", status=status.HTTP_400_BAD_REQUEST)

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(mobile__icontains=search) | queryset.filter(reg_no__icontains=search)
        return queryset

class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.all().order_by('-date')
    serializer_class = VisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patientId', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

    @action(detail=True, methods=['post'])
    def upload_attachment(self, request, pk=None):
        visit = self.get_object()
        file = request.FILES.get('file')
        if file:
            VisitAttachment.objects.create(visit=visit, file=file)
            return Response({'status': 'success'}, status=status.HTTP_200_OK)
        return Response({'details': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        visit = self.get_object()
        
        # Ensure Bill exists
        if not hasattr(visit, 'bill'):
            bill = Bill.objects.create(visit=visit, grand_total=visit.total_amount)
        else:
            bill = visit.bill
        
        amount = request.data.get('amount')
        mode = request.data.get('mode', 'cash')
        
        if not amount:
             return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = float(amount)
        except ValueError:
             return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        payment = Payment.objects.create(
            bill=bill,
            amount=amount,
            mode=mode,
            received_by=request.user
        )
        
        # Update Bill Status and Visit amount_paid CACHE
        total_paid = sum(p.amount for p in bill.payments.all())
        bill_total = float(bill.grand_total)
        
        if total_paid >= bill_total and bill_total > 0:
            bill.status = 'paid'
        elif total_paid > 0:
            bill.status = 'partially_paid'
        else:
            bill.status = 'unpaid'
        bill.save()
        
        # Update Cache fields on Visit for backward compatibility
        visit.amount_paid = total_paid
        # visit.is_paid? No, that's for consultation fee usually, but maybe we should update it too?
        # User said "Mark the bill status as PAID...". We updated Bill status.
        visit.save()

        return Response({'status': 'success', 'payment_id': payment.id}, status=status.HTTP_200_OK)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only admins can see all users
        if self.request.user.role == 'admin' or self.request.user.is_superuser:
            return User.objects.all()
        # Non-admins can only see themselves
        return User.objects.filter(id=self.request.user.id)

    def perform_create(self, serializer):
        # Only admins can create new users
        if self.request.user.role != 'admin' and not self.request.user.is_superuser:
             raise PermissionDenied("Only admins can create new users.")
        
        serializer.save()

    def perform_update(self, serializer):
         # Admin can update anyone; others can only update self (optional constraint)
        is_admin = self.request.user.role == 'admin' or self.request.user.is_superuser
        if not is_admin and self.request.user.id != serializer.instance.id:
            raise PermissionDenied("You do not have permission to edit this user.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin' and not self.request.user.is_superuser:
            raise PermissionDenied("Only admins can delete users.")
        instance.delete()

class TreatmentViewSet(viewsets.ModelViewSet):
    queryset = Treatment.objects.all()
    serializer_class = TreatmentSerializer
    permission_classes = [IsAuthenticated]

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        
        # 1. Summary Stats
        total_patients = Patient.objects.count()
        visits_today = Visit.objects.filter(date=today).count()
        new_registrations = Patient.objects.filter(first_visit_date=today).count()
        pending_reports = Visit.objects.filter(diagnosis='').count()

        stats = [
            {'name': 'Total Patients', 'value': str(total_patients), 'change': '', 'changeType': 'neutral'},
            {'name': 'Visits Today', 'value': str(visits_today), 'change': '', 'changeType': 'neutral'},
            {'name': 'New Registrations', 'value': str(new_registrations), 'change': '', 'changeType': 'neutral'},
            {'name': 'Pending Reports', 'value': str(pending_reports), 'changeType': 'neutral'},
        ]

        # 2. Chart Data (Last 7 Days)
        chart_data = []
        for i in range(6, -1, -1):
            day = today - timezone.timedelta(days=i)
            day_name = day.strftime('%a') # Mon, Tue...
            count = Visit.objects.filter(date=day).count()
            chart_data.append({'name': day_name, 'visits': count})

        return Response({
            'stats': stats,
            'chartData': chart_data
        })

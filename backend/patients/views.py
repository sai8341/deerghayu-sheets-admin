from rest_framework import viewsets, filters
from django.db.models import Q
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from .models import Patient
from .serializers import PatientSerializer
from visits.models import Visit

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-created_at')
    serializer_class = PatientSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name', 'mobile', 'reg_no']

    def get_queryset(self):
        # Custom search logic to match frontend expectations
        queryset = super().get_queryset()
        query = self.request.query_params.get('search', None)
        if query:
            queryset = queryset.filter(
                Q(full_name__icontains=query) | 
                Q(mobile__icontains=query) | 
                Q(reg_no__icontains=query)
            )
        return queryset

    def export_pdf(self, request, pk=None):
        try:
            patient = self.get_object()
            visits = Visit.objects.filter(patient=patient).order_by('-visit_date')
            
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="history_{patient.reg_no}.pdf"'

            p = canvas.Canvas(response, pagesize=A4)
            width, height = A4

            # Header
            p.setFont("Helvetica-Bold", 18)
            p.drawString(50, height - 50, "Sri Deerghayu Ayurvedic Hospital")
            p.setFont("Helvetica", 12)
            p.drawString(50, height - 70, "Clinical History Report")
            
            # Patient Info Box
            p.setStrokeColor(colors.lightgrey)
            p.rect(50, height - 160, 500, 80, fill=0)
            
            p.setFont("Helvetica-Bold", 10)
            p.drawString(60, height - 100, f"Name: {patient.full_name}")
            p.drawString(300, height - 100, f"Reg No: {patient.reg_no}")
            p.drawString(60, height - 120, f"Age/Sex: {patient.age} / {patient.sex}")
            p.drawString(300, height - 120, f"Mobile: {patient.mobile}")
            p.drawString(60, height - 140, f"Address: {patient.address}")

            y = height - 190
            
            p.setFont("Helvetica-Bold", 14)
            p.drawString(50, y, "Visit History")
            y -= 30

            for visit in visits:
                if y < 100: # New page if low on space
                    p.showPage()
                    y = height - 50
                
                # Visit Header
                p.setFillColor(colors.whitesmoke)
                p.rect(50, y-10, 500, 20, fill=1, stroke=0)
                p.setFillColor(colors.black)
                p.setFont("Helvetica-Bold", 10)
                p.drawString(60, y-5, f"Date: {visit.visit_date} | Doctor: {visit.doctor.first_name} {visit.doctor.last_name}")
                y -= 25

                # Details
                p.setFont("Helvetica-Bold", 9)
                p.drawString(60, y, "Diagnosis:")
                p.setFont("Helvetica", 9)
                p.drawString(130, y, str(visit.diagnosis))
                y -= 15

                p.setFont("Helvetica-Bold", 9)
                p.drawString(60, y, "Treatment:")
                p.setFont("Helvetica", 9)
                p.drawString(130, y, str(visit.treatment_plan))
                y -= 15
                
                p.setFont("Helvetica-Bold", 9)
                p.drawString(60, y, "History:")
                p.setFont("Helvetica", 9)
                # Simple text wrap logic would go here, truncating for MVP
                p.drawString(130, y, str(visit.clinical_history)[:80] + "...") 
                y -= 25
                
                p.setStrokeColor(colors.lightgrey)
                p.line(50, y+5, 550, y+5)
                y -= 15

            p.showPage()
            p.save()
            return response
        except Exception as e:
            return HttpResponse(f"Error generating PDF: {str(e)}", status=500)
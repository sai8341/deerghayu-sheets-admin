from rest_framework import viewsets, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Visit, Attachment
from .serializers import VisitSerializer, AttachmentSerializer

class VisitViewSet(viewsets.ModelViewSet):
    serializer_class = VisitSerializer
    queryset = Visit.objects.all().order_by('-visit_date')

    def get_queryset(self):
        # Filter by patient if provided in query params matches frontend API
        patient_id = self.request.query_params.get('patientId') # Frontend mock uses query
        if patient_id:
            return self.queryset.filter(patient__id=patient_id)
        return self.queryset
    
    # Frontend logic: Create visit -> Get ID -> Upload file (or form data)
    # Adding a specific action to handle file upload
    @action(detail=True, methods=['post'], parser_classes=[parsers.MultiPartParser])
    def upload_attachment(self, request, pk=None):
        visit = self.get_object()
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        attachment = Attachment.objects.create(visit=visit, file=file_obj)
        return Response(AttachmentSerializer(attachment, context={'request': request}).data)

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
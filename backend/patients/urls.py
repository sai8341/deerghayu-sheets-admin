from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet

router = DefaultRouter()
router.register(r'patients', PatientViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('patients/<uuid:pk>/export-pdf/', PatientViewSet.as_view({'get': 'export_pdf'}), name='patient-export-pdf'),
]
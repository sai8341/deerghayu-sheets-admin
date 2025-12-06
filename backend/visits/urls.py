from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VisitViewSet, AttachmentViewSet

router = DefaultRouter()
router.register(r'visits', VisitViewSet)
router.register(r'attachments', AttachmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
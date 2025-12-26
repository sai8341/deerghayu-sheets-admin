from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

def home(request):
    return HttpResponse("<h1>Backend Service is Running Successfully!</h1><p>Go to <a href='/admin/'>/admin/</a> or use API endpoints at /api/</p>")

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/', include('emr.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

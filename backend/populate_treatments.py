import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from emr.models import Treatment

treatments = [
    {"title": "Udwarthanam", "price": 1500, "description": "Therapeutic dry powder massage for obesity and skin issues."},
    {"title": "Abhyangam", "price": 1200, "description": "Full body oil massage for relaxation and circulation."},
    {"title": "Nasyam", "price": 800, "description": "Nasal administration of medicated oils."},
    {"title": "Shirodhara", "price": 2500, "description": "Continuous pouring of medicated oil on the forehead."},
    {"title": "Kizhi", "price": 1800, "description": "Poultice massage using herbs or sand."},
    {"title": "Vasti", "price": 2000, "description": "Medicated enema therapy."},
    {"title": "Pizhichil", "price": 3500, "description": "Oil bath therapy."},
    {"title": "Thalapothichil", "price": 1500, "description": "Head pack with medicinal paste."},
]

for t in treatments:
    obj, created = Treatment.objects.get_or_create(
        title=t['title'],
        defaults={'price': t['price'], 'description': t['description']}
    )
    if created:
        print(f"Created {t['title']}")
    else:
        obj.price = t['price']
        obj.description = t['description']
        obj.save()
        print(f"Updated {t['title']}")

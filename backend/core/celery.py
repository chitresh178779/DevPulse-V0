import os
from celery import Celery

# Set default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Name the celery app
app = Celery('devpulse')

# Use Django settings, grabbing anything starting with 'CELERY_'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps (like our 'api' app)
app.autodiscover_tasks()
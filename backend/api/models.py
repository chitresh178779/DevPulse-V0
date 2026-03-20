from django.db import models
from django.contrib.auth.models import User

class Snippet(models.Model):
    # Links the snippet to the logged-in user
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='snippets')
    title = models.CharField(max_length=255)
    code = models.TextField()
    language = models.CharField(max_length=50, default='javascript')
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __clstr__(self):
        return self.title

class ComponentSnippet(models.Model):
    # Link it to the user so everyone has their own private library
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='components')
    title = models.CharField(max_length=255)
    code = models.TextField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
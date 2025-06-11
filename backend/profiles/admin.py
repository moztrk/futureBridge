# profiles/admin.py
from django.contrib import admin
from .models import UserProfile, Friendship, Post, Interaction, Message, Recommendation, UserJourney

# Register your models here.
admin.site.register(UserProfile)
admin.site.register(Friendship)
admin.site.register(Post)
admin.site.register(Interaction)
admin.site.register(Message)
admin.site.register(Recommendation)
admin.site.register(UserJourney)

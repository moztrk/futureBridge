# backend/profiles/urls.py

from django.urls import path
from .views import (
    AuthenticatedUserProfileView,
    PostListCreateView,
    PostDetailView,
    InteractionListCreateView,
)

urlpatterns = [
    path('profile/', AuthenticatedUserProfileView.as_view(), name='authenticated-user-profile'),
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:post_pk>/interactions/', InteractionListCreateView.as_view(), name='interaction-list-create'),
]

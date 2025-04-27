# backend/profiles/urls.py

from django.urls import path
from .views import (
    AuthenticatedUserProfileView,
    PostListCreateView,
    PostDetailView,
    InteractionListCreateView,
    UserSearchView,
    FriendshipListCreateView,  # <-- Bu satır eklenmeli ve doğru yazılmalı
    PendingFriendshipListView,
    UserFriendListView,  # Import UserFriendListView
)  # <-- Import parantezinin burada kapandığından emin olun

urlpatterns = [
    path('search-users/', UserSearchView.as_view(), name='user-search'),
    path('profile/', AuthenticatedUserProfileView.as_view(), name='authenticated-user-profile'),
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:post_pk>/interactions/', InteractionListCreateView.as_view(), name='interaction-list-create'),
    path('users/<uuid:user_uuid>/friends/', UserFriendListView.as_view(), name='user-friend-list'),  # Add UserFriendListView URL
    path('friendships/<int:pk>/', FriendshipListCreateView.as_view(), name='friendship-detail'),
    path('friendships/', FriendshipListCreateView.as_view(), name='friendship-list-create'),
    path('friendships/pending/', PendingFriendshipListView.as_view(), name='pending-friendship-list'),
]
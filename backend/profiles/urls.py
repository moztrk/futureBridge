# backend/profiles/urls.py

from django.urls import path
from .views import (
    AuthenticatedUserProfileView,
    PostListCreateView,
    PostDetailView,
    UserSearchView,
    FriendshipListCreateView,
    PendingFriendshipListView,
    UserFriendListView,
    CommentListCreateView,
    PostLikeToggleView,
    AIAssistantSuggestionView,
)

urlpatterns = [
    path('ai-suggestion/', AIAssistantSuggestionView.as_view(), name='ai_suggestion'),
    path('search-users/', UserSearchView.as_view(), name='user-search'),
    path('profile/', AuthenticatedUserProfileView.as_view(), name='authenticated-user-profile'),
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:post_id>/comments/', CommentListCreateView.as_view(), name='comment-list-create'),
    path('posts/<int:post_id>/like/', PostLikeToggleView.as_view(), name='post-like-toggle'),
    path('friendships/<int:pk>/', FriendshipListCreateView.as_view(), name='friendship-detail'),
    path('friendships/', FriendshipListCreateView.as_view(), name='friendship-list-create'),
    path('friendships/pending/', PendingFriendshipListView.as_view(), name='pending-friendship-list'),
    path('users/<uuid:user_uuid>/friends/', UserFriendListView.as_view(), name='user-friend-list'),
]
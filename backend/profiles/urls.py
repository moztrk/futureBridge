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
    MessageListCreateView,
    RoadmapListCreateView,
    RoadmapDetailView,
    NotificationListView,
    NotificationReadView,
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
    path('pending-friendships/', PendingFriendshipListView.as_view(), name='pending-friendships'),
    path('messages/', MessageListCreateView.as_view(), name='message-list-create'),
    path('roadmap/', RoadmapListCreateView.as_view(), name='roadmap-list-create'),
    path('roadmap/<int:pk>/', RoadmapDetailView.as_view(), name='roadmap-detail'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', NotificationReadView.as_view(), name='notification-read'),
]
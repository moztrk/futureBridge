# backend/profiles/serializers.py

from rest_framework import serializers
from .models import UserProfile, Post, Interaction, Message, Friendship, Recommendation, UserJourney

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('supabase_id',)  # Supabase ID'nin API ile güncellenmemesini sağlar

class PostSerializer(serializers.ModelSerializer):
    # Yazarın nickname'ini ve ID'sini gönderiye ekleyelim
    author_nickname = serializers.CharField(source='author.nickname', read_only=True)
    author_id = serializers.UUIDField(source='author.supabase_id', read_only=True)

    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ('author', 'created_at')  # Yazar ve oluşturulma tarihi backend'de belirlenir

class InteractionSerializer(serializers.ModelSerializer):
    user_nickname = serializers.CharField(source='user.nickname', read_only=True)  # Etkileşimi yapan kişinin nickname'i

    class Meta:
        model = Interaction
        fields = '__all__'
        read_only_fields = ('user', 'created_at')  # Kullanıcı ve tarih backend'de belirlenir

class MessageSerializer(serializers.ModelSerializer):
    sender_nickname = serializers.CharField(source='sender.nickname', read_only=True)
    receiver_nickname = serializers.CharField(source='receiver.nickname', read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('sender', 'receiver', 'created_at')  # Gönderen, alıcı ve tarih backend'de belirlenir

class FriendshipSerializer(serializers.ModelSerializer):
    sender_nickname = serializers.CharField(source='sender.nickname', read_only=True)
    receiver_nickname = serializers.CharField(source='receiver.nickname', read_only=True)

    class Meta:
        model = Friendship
        fields = '__all__'
        read_only_fields = ('sender', 'receiver', 'created_at', 'updated_at')  # Gönderen, alıcı, tarih ve güncelleme backend'de belirlenir

class RecommendationSerializer(serializers.ModelSerializer):
    recommended_post_title = serializers.CharField(source='recommended_post.title', read_only=True)
    recommended_post_id = serializers.UUIDField(source='recommended_post.id', read_only=True)

    class Meta:
        model = Recommendation
        fields = '__all__'
        read_only_fields = ('user', 'recommended_post', 'created_at')  # Kullanıcı, önerilen gönderi ve tarih backend'de belirlenir

class UserJourneySerializer(serializers.ModelSerializer):
    user_nickname = serializers.CharField(source='user.nickname', read_only=True)

    class Meta:
        model = UserJourney
        fields = '__all__'
        read_only_fields = ('user', 'timestamp')  # Kullanıcı ve zaman damgası backend'de belirlenir

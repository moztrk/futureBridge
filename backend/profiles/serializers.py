from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.apps import apps

from .models import UserProfile, Post, Interaction, Message, Friendship, Recommendation, UserJourney


# UserProfile Serializer
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('supabase_id',)


# Post Serializer
class PostSerializer(serializers.ModelSerializer):
    author_nickname = serializers.CharField(source='author.nickname', read_only=True)
    author_avatar_url = serializers.URLField(source='author.avatar_url', read_only=True)

    class Meta:
        model = Post
        fields = [
            'id',
            'author',
            'author_nickname',
            'author_avatar_url',
            'content',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'author',
            'author_nickname',
            'author_avatar_url',
            'created_at',
        ]
        extra_kwargs = {
            'content': {'required': True},
        }


# Interaction Serializer
class InteractionSerializer(serializers.ModelSerializer):
    user_nickname = serializers.CharField(source='user.nickname', read_only=True)
    user_avatar_url = serializers.URLField(source='user.avatar_url', read_only=True)

    class Meta:
        model = Interaction
        fields = [
            'id',
            'user',
            'user_nickname',
            'user_avatar_url',
            'post',
            'type',
            'comment_text',
            'created_at',
        ]
        read_only_fields = ('id', 'user', 'user_nickname', 'user_avatar_url', 'post', 'created_at')


# Message Serializer
class MessageSerializer(serializers.ModelSerializer):
    sender_nickname = serializers.CharField(source='sender.nickname', read_only=True)
    sender_avatar_url = serializers.URLField(source='sender.avatar_url', read_only=True)
    receiver_nickname = serializers.CharField(source='receiver.nickname', read_only=True)
    receiver_avatar_url = serializers.URLField(source='receiver.avatar_url', read_only=True)
    receiver_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'sender_nickname',
            'sender_avatar_url',
            'receiver',
            'receiver_nickname',
            'receiver_avatar_url',
            'receiver_id',
            'content',
            'created_at',
        ]
        read_only_fields = ('id', 'sender', 'receiver', 'sender_nickname', 'sender_avatar_url', 'receiver_nickname', 'receiver_avatar_url', 'created_at')
        extra_kwargs = {
            'content': {'required': True},
        }

    def create(self, validated_data):
        receiver_id = validated_data.pop('receiver_id')
        try:
            receiver_profile = UserProfile.objects.get(supabase_id=receiver_id)
        except UserProfile.DoesNotExist:
            raise ValidationError("Receiver user profile not found.")

        message = Message.objects.create(receiver=receiver_profile, **validated_data)
        return message


# Friendship Serializer
class FriendshipSerializer(serializers.ModelSerializer):
    sender_nickname = serializers.CharField(source='sender.nickname', read_only=True)
    sender_avatar_url = serializers.URLField(source='sender.avatar_url', read_only=True)
    receiver_nickname = serializers.CharField(source='receiver.nickname', read_only=True)
    receiver_avatar_url = serializers.URLField(source='receiver.avatar_url', read_only=True)
    receiver_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Friendship
        fields = [
            'id',
            'sender',
            'sender_nickname',
            'sender_avatar_url',
            'receiver',
            'receiver_nickname',
            'receiver_avatar_url',
            'receiver_id',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ('id', 'sender', 'receiver', 'sender_nickname', 'sender_avatar_url', 'receiver_nickname', 'receiver_avatar_url', 'created_at', 'updated_at')
        extra_kwargs = {
            'status': {'required': False},
        }

    def create(self, validated_data):
        receiver_id = validated_data.pop('receiver_id')
        if not receiver_id:
            raise ValidationError("Receiver ID is required for creating a friendship.")

        try:
            receiver_profile = UserProfile.objects.get(supabase_id=receiver_id)
        except UserProfile.DoesNotExist:
            raise ValidationError("Receiver user profile not found.")

        friendship = Friendship.objects.create(receiver=receiver_profile, **validated_data)
        return friendship

    def update(self, instance, validated_data):
        if 'status' in validated_data:
            instance.status = validated_data['status']
            instance.save()
            return instance
        else:
            raise ValidationError("Only 'status' field can be updated for Friendship.")


# Recommendation Serializer
class RecommendationSerializer(serializers.ModelSerializer):
    recommended_post_title = serializers.CharField(source='recommended_post.title', read_only=True)
    recommended_post_content = serializers.CharField(source='recommended_post.content', read_only=True)
    recommended_post_id = serializers.IntegerField(source='recommended_post.id', read_only=True)
    user_id = serializers.UUIDField(write_only=True)
    recommended_post_input_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Recommendation
        fields = [
            'id',
            'user',
            'user_id',
            'recommended_post',
            'recommended_post_input_id',
            'recommended_post_title',
            'recommended_post_content',
            'created_at',
        ]
        read_only_fields = ('id', 'user', 'recommended_post', 'recommended_post_title', 'recommended_post_content', 'created_at')

    def create(self, validated_data):
        user_id = validated_data.pop('user_id')
        recommended_post_id = validated_data.pop('recommended_post_input_id')

        try:
            user_profile = UserProfile.objects.get(supabase_id=user_id)
            recommended_post = Post.objects.get(id=recommended_post_id)
        except UserProfile.DoesNotExist:
            raise ValidationError("User profile not found.")
        except Post.DoesNotExist:
            raise ValidationError("Recommended post not found.")

        recommendation = Recommendation.objects.create(user=user_profile, recommended_post=recommended_post, **validated_data)
        return recommendation


# UserJourney Serializer
class UserJourneySerializer(serializers.ModelSerializer):
    user_nickname = serializers.CharField(source='user.nickname', read_only=True)
    user_avatar_url = serializers.URLField(source='user.avatar_url', read_only=True)

    class Meta:
        model = UserJourney
        fields = '__all__'
        read_only_fields = ('id', 'user', 'user_nickname', 'user_avatar_url', 'timestamp')


# Friend Serializer
class FriendSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source='supabase_id', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'nickname', 'avatar_url']
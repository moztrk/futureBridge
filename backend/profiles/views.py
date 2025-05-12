# backend/profiles/views.py

import os
import json
import requests
import uuid
from django.apps import apps
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.mixins import (
    ListModelMixin,
    CreateModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
)
from rest_framework.generics import ListAPIView

from .models import UserProfile, Friendship, Post, Interaction, Message, Recommendation, UserJourney
from .serializers import (
    UserProfileSerializer,
    FriendshipSerializer,
    PostSerializer,
    InteractionSerializer,
    MessageSerializer,
    RecommendationSerializer,
    UserJourneySerializer,
    FriendSerializer
)

def get_profiles_model(model_name):
    try:
        return apps.get_model('profiles', model_name)
    except LookupError:
        raise ImportError(f"Model '{model_name}' not found in 'profiles' app.")

@method_decorator(csrf_exempt, name='dispatch')
class AIAssistantSuggestionView(APIView):
    def post(self, request, *args, **kwargs):
        user_input = request.data.get('user_input')

        if not user_input:
            return Response({"detail": "user_input alanı gerekli."}, status=status.HTTP_400_BAD_REQUEST)

        GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
        GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

        if not GEMINI_API_KEY:
            print("HATA: GEMINI_API_KEY ortam değişkeni ayarlanmamış.")
            return Response({"detail": "Backend'de AI hizmeti yapılandırılmamış."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": f"""Kariyer hedeflerim/durumum hakkında bilgi: "{user_input}".
Bana bu konuda kısa ve öz (minimum 4-5, maksimum 10 satır) bir giriş paragrafı ile başlayan, ardından adım adım bir kariyer yol haritası sunar mısın?
Yol haritasındaki her adımı bir emoji (örneğin ✨, ✅, ➡️) veya basit bir işaret (örneğin -, *) ile belirt ve her adımı kısa tut.
Türkçe yanıt ver. Yanıtını Markdown formatında (başlıklar, listeler, kalın yazılar kullanarak) düzenle."""
                            }
                        ]
                    }
                ]
            }

            response = requests.post(f"{GEMINI_API_URL}?key={GEMINI_API_KEY}", json=payload)
            response.raise_for_status()

            gemini_response_data = response.json()
            print("Gemini API Yanıtı:", gemini_response_data)

            suggestion_text = None
            if 'candidates' in gemini_response_data and len(gemini_response_data['candidates']) > 0:
                candidate = gemini_response_data['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content'] and len(candidate['content']['parts']) > 0:
                    suggestion_text = candidate['content']['parts'][0].get('text')

            if suggestion_text:
                return Response({"suggestion_text": suggestion_text}, status=status.HTTP_200_OK)
            else:
                print("HATA: Gemini API'den öneri metni alınamadı veya boş döndü.")
                return Response({"detail": "AI'dan öneri alınamadı. Yanıt formatı beklenenden farklı."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except requests.exceptions.RequestException as e:
            print(f"HATA: Gemini API isteği sırasında hata: {e}")
            return Response({"detail": f"AI hizmeti hatası: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"HATA: Beklenmeyen backend hatası: {e}")
            return Response({"detail": f"Sunucu hatası: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserSearchView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = UserProfile.objects.all()
        query = self.request.query_params.get('q', None)

        if query:
            queryset = queryset.filter(
                Q(nickname__icontains=query)
            ).distinct()

        if isinstance(self.request.user, UserProfile):
            queryset = queryset.exclude(supabase_id=self.request.user.supabase_id)
        elif hasattr(self.request.user, 'supabase_id'):
            queryset = queryset.exclude(supabase_id=self.request.user.supabase_id)

        return queryset

class AuthenticatedUserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        UserProfile = get_profiles_model('UserProfile')
        return UserProfile.objects.all()

    def get_serializer_class(self):
        from .serializers import UserProfileSerializer
        return UserProfileSerializer

    def get_object(self):
        UserProfile = get_profiles_model('UserProfile')

        if isinstance(self.request.user, UserProfile):
            return self.request.user

        if hasattr(self.request.user, 'supabase_id'):
            supabase_user_id = self.request.user.supabase_id
        else:
            raise AuthenticationFailed('User object does not have supabase_id attribute.')

        try:
            return UserProfile.objects.get(supabase_id=supabase_user_id)
        except UserProfile.DoesNotExist:
            print(f"UserProfile bulunamadı, oluşturuluyor: {supabase_user_id}")
            try:
                new_profile = UserProfile.objects.create(supabase_id=supabase_user_id)
                return new_profile
            except Exception as create_error:
                raise AuthenticationFailed(f'Failed to create user profile: {create_error}')
        except Exception as e:
            raise AuthenticationFailed(f'Error retrieving user profile: {e}')

class PostListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PostSerializer

    def get_queryset(self):
        Post = get_profiles_model('Post')
        return Post.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        UserProfile = get_profiles_model('UserProfile')

        if isinstance(self.request.user, UserProfile):
            author_profile = self.request.user
        elif hasattr(self.request.user, 'supabase_id'):
            supabase_user_id = self.request.user.supabase_id
            try:
                author_profile = UserProfile.objects.get(supabase_id=supabase_user_id)
            except UserProfile.DoesNotExist:
                raise serializers.ValidationError("User profile does not exist. Cannot create post.")
        else:
            raise AuthenticationFailed('User object does not have supabase_id attribute.')

        serializer.save(author=author_profile)

class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PostSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        Post = get_profiles_model('Post')
        queryset = Post.objects.all()

        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            UserProfile = get_profiles_model('UserProfile')
            if isinstance(self.request.user, UserProfile):
                return queryset.filter(author=self.request.user)
            elif hasattr(self.request.user, 'supabase_id'):
                supabase_user_id = self.request.user.supabase_id
                return queryset.filter(author__supabase_id=supabase_user_id)
            else:
                raise AuthenticationFailed('User object does not have supabase_id attribute.')

        return queryset

class InteractionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InteractionSerializer

    def get_queryset(self):
        Interaction = get_profiles_model('Interaction')
        post_id = self.kwargs.get('post_pk')

        if post_id:
            return Interaction.objects.filter(post__id=post_id).order_by('-created_at')
        return Interaction.objects.none()

    def perform_create(self, serializer):
        Post = get_profiles_model('Post')
        UserProfile = get_profiles_model('UserProfile')

        post_id = self.kwargs.get('post_pk')

        if not post_id:
            raise serializers.ValidationError("Post ID is required to create an interaction.")

        try:
            post = Post.objects.get(id=post_id)

            if isinstance(self.request.user, UserProfile):
                user_profile = self.request.user
            elif hasattr(self.request.user, 'supabase_id'):
                supabase_user_id = self.request.user.supabase_id
                user_profile = UserProfile.objects.get(supabase_id=supabase_user_id)
            else:
                raise AuthenticationFailed('User object does not have supabase_id attribute.')

            serializer.save(user=user_profile, post=post)

        except Post.DoesNotExist:
            raise serializers.ValidationError("Post does not exist.")
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("User profile not found.")
        except Exception as e:
            raise serializers.ValidationError(f"Error creating interaction: {e}")

class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = InteractionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        Interaction = get_profiles_model('Interaction')
        post_id = self.kwargs.get('post_id')
        if post_id:
            return Interaction.objects.filter(post__id=post_id, type='comment').order_by('created_at')
        return Interaction.objects.none()

    def perform_create(self, serializer):
        Post = get_profiles_model('Post')
        UserProfile = get_profiles_model('UserProfile')
        post_id = self.kwargs.get('post_id')

        if not post_id:
            raise serializers.ValidationError("Post ID is required to create a comment.")

        try:
            post = Post.objects.get(id=post_id)
            user_profile = self.request.user if isinstance(self.request.user, UserProfile) else UserProfile.objects.get(supabase_id=self.request.user.supabase_id)

            serializer.save(user=user_profile, post=post, type='comment', comment_text=serializer.validated_data.get('comment_text'))
        except Post.DoesNotExist:
            raise serializers.ValidationError("Post does not exist.")
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("User profile not found.")
        except Exception as e:
            raise serializers.ValidationError(f"Error creating comment: {e}")

class PostLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        Post = get_profiles_model('Post')
        Interaction = get_profiles_model('Interaction')
        UserProfile = get_profiles_model('UserProfile')

        try:
            post = Post.objects.get(id=post_id)
            user_profile = self.request.user if isinstance(self.request.user, UserProfile) else UserProfile.objects.get(supabase_id=self.request.user.supabase_id)

            existing_like = Interaction.objects.filter(post=post, user=user_profile, type='like').first()

            if existing_like:
                existing_like.delete()
                liked = False
            else:
                Interaction.objects.create(post=post, user=user_profile, type='like')
                liked = True

            updated_likes_count = Interaction.objects.filter(post=post, type='like').count()

            return Response({'liked': liked, 'likes_count': updated_likes_count}, status=status.HTTP_200_OK)

        except Post.DoesNotExist:
            return Response({"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            return Response({"detail": "User profile not found."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"An error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        Message = get_profiles_model('Message')
        UserProfile = get_profiles_model('UserProfile')

        user_id = self.request.user.supabase_id

        return Message.objects.filter(
            Q(sender__supabase_id=user_id) | Q(receiver__supabase_id=user_id)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        UserProfile = get_profiles_model('UserProfile')

        sender_id = self.request.user.supabase_id
        receiver_id_str = self.request.data.get('receiver_id')

        if not receiver_id_str:
            raise serializers.ValidationError("Receiver ID is required.")

        try:
            receiver_id = uuid.UUID(receiver_id_str)
        except ValueError:
            raise serializers.ValidationError("Invalid receiver ID format.")

        try:
            sender = UserProfile.objects.get(supabase_id=sender_id)
            receiver = UserProfile.objects.get(supabase_id=receiver_id)

            serializer.save(sender=sender, receiver=receiver)
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("Sender or receiver user profile not found.")
        except Exception as e:
            raise serializers.ValidationError(f"Error creating message: {e}")

class FriendshipListCreateView(
    generics.GenericAPIView,
    ListModelMixin,
    CreateModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    DestroyModelMixin
):
    permission_classes = [IsAuthenticated]
    serializer_class = FriendshipSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        Friendship = get_profiles_model('Friendship')
        UserProfile = get_profiles_model('UserProfile')

        if isinstance(self.request.user, UserProfile):
            user_id = self.request.user.supabase_id
        elif hasattr(self.request.user, 'supabase_id'):
            user_id = self.request.user.supabase_id
        else:
            raise AuthenticationFailed('User object does not have supabase_id attribute.')

        return Friendship.objects.filter(
            Q(sender__supabase_id=user_id) | Q(receiver__supabase_id=user_id)
        ).select_related('sender', 'receiver')

    def get(self, request, *args, **kwargs):
        if 'pk' in kwargs:
            return self.retrieve(request, *args, **kwargs)
        else:
            return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        UserProfile = get_profiles_model('UserProfile')
        Friendship = get_profiles_model('Friendship')

        sender_id = self.request.user.supabase_id
        receiver_id_str = self.request.data.get('receiver_id')

        if not receiver_id_str:
            raise serializers.ValidationError("Receiver ID is required.")

        try:
            receiver_id = uuid.UUID(receiver_id_str)
        except ValueError:
            raise serializers.ValidationError("Invalid receiver ID format.")

        if sender_id == receiver_id:
            raise serializers.ValidationError({"non_field_errors": ["Cannot create friendship with yourself."]})

        existing_friendship = Friendship.objects.filter(
            Q(sender__supabase_id=sender_id, receiver__supabase_id=receiver_id) |
            Q(sender__supabase_id=receiver_id, receiver__supabase_id=sender_id)
        ).first()

        if existing_friendship:
            raise serializers.ValidationError({"non_field_errors": ["Friendship already exists or pending."]})

        try:
            sender = UserProfile.objects.get(supabase_id=sender_id)
            receiver = UserProfile.objects.get(supabase_id=receiver_id)

            serializer.save(sender=sender, receiver=receiver)

        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("Sender or receiver user profile not found.")
        except Exception as e:
            raise serializers.ValidationError(f"Error creating friendship: {e}")

    def perform_update(self, serializer):
        Friendship = get_profiles_model('Friendship')
        UserProfile = get_profiles_model('UserProfile')

        friendship_instance = serializer.instance

        if isinstance(self.request.user, UserProfile):
            requesting_user_id = self.request.user.supabase_id
        elif hasattr(self.request.user, 'supabase_id'):
            requesting_user_id = self.request.user.supabase_id
        else:
            raise AuthenticationFailed('User object does not have supabase_id attribute.')

        if friendship_instance.receiver.supabase_id != requesting_user_id:
            raise PermissionDenied("Sadece isteği alan kişi arkadaşlık isteğini güncelleyebilir.")

        if friendship_instance.status != 'pending':
            raise serializers.ValidationError("Bekleyen durumda olmayan bir arkadaşlık isteği güncellenemez.")

        new_status = serializer.validated_data.get('status')

        if new_status not in ['accepted', 'rejected']:
            raise serializers.ValidationError("Arkadaşlık durumu sadece 'accepted' veya 'rejected' olarak güncellenebilir.")

        serializer.save()

    def perform_destroy(self, instance):
        UserProfile = get_profiles_model('UserProfile')

        if isinstance(self.request.user, UserProfile):
            requesting_user_id = self.request.user.supabase_id
        elif hasattr(self.request.user, 'supabase_id'):
            requesting_user_id = self.request.user.supabase_id
        else:
            raise AuthenticationFailed('User object does not have supabase_id attribute.')

        is_sender = instance.sender.supabase_id == requesting_user_id
        is_receiver = instance.receiver.supabase_id == requesting_user_id

        if not is_sender and not is_receiver:
            raise PermissionDenied("Sadece arkadaşlığın tarafları silebilir.")

        instance.delete()

class PendingFriendshipListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FriendshipSerializer

    def get_queryset(self):
        Friendship = get_profiles_model('Friendship')
        UserProfile = get_profiles_model('UserProfile')

        if isinstance(self.request.user, UserProfile):
            user_id = self.request.user.supabase_id
        elif hasattr(self.request.user, 'supabase_id'):
            user_id = self.request.user.supabase_id
        else:
            raise AuthenticationFailed('User object does not have supabase_id attribute.')

        return Friendship.objects.filter(
            receiver__supabase_id=user_id,
            status='pending'
        ).select_related('sender', 'receiver')

class RecommendationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RecommendationSerializer

    def get_queryset(self):
        Recommendation = get_profiles_model('Recommendation')
        UserProfile = get_profiles_model('UserProfile')

        user_id = self.request.user.supabase_id

        return Recommendation.objects.filter(user__supabase_id=user_id).order_by('-created_at')

    def perform_create(self, serializer):
        Recommendation = get_profiles_model('Recommendation')
        Post = get_profiles_model('Post')
        UserProfile = get_profiles_model('UserProfile')

        user_id_str = self.request.data.get('user_id')
        recommended_post_id = self.request.data.get('recommended_post_id')

        if not user_id_str or not recommended_post_id:
            raise serializers.ValidationError("User ID and Recommended Post ID are required.")

        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise serializers.ValidationError("Invalid user ID format.")

        try:
            user_profile = UserProfile.objects.get(supabase_id=user_id)
            recommended_post = Post.objects.get(id=recommended_post_id)

            serializer.save(user=user_profile, recommended_post=recommended_post)

        except (UserProfile.DoesNotExist, Post.DoesNotExist):
            raise serializers.ValidationError("User profile or recommended post not found.")
        except Exception as e:
            raise serializers.ValidationError(f"Error creating recommendation: {e}")

class UserJourneyListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserJourneySerializer

    def get_queryset(self):
        UserJourney = get_profiles_model('UserJourney')
        UserProfile = get_profiles_model('UserProfile')

        user_id = self.request.user.supabase_id

        return UserJourney.objects.filter(user__supabase_id=user_id).order_by('-timestamp')

    def perform_create(self, serializer):
        UserJourney = get_profiles_model('UserJourney')
        UserProfile = get_profiles_model('UserProfile')

        user_id = self.request.user.supabase_id

        try:
            user_profile = UserProfile.objects.get(supabase_id=user_id)
            serializer.save(user=user_profile)
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("User profile not found.")
        except Exception as e:
            raise serializers.ValidationError(f"Error creating user journey entry: {e}")

class UserFriendListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FriendSerializer

    def get_queryset(self):
        Friendship = get_profiles_model('Friendship')
        UserProfile = get_profiles_model('UserProfile')

        user_uuid = self.kwargs.get('user_uuid')

        accepted_friendships = Friendship.objects.filter(
            Q(sender__supabase_id=user_uuid) | Q(receiver__supabase_id=user_uuid),
            status='accepted'
        ).select_related('sender', 'receiver')

        sender_friend_ids = accepted_friendships.filter(sender__supabase_id=user_uuid).values_list('receiver__supabase_id', flat=True)
        receiver_friend_ids = accepted_friendships.filter(receiver__supabase_id=user_uuid).values_list('sender__supabase_id', flat=True)

        friend_uuids_queryset = sender_friend_ids.union(receiver_friend_ids)

        friend_profiles_queryset = UserProfile.objects.filter(
            supabase_id__in=list(friend_uuids_queryset)
        ).exclude(supabase_id=user_uuid).distinct()

        return friend_profiles_queryset
# backend/profiles/views.py

from rest_framework import generics, status
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
from rest_framework.generics import ListAPIView  # Import ListAPIView

from django.apps import apps
import uuid
from rest_framework import serializers
from django.db.models import Q

from .models import UserProfile, Friendship
from .serializers import UserProfileSerializer, FriendshipSerializer
from .serializers import PostSerializer, InteractionSerializer, MessageSerializer, RecommendationSerializer, UserJourneySerializer
from .serializers import FriendSerializer  # Import FriendSerializer


# Modelleri dinamik olarak yüklemek için yardımcı fonksiyon
def get_profiles_model(model_name):
    """Belirtilen modeli 'profiles' uygulamasından dinamik olarak yükler."""
    try:
        return apps.get_model('profiles', model_name)
    except LookupError:
        raise ImportError(f"Model '{model_name}' not found in 'profiles' app. Make sure it's defined in models.py and 'profiles' is in INSTALLED_APPS.")


# --- Yeni Kullanıcı Arama View'i ---
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

        return queryset


# Kimliği doğrulanmış kullanıcının profilini getirme ve güncelleme
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

        supabase_user_id = self.request.user.supabase_id

        try:
            return UserProfile.objects.get(supabase_id=supabase_user_id)
        except UserProfile.DoesNotExist:
            print(f"UserProfile bulunamadı, oluşturuluyor: {supabase_user_id}")
            try:
                new_profile = UserProfile.objects.create(supabase_id=supabase_user_id)
                return new_profile
            except Exception as create_error:
                raise AuthenticationFailed(f'Failed to create user profile: {create_error}')


# Gönderi Listeleme ve Oluşturma
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
        else:
            supabase_user_id = self.request.user.supabase_id
            try:
                author_profile = UserProfile.objects.get(supabase_id=supabase_user_id)
            except UserProfile.DoesNotExist:
                raise serializers.ValidationError("User profile does not exist. Cannot create post.")

        serializer.save(author=author_profile)


# Tek bir gönderiyi getirme, güncelleme veya silme
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
            else:
                supabase_user_id = self.request.user.supabase_id
                return queryset.filter(author__supabase_id=supabase_user_id)

        return queryset


# Etkileşim Listeleme ve Oluşturma (Belirli bir posta ait)
class InteractionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InteractionSerializer

    def get_queryset(self):
        Interaction = get_profiles_model('Interaction')
        Post = get_profiles_model('Post')

        post_id = self.kwargs.get('post_pk')

        if post_id:
            return Interaction.objects.filter(post__id=post_id).order_by('-created_at')
        return Interaction.objects.none()

    def perform_create(self, serializer):
        Post = get_profiles_model('Post')
        UserProfile = get_profiles_model('UserProfile')

        post_id = self.kwargs.get('post_pk')

        if post_id:
            try:
                post = Post.objects.get(id=post_id)

                if isinstance(self.request.user, UserProfile):
                    user_profile = self.request.user
                else:
                    supabase_user_id = self.request.user.supabase_id
                    user_profile = UserProfile.objects.get(supabase_id=supabase_user_id)

                serializer.save(user=user_profile, post=post)

            except Post.DoesNotExist:
                raise serializers.ValidationError("Post does not exist.")
            except UserProfile.DoesNotExist:
                raise serializers.ValidationError("User profile not found.")
            except Exception as e:
                raise serializers.ValidationError(f"Error creating interaction: {e}")
        else:
            raise serializers.ValidationError("Post ID is required to create an interaction.")


# Mesaj Listeleme ve Oluşturma
class MessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        Message = get_profiles_model('Message')
        UserProfile = get_profiles_model('UserProfile')

        user_id = self.request.user.supabase_id

        return Message.objects.filter(sender__supabase_id=user_id) | Message.objects.filter(receiver__supabase_id=user_id).order_by('-created_at')

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


# Arkadaşlık Oluşturma, Listeleme, Detay, Güncelleme ve Silme (Kabul/Reddetme için güncelleme kullanılacak)
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
        else:
            user_id = self.request.user.supabase_id

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
            raise serializers.ValidationError("Cannot create friendship with yourself.")

        existing_friendship = Friendship.objects.filter(
            sender__supabase_id=sender_id, receiver__supabase_id=receiver_id
        ) | Friendship.objects.filter(
            sender__supabase_id=receiver_id, receiver__supabase_id=sender_id
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
        else:
            requesting_user_id = self.request.user.supabase_id

        if friendship_instance.receiver.supabase_id != requesting_user_id:
            from rest_framework.exceptions import PermissionDenied
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
        else:
            requesting_user_id = self.request.user.supabase_id

        is_sender = instance.sender.supabase_id == requesting_user_id
        is_receiver = instance.receiver.supabase_id == requesting_user_id

        if not is_sender and not is_receiver:
            raise PermissionDenied("Sadece arkadaşlığın tarafları silebilir.")

        instance.delete()


# Bekleyen Arkadaşlık İsteklerini Listeleme View'ı
class PendingFriendshipListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FriendshipSerializer

    def get_queryset(self):
        Friendship = get_profiles_model('Friendship')
        UserProfile = get_profiles_model('UserProfile')

        if isinstance(self.request.user, UserProfile):
            user_id = self.request.user.supabase_id
        else:
            user_id = self.request.user.supabase_id

        return Friendship.objects.filter(
            receiver__supabase_id=user_id,
            status='pending'
        ).select_related('sender', 'receiver')


# Öneri Listeleme (Oluşturma AI tarafından yapılacağı varsayılabilir veya admin)
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


# Kullanıcı Yolculukları (User Journey) Listeleme
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


# Belirli bir kullanıcının kabul edilmiş arkadaşlarını listeleme View'ı
class UserFriendListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FriendSerializer

    def get_queryset(self):
        # Friendship ve UserProfile modellerini dinamik olarak yükle
        Friendship = get_profiles_model('Friendship')
        UserProfile = get_profiles_model('UserProfile')

        # URL'den kullanıcı UUID'sini al - BU ZATEN BİR UUID NESNESİDİR
        user_uuid = self.kwargs.get('user_uuid')  # Django otomatik olarak UUID nesnesine dönüştürür

        # Bu kullanıcının hem gönderen hem de alıcı olduğu KABUL EDİLMİŞ arkadaşlıkları bul
        accepted_friendships = Friendship.objects.filter(
            Q(sender__supabase_id=user_uuid) | Q(receiver__supabase_id=user_uuid),
            status='accepted'
        ).select_related('sender', 'receiver')

        # Kullanıcının arkadaş olduğu diğer kullanıcıların supabase_id'lerini bul
        sender_friend_ids = accepted_friendships.filter(sender__supabase_id=user_uuid).values_list('receiver__supabase_id', flat=True)
        receiver_friend_ids = accepted_friendships.filter(receiver__supabase_id=user_uuid).values_list('sender__supabase_id', flat=True)

        # Her iki QuerySet'i birleştirerek eşsiz UUID'lerin QuerySet'ini oluştur
        friend_uuids_queryset = sender_friend_ids.union(receiver_friend_ids)  # union() mükerrerleri otomatik kaldırır

        # Bu UUID'lere sahip UserProfile objelerini çek
        friend_profiles_queryset = UserProfile.objects.filter(
            supabase_id__in=list(friend_uuids_queryset)  # QuerySet'i listeye çevirip __in ile kullanmak
        ).exclude(supabase_id=user_uuid).distinct()  # Kendi profilimizi hariç tut

        return friend_profiles_queryset

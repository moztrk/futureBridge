# backend/profiles/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed
# from .models import UserProfile, Post, Interaction, Message, Friendship, Recommendation, UserJourney # BU SATIRI SİLİYORUZ!
# from .serializers import UserProfileSerializer, PostSerializer, InteractionSerializer, MessageSerializer, FriendshipSerializer, RecommendationSerializer, UserJourneySerializer # BU SATIRI SİLİYORUZ!

from django.apps import apps # Modelleri dinamik yüklemek için
import uuid # Gerekirse UUID işlemleri için
from rest_framework import serializers # ValidationError için


# Modelleri dinamik olarak yüklemek için yardımcı fonksiyon
def get_profiles_model(model_name):
    """Belirtilen modeli 'profiles' uygulamasından dinamik olarak yükler."""
    try:
        # apps.get_model('uygulama_adi', 'ModelAdi') formatı kullanılır
        return apps.get_model('profiles', model_name)
    except LookupError:
        # Model bulunamazsa anlaşılır bir hata mesajı fırlat
        raise ImportError(f"Model '{model_name}' not found in 'profiles' app. Make sure it's defined in models.py and 'profiles' is in INSTALLED_APPS.")


# Serializerları dinamik olarak yüklemek için yardımcı fonksiyon (Opsiyonel)
# View'lerde get_serializer_class içinde de doğrudan import edilebilir.
# def get_profiles_serializer(serializer_name):
#     """Belirtilen serializerı 'profiles' uygulamasından dinamik olarak yükler."""
#     try:
#         # Serializer dosyasını ve içindeki sınıfı dinamik olarak import et
#         module = importlib.import_module('.serializers', package='profiles')
#         return getattr(module, serializer_name)
#     except (ImportError, AttributeError):
#         raise ImportError(f"Serializer '{serializer_name}' not found in 'profiles.serializers'.")
# import importlib # get_profiles_serializer kullanacaksanız ekleyin


# Kimliği doğrulanmış kullanıcının profilini getirme ve güncelleme
class AuthenticatedUserProfileView(generics.RetrieveUpdateAPIView):
    # queryset ve serializer_class doğrudan model/serializer import edemeyeceğimiz için
    # metodlar içinde tanımlanacak veya get_queryset/get_serializer_class override edilecek
    permission_classes = [IsAuthenticated] # Sadece login olan kullanıcılar erişebilir

    def get_queryset(self):
        # UserProfile modelini dinamik olarak yükle
        UserProfile = get_profiles_model('UserProfile')
        # Tüm UserProfile objelerini döndür (genellikle bu view için sadece 1 tane döner - request.user'ın profili)
        return UserProfile.objects.all()

    def get_serializer_class(self):
        # UserProfileSerializer'ı import et ve döndür
        from .serializers import UserProfileSerializer
        return UserProfileSerializer

    def get_object(self):
        # Bu metod, look up değerine göre obje bulur. Biz request.user'a göre bulacağız.
        # request.user Authentication sınıfımız tarafından atanır ve Supabase UUID'sini veya UserProfile nesnesini içerir.

        # UserProfile modelini dinamik olarak yükle
        UserProfile = get_profiles_model('UserProfile')

        # Eğer authentication sınıfımız UserProfile döndürüyorsa, request.user zaten UserProfile nesnesidir
        if isinstance(self.request.user, UserProfile):
             return self.request.user

        # Eğer sadece SupabaseAuthenticatedUser nesnesini döndürüyorsa, UserProfile'ı bulmamız gerekir:
        supabase_user_id = self.request.user.id # Buradaki request.user.id UUID olmalı

        try:
            # Bu Supabase ID'ye sahip UserProfile nesnesini döndür
            return UserProfile.objects.get(supabase_id=supabase_user_id)
        except UserProfile.DoesNotExist:
             # Eğer Supabase'de kullanıcı var (token geçerli) ama bizim DB'mizde UserProfile yoksa, otomatik oluştur
             # print(f"UserProfile bulunamadı, oluşturuluyor: {supabase_user_id}") # Debug
             try:
                 new_profile = UserProfile.objects.create(supabase_id=supabase_user_id)
                 return new_profile # Yeni oluşturulan profili döndür
             except Exception as create_error:
                 # Profil oluştururken bir hata olursa
                 raise AuthenticationFailed(f'Failed to create user profile: {create_error}')


# Gönderi Listeleme ve Oluşturma
class PostListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Post modelini dinamik olarak yükle
        Post = get_profiles_model('Post')
        # Tüm gönderileri oluşturulma tarihine göre tersten sırala
        return Post.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        # PostSerializer'ı import et
        from .serializers import PostSerializer
        return PostSerializer

    def perform_create(self, serializer):
        # Gönderi oluşturulurken yazar bilgisini otomatik olarak kimliği doğrulanmış kullanıcıdan alır

        # UserProfile modelini dinamik olarak yükle
        UserProfile = get_profiles_model('UserProfile')

        # Eğer authentication sınıfımız UserProfile döndürüyorsa, request.user zaten UserProfile'dır
        if isinstance(self.request.user, UserProfile):
             author_profile = self.request.user
        else:
             # SupabaseAuthenticatedUser nesnesinden ID'yi al ve UserProfile'ı bul
             supabase_user_id = self.request.user.id
             try:
                author_profile = UserProfile.objects.get(supabase_id=supabase_user_id)
             except UserProfile.DoesNotExist:
                # Kullanıcı profili yoksa, gönderi oluşturmasına izin verme veya hata fırlat
                raise serializers.ValidationError("User profile does not exist. Cannot create post.")

        # Serilizerı kaydet, yazar alanını belirle
        serializer.save(author=author_profile)


# Tek bir gönderiyi getirme, güncelleme veya silme
class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk' # URL'de gönderi ID'si için kullanılacak alan

    def get_queryset(self):
         # Post modelini dinamik olarak yükle
         Post = get_profiles_model('Post')
         # Varsayılan queryset'i al (burada tüm Post objeleridir)
         queryset = Post.objects.all()

         # Update (PUT/PATCH) ve Delete (DELETE) istekleri için sadece kullanıcının kendi gönderilerini filtrele
         if self.request.method in ['PUT', 'PATCH', 'DELETE']:
             # UserProfile modelini dinamik olarak yükle
             UserProfile = get_profiles_model('UserProfile')
             # Eğer authentication sınıfımız UserProfile döndürüyorsa:
             if isinstance(self.request.user, UserProfile):
                  return queryset.filter(author=self.request.user)
             else:
                  # SupabaseAuthenticatedUser nesnesinden ID'yi alıp filtrele
                  supabase_user_id = self.request.user.id
                  return queryset.filter(author__supabase_id=supabase_user_id)

         # GET (Retrieve) isteği için tüm gönderileri döndür (permission_classes zaten kimlik doğrulaması yapar)
         return queryset

    def get_serializer_class(self):
        # PostSerializer'ı import et
        from .serializers import PostSerializer
        return PostSerializer

# Etkileşim Listeleme ve Oluşturma (Belirli bir posta ait)
class InteractionListCreateView(generics.ListCreateAPIView):
     permission_classes = [IsAuthenticated]

     def get_queryset(self):
          # Interaction ve Post modellerini dinamik olarak yükle
          Interaction = get_profiles_model('Interaction')
          Post = get_profiles_model('Post')

          # URL'deki post_pk parametresini al
          post_id = self.kwargs.get('post_pk')

          if post_id:
              # Belirli bir posta ait etkileşimleri filtrele
              # İlgili Post objesi var mı diye kontrol etmek isterseniz ayrıca çekebilirsiniz
              # try:
              #     post = Post.objects.get(id=post_id)
              # except Post.DoesNotExist:
              #     # Post yoksa boş küme veya 404 döndür
              #     return Interaction.objects.none() # veya raise status.HTTP_404_NOT_FOUND
              return Interaction.objects.filter(post__id=post_id).order_by('-created_at')
          # post_pk yoksa veya geçersizse boş küme döndür (veya hata döndürmeyi seçebilirsiniz)
          return Interaction.objects.none()


     def get_serializer_class(self):
         # InteractionSerializer'ı import et
         from .serializers import InteractionSerializer
         return InteractionSerializer


     def perform_create(self, serializer):
         # Etkileşimi yapan kullanıcıyı ve postu otomatik ata

         # Modelleri dinamik olarak yükle
         Post = get_profiles_model('Post')
         UserProfile = get_profiles_model('UserProfile')

         # URL'deki post_pk parametresini al
         post_id = self.kwargs.get('post_pk')

         if post_id:
             try:
                # İlgili Post nesnesini bul
                post = Post.objects.get(id=post_id)

                # Etkileşimi yapan kullanıcıyı bul (request.user'dan)
                # Eğer authentication sınıfımız UserProfile döndürüyorsa:
                if isinstance(self.request.user, UserProfile):
                    user_profile = self.request.user
                else:
                    # SupabaseAuthenticatedUser nesnesinden ID'yi alıp UserProfile'ı bul (veya otomatik oluştur)
                    supabase_user_id = self.request.user.id
                    user_profile = UserProfile.objects.get(supabase_id=supabase_user_id) # Veya otomatik oluşturma mantığı

                # Serilizerı kaydet, user ve post alanlarını belirle
                serializer.save(user=user_profile, post=post)

             except Post.DoesNotExist:
                 # İlgili post bulunamazsa hata döndür
                 raise serializers.ValidationError("Post does not exist.")
             except UserProfile.DoesNotExist:
                  # Kullanıcı profili bulunamazsa hata döndür (otomatik oluşturma yoksa)
                  raise serializers.ValidationError("User profile not found.")
             except Exception as e:
                  # Diğer beklenmeyen hatalar
                  raise serializers.ValidationError(f"Error creating interaction: {e}")
         else:
             # post_pk URL'de belirtilmemişse hata
             raise serializers.ValidationError("Post ID is required to create an interaction.")


# Mesaj Listeleme ve Oluşturma
class MessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Message ve UserProfile modellerini dinamik olarak yükle
        Message = get_profiles_model('Message')
        UserProfile = get_profiles_model('UserProfile')

        user_id = self.request.user.id # request.user.id zaten UUID olmalı

        # Kullanıcının gönderdiği veya aldığı mesajları filtrele
        return Message.objects.filter(sender__supabase_id=user_id) | Message.objects.filter(receiver__supabase_id=user_id).order_by('-created_at') # Mesajları tarihe göre sırala

    def get_serializer_class(self):
        # MessageSerializer'ı import et
        from .serializers import MessageSerializer
        return MessageSerializer

    def perform_create(self, serializer):
        # Mesaj gönderen ve alıcıyı otomatik ata

        # UserProfile modelini dinamik olarak yükle
        UserProfile = get_profiles_model('UserProfile')

        sender_id = self.request.user.id # request.user.id zaten UUID olmalı
        receiver_id_str = self.request.data.get('receiver_id') # İstek body'sinden alıcı ID'sini al

        if not receiver_id_str:
             raise serializers.ValidationError("Receiver ID is required.")

        try:
            # ID stringini UUID'ye çevir
            receiver_id = uuid.UUID(receiver_id_str)
        except ValueError:
            raise serializers.ValidationError("Invalid receiver ID format.")


        try:
            # Gönderen ve alıcı UserProfile objelerini bul
            sender = UserProfile.objects.get(supabase_id=sender_id)
            receiver = UserProfile.objects.get(supabase_id=receiver_id)

            # Serializerı kaydet, sender ve receiver alanlarını belirle
            serializer.save(sender=sender, receiver=receiver)
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("Sender or receiver user profile not found.")
        except Exception as e:
             raise serializers.ValidationError(f"Error creating message: {e}")


# Arkadaşlık Oluşturma ve Listeleme
class FriendshipListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Friendship ve UserProfile modellerini dinamik olarak yükle
        Friendship = get_profiles_model('Friendship')
        UserProfile = get_profiles_model('UserProfile')

        user_id = self.request.user.id # request.user.id zaten UUID olmalı

        # Kullanıcının başlattığı veya kabul ettiği arkadaşlıkları filtrele
        # (Friendship modelinize accepted, initiated gibi alanlar eklemiş olabilirsiniz)
        # Bu örnekte sadece kullanıcının sender veya receiver olduğu arkadaşlıkları listeler
        return Friendship.objects.filter(sender__supabase_id=user_id) | Friendship.objects.filter(receiver__supabase_id=user_id)

    def get_serializer_class(self):
        # FriendshipSerializer'ı import et
        from .serializers import FriendshipSerializer
        return FriendshipSerializer

    def perform_create(self, serializer):
        # Arkadaşlık isteği gönderen ve alan kullanıcıları otomatik ata

        # UserProfile modelini dinamik olarak yükle
        UserProfile = get_profiles_model('UserProfile')

        sender_id = self.request.user.id # request.user.id zaten UUID olmalı
        receiver_id_str = self.request.data.get('receiver_id') # İstek body'sinden alıcı ID'sini al

        if not receiver_id_str:
             raise serializers.ValidationError("Receiver ID is required.")

        try:
            # ID stringini UUID'ye çevir
            receiver_id = uuid.UUID(receiver_id_str)
        except ValueError:
            raise serializers.ValidationError("Invalid receiver ID format.")

        # Gönderen ve alıcı aynı kişi olamaz
        if sender_id == receiver_id:
             raise serializers.ValidationError("Cannot create friendship with yourself.")

        # Daha önce böyle bir arkadaşlık isteği gönderilmiş mi kontrol et (opsiyonel ama iyi pratik)
        Friendship = get_profiles_model('Friendship')
        existing_friendship = Friendship.objects.filter(
             sender__supabase_id=sender_id, receiver__supabase_id=receiver_id
        ) | Friendship.objects.filter(
             sender__supabase_id=receiver_id, receiver__supabase_id=sender_id
        ).first() # Her iki yöne de bak

        if existing_friendship:
             # Eğer zaten bir arkadaşlık isteği veya arkadaşlık varsa
             raise serializers.ValidationError("Friendship already exists or pending.")


        try:
            # Gönderen ve alıcı UserProfile objelerini bul
            sender = UserProfile.objects.get(supabase_id=sender_id)
            receiver = UserProfile.objects.get(supabase_id=receiver_id)

            # Serializerı kaydet, sender ve receiver alanlarını belirle
            # Burada ayrıca 'status' gibi alanları da set edebilirsiniz (örn: status='pending')
            serializer.save(sender=sender, receiver=receiver)

        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("Sender or receiver user profile not found.")
        except Exception as e:
            raise serializers.ValidationError(f"Error creating friendship: {e}")


# Öneri Listeleme (Oluşturma AI tarafından yapılacağı varsayılabilir veya admin)
# Oluşturma endpoint'ini sadece göstermek için ekliyorum, gerçek senaryoda farklı olabilir.
class RecommendationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Recommendation ve UserProfile modellerini dinamik olarak yükle
        Recommendation = get_profiles_model('Recommendation')
        UserProfile = get_profiles_model('UserProfile')

        user_id = self.request.user.id # request.user.id zaten UUID olmalı

        # Sadece kimliği doğrulanmış kullanıcıya ait önerileri listele
        return Recommendation.objects.filter(user__supabase_id=user_id).order_by('-created_at')

    def get_serializer_class(self):
        # RecommendationSerializer'ı import et
        from .serializers import RecommendationSerializer
        return RecommendationSerializer

    # perform_create metodu: Eğer öneri oluşturmayı API üzerinden yapacaksanız (örn: admin paneli veya özel bir AI tetikleyici)
    # Normal bir kullanıcı burayı kullanmayabilir.
    def perform_create(self, serializer):
         # Recommendation, Post ve UserProfile modellerini dinamik yükle
         Recommendation = get_profiles_model('Recommendation')
         Post = get_profiles_model('Post')
         UserProfile = get_profiles_model('UserProfile')

         # API isteğinden kullanıcı ve önerilen post ID'lerini al (AI veya admin tarafından gönderildiği varsayılır)
         user_id_str = self.request.data.get('user_id') # Kime öneri yapılacağı
         recommended_post_id = self.request.data.get('recommended_post_id') # Önerilen post

         if not user_id_str or not recommended_post_id:
             raise serializers.ValidationError("User ID and Recommended Post ID are required.")

         try:
             user_id = uuid.UUID(user_id_str) # User ID stringini UUID'ye çevir
         except ValueError:
             raise serializers.ValidationError("Invalid user ID format.")


         try:
             # İlgili UserProfile ve Post objelerini bul
             user_profile = UserProfile.objects.get(supabase_id=user_id)
             recommended_post = Post.objects.get(id=recommended_post_id)

             # Serializerı kaydet, user ve recommended_post alanlarını belirle
             serializer.save(user=user_profile, recommended_post=recommended_post)

         except (UserProfile.DoesNotExist, Post.DoesNotExist):
             raise serializers.ValidationError("User profile or recommended post not found.")
         except Exception as e:
              raise serializers.ValidationError(f"Error creating recommendation: {e}")


# Kullanıcı Yolculukları (User Journey) Listeleme (Oluşturma backend tarafından yapılabilir)
# Genellikle bu veriler backend'de otomatik olarak (middleware, sinyaller vb.) toplanır.
# Burada sadece listeleme view'ini gösteriyorum.
class UserJourneyListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # UserJourney ve UserProfile modellerini dinamik olarak yükle
        UserJourney = get_profiles_model('UserJourney')
        UserProfile = get_profiles_model('UserProfile')

        user_id = self.request.user.id # request.user.id zaten UUID olmalı

        # Sadece kimliği doğrulanmış kullanıcıya ait yolculuk kayıtlarını listele
        return UserJourney.objects.filter(user__supabase_id=user_id).order_by('-timestamp')

    def get_serializer_class(self):
        # UserJourneySerializer'ı import et
        from .serializers import UserJourneySerializer
        return UserJourneySerializer

    # perform_create metodu: Eğer User Journey kayıtlarını API üzerinden alıyorsanız (daha az yaygın)
    # Genellikle bu kayıtlar backend'de otomatik olarak oluşturulur.
    def perform_create(self, serializer):
         # UserJourney ve UserProfile modellerini dinamik olarak yükle
         UserJourney = get_profiles_model('UserJourney')
         UserProfile = get_profiles_model('UserProfile')

         user_id = self.request.user.id # request.user.id zaten UUID olmalı

         try:
             # Kullanıcının UserProfile objesini bul
             user_profile = UserProfile.objects.get(supabase_id=user_id)

             # Serializerı kaydet, user alanını belirle
             # timestamp alanı auto_now_add=True ise otomatik set edilir
             serializer.save(user=user_profile)
         except UserProfile.DoesNotExist:
             raise serializers.ValidationError("User profile not found.")
         except Exception as e:
             raise serializers.ValidationError(f"Error creating user journey entry: {e}")
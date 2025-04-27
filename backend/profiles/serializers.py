# backend/profiles/serializers.py

from rest_framework import serializers
from rest_framework.exceptions import ValidationError  # Ensure ValidationError is imported
from .models import UserProfile, Post, Interaction, Message, Friendship, Recommendation, UserJourney
from django.apps import apps # Modelleri dinamik yüklemek için (bazı view'lerde kullanıldığı için burada dursun)


class UserProfileSerializer(serializers.ModelSerializer):
    # id alanı Supabase UUID'den gelir ve frontend'de item.id olarak kullanılabilir.
    # Django'daki primary key'in supabase_id olduğunu belirtmek için meta içinde mapping yapabiliriz
    # veya sadece supabase_id alanını kullanırız. Frontend'de item.supabase_id olarak kullanıyoruz.
    # Bu serializer sadece UserProfile modelini serialize eder, Django'daki id'yi kullanmaz.
    # Ancak frontend'de item.id yerine item.supabase_id kullanmaya başladık, bu yüzden bu serializer direkt kullanilabilir.

    class Meta:
        model = UserProfile
        fields = '__all__' # Tüm alanları dahil et
        # Supabase ID'nin API ile güncellenmemesini sağlar, sadece backend set edebilir veya okunabilir
        read_only_fields = ('supabase_id',)


class PostSerializer(serializers.ModelSerializer):
    # Yazarın (author) nickname'ini ve avatar_url'sini getirmek için source kullanıyoruz
    author_nickname = serializers.CharField(source='author.nickname', read_only=True)  # Yazarın nickname'i
    author_avatar_url = serializers.URLField(source='author.avatar_url', read_only=True)  # Yazarın avatar URL'si

    class Meta:
        model = Post
        fields = [
            'id',
            'author',  # Yazarın ID'si (ForeignKey alanı)
            'author_nickname',  # Yazarın nickname'i
            'author_avatar_url',  # Yazarın avatar URL'si
            'content',  # Gönderi içeriği
            'created_at',  # Oluşturulma tarihi
        ]
        read_only_fields = [
            'id',
            'author',  # Author perform_create ile atanır
            'author_nickname',
            'author_avatar_url',
            'created_at',
        ]
        extra_kwargs = {
            'content': {'required': True},  # Gönderi içeriği zorunlu
        }


class InteractionSerializer(serializers.ModelSerializer):
    # Etkileşimi yapan kişinin nickname'i
    user_nickname = serializers.CharField(source='user.nickname', read_only=True)
    # Etkileşimi yapan kişinin ID'si (UserProfile'ın supabase_id'si)
    # user_id = serializers.UUIDField(source='user.supabase_id', read_only=True) # İsteğe bağlı


    class Meta:
        model = Interaction
        fields = '__all__'
        # Kullanıcı (ForeignKey objesi) ve tarih backend'de belirlenir, inputta olmamalı
        read_only_fields = ('user', 'created_at')


class MessageSerializer(serializers.ModelSerializer):
    sender_nickname = serializers.CharField(source='sender.nickname', read_only=True)
    receiver_nickname = serializers.CharField(source='receiver.nickname', read_only=True)

    class Meta:
        model = Message
        fields = '__all__'
        # Gönderen, alıcı (ForeignKey objeleri) ve tarih backend'de belirlenir
        read_only_fields = ('sender', 'receiver', 'created_at')


# FriendshipsSerializer - TEK VE DOĞRU TANIM
class FriendshipSerializer(serializers.ModelSerializer):
    # Gönderen ve alıcı kullanıcının nickname'lerini ekleyelim (UserProfile'dan)
    sender_nickname = serializers.CharField(source='sender.nickname', read_only=True)
    receiver_nickname = serializers.CharField(source='receiver.nickname', read_only=True)

    # receiver alanını input için read_only yapıyoruz çünkü View'ın perform_create metodu bu alanı elle set ediyor.
    # DRF varsayılan olarak ForeignKey alanlarını inputta bekler, bunu engellemek için read_only=True yapıyoruz.
    # Ancak alan yine de 'fields' listesinde olduğu için outputta gösterilecektir (UserProfile objesinin primary key'i olarak).
    receiver = serializers.PrimaryKeyRelatedField(read_only=True)


    class Meta:
        model = Friendship
        # Serializerın outputta göstermesi gereken tüm alanlar
        fields = ['id', 'sender', 'receiver', 'sender_nickname', 'receiver_nickname', 'status', 'created_at', 'updated_at']
        # Backend tarafından otomatik set edilen veya inputta beklenmeyen alanlar
        # sender, created_at, updated_at backend tarafından set edilir.
        read_only_fields = ['id', 'sender', 'created_at', 'updated_at']

    # View'ın perform_create metodu receiver objesini elle geçtiği için,
    # serializer'ın default create metodunun receiver'ı input data'dan bulmasına gerek kalmaz.
    # Bu yüzden burada custom bir create metoduna ihtiyaç duymuyoruz.


class RecommendationSerializer(serializers.ModelSerializer):
    # Önerilen gönderinin başlığını ve ID'sini ekleyelim
    recommended_post_title = serializers.CharField(source='recommended_post.title', read_only=True)
    # recommended_post_id = serializers.IntegerField(source='recommended_post.id', read_only=True)  # Ensure correct field type

    class Meta:
        model = Recommendation
        fields = '__all__'
        # Kullanıcı (ForeignKey objesi), önerilen gönderi (ForeignKey objesi) ve tarih backend'de belirlenir
        read_only_fields = ('user', 'recommended_post', 'created_at')  # Ensure fields exist in the model


class UserJourneySerializer(serializers.ModelSerializer):
    # Kullanıcının nickname'ini ekleyelim
    user_nickname = serializers.CharField(source='user.nickname', read_only=True)
    # user_id = serializers.UUIDField(source='user.supabase_id', read_only=True)  # Ensure correct field type

    class Meta:
        model = UserJourney
        fields = '__all__'
        # Kullanıcı (ForeignKey objesi) ve zaman damgası backend'de belirlenir
        read_only_fields = ('user', 'timestamp')  # Ensure fields exist in the model


# Arkadaş Listesi için Kullanıcı Profili Serializer'ı (Temel Bilgiler)
class FriendSerializer(serializers.ModelSerializer):
    # Supabase UUID'sini 'id' olarak döndürelim (frontend'de item.id kullanmak için)
    id = serializers.UUIDField(source='supabase_id', read_only=True)

    class Meta:
        model = UserProfile
        # Arkadaş listesinde göstermek istediğiniz alanları seçin
        fields = ['id', 'nickname', 'avatar_url']
        # Eğer başka alanlar da göstermek isterseniz buraya ekleyin
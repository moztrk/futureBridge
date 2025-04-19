# backend/profiles/models.py

from django.db import models
import uuid

# Ana kullanıcı modeli - Supabase UUID'sine bağlanacak
class UserProfile(models.Model):
    # Supabase auth.users tablosundaki UUID'ye karşılık gelir ve primary key'imiz olacak
    supabase_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Buraya projeniz için gerekli diğer profil alanlarını ekleyin
    email = models.EmailField(unique=True, null=True, blank=True) # Opsiyonel
    nickname = models.CharField(max_length=100, null=True, blank=True)
    avatar_url = models.URLField(null=True, blank=True)
    profession = models.CharField(max_length=100, null=True, blank=True)
    goals = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True) # Opsiyonel
    updated_at = models.DateTimeField(auto_now=True) # Opsiyonel

    # --- DRF/Django İzin Sistemleri İçin Gerekli Property ve Metodlar ---
    # Bu property'ler, UserProfile objesinin kimliği doğrulanmış bir kullanıcı gibi davranmasını sağlar
    @property
    def is_authenticated(self):
        """
        Bu UserProfile objesi, başarılı bir kimlik doğrulama sonucunda
        request.user olarak atanmıştır, dolayısıyla True döndürür.
        """
        return True

    @property
    def is_anonymous(self):
        """
        Kimliği doğrulanmış bir kullanıcı anonymous olamaz.
        """
        return False

    # İsteğe bağlı: İzin kontrol metodları (IsAuthenticated için genellikle gerekli değiller ama emin olmak için ekleyebiliriz)
    # def has_perm(self, perm, obj=None):
    #     "Kullanıcının belirli bir izni var mı?"
    #     # Basitçe: Kimliği doğrulanmış kullanıcılar için her zaman True diyelim
    #     return True
    #
    # def has_module_perms(self, app_label):
    #     "Kullanıcının 'app_label' uygulamasına erişim izni var mı?"
    #     # Basitçe: Kimliği doğrulanmış kullanıcılar için her zaman True diyelim
    #     return True
    # -------------------------------------------------------------------


    def __str__(self):
        # nickname varsa onu döndür, yoksa Supabase ID'yi döndür
        return self.nickname or str(self.supabase_id)

    # --- Diğer Modeller Buradan Sonra Gelir (Post, Message, vb.) ---
    # (Bu modelleri az önceki düzeltme işleminden sonraki halleriyle koruyun)


class Post(models.Model):
    # Gönderi sahibi - UserProfile modeline Foreign Key
    author = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    media_url = models.URLField(null=True, blank=True) # URLField kullanmak daha doğru olabilir
    visibility = models.CharField(max_length=50, choices=[('public', 'Public'), ('private', 'Private')], default='public')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post by {self.author.nickname or self.author.supabase_id} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class Message(models.Model):
    # Mesaj gönderen ve alan - UserProfile modeline Foreign Key
    sender = models.ForeignKey(UserProfile, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(UserProfile, related_name='received_messages', on_delete=models.CASCADE)
    message_text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.nickname or self.sender.supabase_id} to {self.receiver.nickname or self.receiver.supabase_id}"

class Friendship(models.Model):
    # Arkadaşlık gönderen ve alan - UserProfile modeline Foreign Key
    sender = models.ForeignKey(UserProfile, related_name='sent_friendships', on_delete=models.CASCADE)
    receiver = models.ForeignKey(UserProfile, related_name='received_friendships', on_delete=models.CASCADE)
    status = models.CharField(max_length=50, choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Friendship between {self.sender.nickname or self.sender.supabase_id} and {self.receiver.nickname or self.receiver.supabase_id} ({self.status})"

class Recommendation(models.Model):
    # Öneri yapılan kullanıcı - UserProfile modeline Foreign Key
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='recommendations') # related_name ekleyelim
    recommended_post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='recommended_in') # related_name ekleyelim
    reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recommendation for {self.user.nickname or self.user.supabase_id} on Post {self.recommended_post.id}"

class Interaction(models.Model):
    # Etkileşim yapılan post ve yapan kullanıcı - Foreign Key
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='post_interactions') # related_name değiştirelim
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='user_interactions') # related_name değiştirelim
    type = models.CharField(max_length=50, choices=[('like', 'Like'), ('comment', 'Comment')])
    comment_text = models.TextField(null=True, blank=True) # Sadece yorum türü için kullanılır
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.nickname or self.user.supabase_id} {self.type} on post {self.post.id}"

class UserJourney(models.Model):
    # Kullanıcının yolculuk kaydı - UserProfile modeline Foreign Key
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='journey_events') # related_name ekleyelim
    event_type = models.CharField(max_length=50)
    event_data = models.JSONField(null=True, blank=True) # JSONField kullanmak data için iyi
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Journey event '{self.event_type}' for {self.user.nickname or self.user.supabase_id} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
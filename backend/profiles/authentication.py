# backend/profiles/authentication.py

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
import uuid
from django.apps import apps # Django uygulamalarını dinamik yüklemek için import edildi
# from .models import UserProfile # ARTIK BU SATIRA GEREK YOK, SİLDİK!


# Supabase kullanıcısını temsil edecek basit bir nesne (veya model nesnesi)
# DRF'in request.user'a atayacağı nesnedir.
class SupabaseAuthenticatedUser:
    def __init__(self, supabase_id, email=None, **extra_data):
        # Supabase ID'nin UUID formatında olduğunu doğrula ve sakla
        if not isinstance(supabase_id, uuid.UUID):
             try:
                 self.id = uuid.UUID(supabase_id)
             except ValueError:
                  raise AuthenticationFailed('Invalid Supabase user ID format')
        else:
             self.id = supabase_id # Zaten UUID ise doğrudan kullan

        self.email = email
        self.is_authenticated = True # DRF'in kimlik doğrulaması yapılmış kullanıcıları tanıması için gerekli
        self.extra_data = extra_data # Token payloadındaki diğer veriler (rol, vs.)

    def __str__(self):
        return str(self.id) # Kullanıcıyı Supabase ID'si ile temsil et

    # DRF'in izin sistemleriyle uyumluluk için temel metodlar (opsiyonel olarak eklenebilir)
    # Gerçek izin kontrolü için kendi mantığınızı yazmanız gerekebilir.
    # def has_perm(self, perm, obj=None): return True
    # def has_module_perms(self, app_label): return True
    # def get_group_permissions(self, obj=None): return set()
    # def get_all_permissions(self, obj=None): return set()
    # @property
    # def is_staff(self): return False
    # @property
    # def is_superuser(self): return False


class SupabaseJWTAuthentication(BaseAuthentication):
    def authenticate(self, request: Request):
        # Authorization başlığını kontrol et
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            # Başlık yoksa kimlik doğrulama girişimi yok sayılır
            return None

        # 'Bearer <token>' formatını ayrıştır
        parts = auth_header.split()

        if parts[0].lower() != 'bearer':
            raise AuthenticationFailed('Authorization header must start with "Bearer"')
        elif len(parts) == 1:
            raise AuthenticationFailed('Token not found')
        elif len(parts) > 2:
            raise AuthenticationFailed('Authorization header must be "Bearer <token>"')

        token = parts[1] # Token değerini al

        try:
            # JWT tokenını doğrula ve payload'u çöz
            # settings.SUPABASE_JWT_SECRET, ALGORITHMS ve AUDIENCE ayarlarınızın
            # Supabase projenizin API ayarlarına tam olarak uyduğundan emin olun!
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"], # Supabase'in kullandığı algoritmayı kontrol edin!
                audience=settings.SUPABASE_AUDIENCE, # Supabase audience'ı kontrol edin!
            )

            # Payload'dan Supabase kullanıcı ID'sini (sub claim) ve varsa email'i al
            supabase_user_id_str = payload.get('sub')
            user_email = payload.get('email')

            if not supabase_user_id_str:
                raise AuthenticationFailed('User ID ("sub" claim) not found in token payload')

            # Supabase ID stringini UUID objesine çevir
            try:
                 supabase_user_id = uuid.UUID(supabase_user_id_str)
            except ValueError:
                 raise AuthenticationFailed('Invalid user ID format in token')

            # *** DÜZELTME BAŞLANGICI ***
            # UserProfile modelini dinamik olarak yükle.
            # Bu satır, tüm Django modelleri yüklendikten sonra çalışacaktır.
            try:
                UserProfile = apps.get_model('profiles', 'UserProfile')
            except LookupError:
                # 'profiles' uygulamasını veya 'UserProfile' modelini bulamazsa hata
                raise AuthenticationFailed('UserProfile model not found. Make sure "profiles" app is in INSTALLED_APPS and models are defined.')
            # *** DÜZELTME SONU ***


            # Supabase ID'sini kullanarak kendi UserProfile model nesnemizi veritabanından çek
            try:
                user_profile = UserProfile.objects.get(supabase_id=supabase_user_id)
                # Kimlik doğrulama başarılı: DRF request.user'a UserProfile nesnesini ata
                # (user, auth) tuple döndürülür
                return (user_profile, token)
            except UserProfile.DoesNotExist:
                 # Eğer Supabase'de kullanıcı var (token geçerli) ama bizim veritabanımızda
                 # bu UUID'ye sahip bir UserProfile objesi yoksa.
                 # Bu senaryoda genellikle otomatik olarak yeni bir UserProfile oluşturulur.
                 # print(f"UserProfile bulunamadı ({supabase_user_id}), otomatik oluşturuluyor.") # Debug çıktısı
                 try:
                     new_profile = UserProfile.objects.create(supabase_id=supabase_user_id)
                     # Yeni oluşturulan UserProfile nesnesini döndür
                     return (new_profile, token)
                 except Exception as create_error:
                      # Profil oluştururken bir hata olursa (DB bağlantısı sorunu vb.)
                      raise AuthenticationFailed(f'Failed to create user profile: {create_error}')

            # Alternatif senaryo: Eğer UserProfile modelini kullanmak istemiyorsanız
            # Sadece Supabase ID'sini içeren basit bir nesne döndürebilirsiniz:
            # user = SupabaseAuthenticatedUser(
            #      supabase_id=supabase_user_id,
            #      email=user_email,
            #      # payload'daki diğer verileri aktarabilirsiniz
            # )
            # return (user, token)


        except jwt.ExpiredSignatureError:
            # Token süresi dolmuş
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidAudienceError:
             # Token'ın audience claim'i settings'teki SUPABASE_AUDIENCE ile eşleşmiyor
             raise AuthenticationFailed('Invalid token audience')
        except jwt.InvalidAlgorithmError:
             # Token'ın algoritması settings'teki algoritma ile eşleşmiyor
             raise AuthenticationFailed('Invalid token algorithm')
        except jwt.InvalidTokenError:
            # Diğer genel token doğrulama hataları
            raise AuthenticationFailed('Invalid token')
        except Exception as e:
            # Beklenmeyen diğer hatalar (örn: veritabanı hatası UserProfile çekerken)
            # Loglama burada iyi bir fikir olabilir
            raise AuthenticationFailed(f'An error occurred during authentication: {e}')

    # DRF'in 401 yanıtına ekleyeceği WWW-Authenticate başlığını belirler
    # Genellikle 'Bearer' kullanılır.
    def authenticate_header(self, request):
       return 'Bearer'
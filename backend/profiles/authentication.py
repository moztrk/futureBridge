# backend/profiles/authentication.py

import jwt
import logging
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
import uuid
from django.apps import apps

class SupabaseAuthenticatedUser:
    def __init__(self, supabase_id, email=None, **extra_data):
        if not isinstance(supabase_id, uuid.UUID):
            try:
                self.id = uuid.UUID(supabase_id)
            except ValueError:
                raise AuthenticationFailed('Invalid Supabase user ID format')
        else:
            self.id = supabase_id
        self.email = email
        self.is_authenticated = True
        self.extra_data = extra_data

    def __str__(self):
        return str(self.id)

# Logger oluştur
logger = logging.getLogger(__name__)

class SupabaseJWTAuthentication(BaseAuthentication):
    def authenticate(self, request: Request):
        auth_header = request.headers.get('Authorization')
        logger.info(f"Gelen istek için Authorization başlığı: {auth_header}")

        if not auth_header:
            logger.info("Authorization başlığı bulunamadı. Kimlik doğrulama atlandı.")
            return None

        parts = auth_header.split()

        if parts[0].lower() != 'bearer':
            logger.warning(f"Authorization başlığı 'Bearer' ile başlamıyor: {parts[0]}")
            raise AuthenticationFailed('Authorization header must start with "Bearer"')
        elif len(parts) == 1:
            logger.warning("Authorization başlığında token bulunamadı.")
            raise AuthenticationFailed('Token not found')
        elif len(parts) > 2:
            logger.warning("Authorization başlığı formatı yanlış.")
            raise AuthenticationFailed('Authorization header must be "Bearer <token>"')

        token = parts[1]
        logger.info(f"Authorization başlığından çıkarılan Token: {token[:10]}...{token[-10:]}")

        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience=settings.SUPABASE_AUDIENCE,
            )
            logger.info(f"JWT Token başarıyla çözüldü. Payload: {payload}")

            supabase_user_id_str = payload.get('sub')
            user_email = payload.get('email')

            if not supabase_user_id_str:
                logger.warning("Token payloadında 'sub' claim (User ID) bulunamadı.")
                raise AuthenticationFailed('User ID ("sub" claim) not found in token payload')

            try:
                supabase_user_id = uuid.UUID(supabase_user_id_str)
                logger.info(f"Token'dan alınan Supabase User ID (UUID): {supabase_user_id}")
            except ValueError:
                logger.warning(f"Token'daki User ID formatı geçersiz: {supabase_user_id_str}")
                raise AuthenticationFailed('Invalid user ID format in token')

            try:
                UserProfile = apps.get_model('profiles', 'UserProfile')
            except LookupError:
                logger.error("UserProfile modeli bulunamadı.")
                raise AuthenticationFailed('UserProfile model not found. Make sure "profiles" app is in INSTALLED_APPS and models are defined.')

            try:
                logger.info(f"UserProfile aranıyor: supabase_id={supabase_user_id}")
                user_profile = UserProfile.objects.get(supabase_id=supabase_user_id)
                logger.info(f"UserProfile başarıyla bulundu: {user_profile.supabase_id}")
                return (user_profile, token)
            except UserProfile.DoesNotExist:
                logger.warning(f"UserProfile bulunamadı ({supabase_user_id}), otomatik oluşturuluyor.")
                try:
                    new_profile = UserProfile.objects.create(supabase_id=supabase_user_id)
                    logger.info(f"Yeni UserProfile başarıyla oluşturuldu: {new_profile.supabase_id}")
                    return (new_profile, token)
                except Exception as create_error:
                    logger.error(f"UserProfile oluşturulurken hata: {create_error}", exc_info=True)
                    raise AuthenticationFailed(f'Failed to create user profile: {create_error}')

        except jwt.ExpiredSignatureError:
            logger.warning("JWT Token süresi dolmuş.")
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidAudienceError:
            logger.warning(f"JWT Token Audience geçersiz. Beklenen: {settings.SUPABASE_AUDIENCE}, Token'daki: {getattr(payload, 'aud', None)}")
            raise AuthenticationFailed('Invalid token audience')
        except jwt.InvalidAlgorithmError:
            try:
                unverified_header = jwt.get_unverified_header(token)
                token_alg = unverified_header.get('alg')
            except Exception:
                token_alg = 'Bilinmiyor'
            logger.warning(f"JWT Token Algoritması geçersiz. Beklenen: HS256, Token'daki: {token_alg}")
            raise AuthenticationFailed('Invalid token algorithm')
        except jwt.InvalidTokenError as e:
            logger.warning(f"JWT Token genel doğrulama hatası: {e}", exc_info=True)
            raise AuthenticationFailed(f'Invalid token: {e}')
        except Exception as e:
            logger.error(f"Kimlik doğrulama sırasında beklenmeyen hata oluştu: {e}", exc_info=True)
            raise AuthenticationFailed(f'An error occurred during authentication: {e}')

    def authenticate_header(self, request):
        return 'Bearer'
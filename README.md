Menture - Sosyal Ağ Platformu / Social Network Platform

🚧 Proje Durumu: Bu proje aktif olarak geliştirilmektedir. Yeni özellikler ve iyileştirmeler sürekli olarak eklenmektedir.
🚧 Project Status: This project is under active development. New features and improvements are being added continuously.

🇹🇷 Türkçe Açıklama
🔍 Proje Hakkında

Menture, kullanıcıların gönderi paylaşabileceği, diğer kullanıcıları arayabileceği, arkadaşlık isteği gönderebileceği ve yapay zekâ destekli mentorluk alabileceği modern bir sosyal ağ platformudur.

🏗️ Genel Mimari

İstemci (Frontend & Mobil): Web arayüzü React ile, mobil uygulama ise React Native + Expo ile geliştirilmiştir. Kullanıcı kimlik doğrulaması Supabase Auth ile yapılır ve alınan JWT token, her istekte backend'e gönderilir.

Backend (Django REST Framework): Güçlü yapısı, yerleşik güvenlik özellikleri ve zengin admin paneli nedeniyle Django tercih edilmiştir. API katmanı Django REST Framework ile oluşturulmuştur. Google Gemini API entegrasyonu ile yapay zekâ destekli öneriler sunulur.

Veritabanı (PostgreSQL + Supabase): Veritabanı olarak güvenilir ve ölçeklenebilir PostgreSQL kullanılır. Supabase, bu veritabanı üzerinde çalışan, kimlik doğrulama ve Row Level Security (RLS) gibi modern özellikler sunan açık kaynaklı bir Backend-as-a-Service (BaaS) çözümüdür.

⚙️ Kullanılan Teknolojiler ve Kütüphaneler
🎨 Frontend (React)
Kütüphane	Açıklama
react	Bileşen tabanlı, modern kullanıcı arayüzleri için.
react-router-dom	Sayfa yönlendirmeleri ve dinamik route yönetimi için.
@supabase/supabase-js	Supabase ile kimlik doğrulama ve veri işlemleri için.
react-icons	Projede tutarlı ve zengin bir ikon seti kullanmak için.
fetch API	Backend ile HTTP üzerinden veri alışverişi için (yerleşik).
📱 Mobil (React Native & Expo)
Kütüphane	Açıklama
react-native	Tek kod tabanıyla iOS ve Android uygulaması geliştirmek için.
expo	Geliştirme sürecini hızlandırmak ve kolaylaştırmak için.
@supabase/supabase-js	Mobilde Supabase ile kimlik doğrulama ve veri işlemleri için.
react-navigation	Uygulama içi sayfa geçişleri ve navigasyon mantığı için.
🔧 Backend (Django)
Kütüphane	Açıklama
django	Güçlü, modüler ve güvenli bir backend framework'ü olduğu için.
djangorestframework	Standartlara uygun ve hızlı API geliştirmeyi sağladığı için.
djangorestframework-simplejwt	JWT token tabanlı kullanıcı doğrulama sistemi için.
psycopg2	Django'nun PostgreSQL veritabanı ile iletişim kurması için.
requests	Harici API'lere (örn: Google Gemini) çağrı yapmak için.
🔐 Veritabanı ve Güvenlik: Supabase & RLS

Supabase Auth, kullanıcı kaydı, girişi ve oturum yönetimini üstlenerek güvenli bir kimlik doğrulama katmanı sağlar.

RLS (Row Level Security), güvenliği doğrudan veritabanı seviyesine taşıyarak uygulama kodunda bir hata olsa bile yetkisiz veri erişimini engeller. Temel politikalarımız:

Bir kullanıcı, yalnızca kendi gönderilerini ve arkadaşlık kayıtlarını düzenleyebilir veya silebilir.

Gönderiler, gizlilik ayarına bağlı olarak (public veya private) ya herkese açık ya da yalnızca sahibine görünür olabilir.

Arkadaşlık istekleri yalnızca isteği gönderen ve alan kullanıcılar tarafından yönetilebilir.

🧠 Neden Bu Teknolojiler?
Teknoloji	Neden Seçildi
React & React Native	Hızlı geliştirme, geniş topluluk desteği ve çapraz platform uyumu.
Django & DRF	Güvenli, olgunlaşmış ve ölçeklenebilir bir backend mimarisi için.
Supabase	Auth, RLS ve gerçek zamanlı yetenekleriyle modern bir BaaS çözümü olduğu için.
PostgreSQL	Güvenilirliği, performansı ve RLS gibi ileri seviye özellikleri için.
Google Gemini API	Projeye yenilikçi ve akıllı bir özellik katmak için.
🇬🇧 English Explanation
🔍 About the Project

Menture is a modern social networking platform where users can share posts, search for other users, send friend requests, and receive AI-powered mentorship.

🏗️ General Architecture

Client (Frontend & Mobile): The web interface is developed with React, while the mobile app is built with React Native + Expo. User authentication is handled by Supabase Auth, and the resulting JWT token is sent to the backend with every request.

Backend (Django REST Framework): Django was chosen for its robust structure, built-in security features, and rich admin panel. The API layer is created with Django REST Framework. AI-powered suggestions are provided through Google Gemini API integration.

Database (PostgreSQL + Supabase): The project uses the reliable and scalable PostgreSQL as its database. Supabase is an open-source Backend-as-a-Service (BaaS) solution that runs on top of this database, offering modern features like authentication and Row Level Security (RLS).

⚙️ Technologies and Libraries Used
🎨 Frontend (React)
Library	Description
react	For building component-based, modern user interfaces.
react-router-dom	For page routing and dynamic route management.
@supabase/supabase-js	For authentication and data operations with Supabase.
react-icons	For using a consistent and rich set of icons in the project.
fetch API	For exchanging data with the backend via HTTP (built-in).
📱 Mobile (React Native & Expo)
Library	Description
react-native	For developing iOS and Android apps from a single codebase.
expo	To accelerate and simplify the development process.
@supabase/supabase-js	For mobile authentication and data operations with Supabase.
react-navigation	For in-app screen transitions and navigation logic.
🔧 Backend (Django)
Library	Description
django	For being a powerful, modular, and secure backend framework.
djangorestframework	For enabling rapid and standard-compliant API development.
djangorestframework-simplejwt	For the JWT token-based user authentication system.
psycopg2	To allow Django to communicate with the PostgreSQL database.
requests	To make calls to external APIs (e.g., Google Gemini).
🔐 Database & Security: Supabase & RLS

Supabase Auth provides a secure authentication layer by handling user registration, login, and session management.

RLS (Row Level Security) moves security directly to the database level, preventing unauthorized data access even if there is a bug in the application code. Our core policies:

A user can only edit or delete their own posts and friendship records.

Posts can be visible to everyone or only to the owner, depending on the privacy setting (public or private).

Friend requests can only be managed by the users involved (sender and receiver).

🧠 Why These Technologies?
Technology	Reason for Choosing
React & React Native	Fast development, large community support, and cross-platform compatibility.
Django & DRF	For a secure, mature, and scalable backend architecture.
Supabase	As a modern BaaS solution with Auth, RLS, and real-time capabilities.
PostgreSQL	For its reliability, performance, and advanced features like RLS.
Google Gemini API	To add an innovative and intelligent feature to the project.

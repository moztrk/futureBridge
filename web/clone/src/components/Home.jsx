import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

import PostItem from "../components/PostItem"; // <-- PostItem componentini import et (Bunun koduna sahip olduğunuzu varsayıyorum)
import "./Home.css"; // Home sayfası stilleri

// -- Backend API URL'niz --
const API_BASE_URL = 'http://192.168.182.27:8000/api';

const Home = () => {
  // -- State Değişkenleri --
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Profil bilgilerini (avatar vb.) tutmak için
  const [userToken, setUserToken] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isCreatePostExpanded, setIsCreatePostExpanded] = useState(false); // Gönderi alanı açık mı?

  const textareaRef = useRef(null); // Textarea'ya focus olmak için

  // -- Kullanıcı ve Profil Bilgilerini Alma --
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const currentUserId = sessionData.session.user.id;
        const currentToken = sessionData.session.access_token;
        setUserId(currentUserId);
        setUserToken(currentToken);
        console.log("Home user ID:", currentUserId);

        // Kullanıcı ID'si ve Token ile profil bilgilerini çek
        if (currentUserId && currentToken) {
          try {
            const profileResponse = await fetch(`${API_BASE_URL}/profile/me/`, { // <-- Kendi profil endpoint'iniz
              headers: {
                'Authorization': `Bearer ${currentToken}`,
              },
            });
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              setUserProfile(profileData); // Profil state'ini güncelle
              console.log("User profile fetched:", profileData);
            } else {
               console.error("Profil bilgisi alınamadı:", profileResponse.status);
               // Profil yoksa veya hata varsa varsayılan bir durum ayarlanabilir
               setUserProfile(null);
            }
          } catch (profileError) {
            console.error("Profil fetch hatası:", profileError);
            setUserProfile(null);
          }
        } else {
            setUserProfile(null); // Token veya ID yoksa profili sıfırla
        }

      } else {
        console.error("Oturum alınamadı:", sessionError);
        setError("Oturum bilgileri yüklenemedi.");
        setUserId(null);
        setUserToken(null);
        setUserProfile(null);
      }
    };
    fetchUserAndProfile();

    // Auth state değişikliğini dinle
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUserId = session?.user?.id || null;
      const currentToken = session?.access_token || null;
      setUserId(currentUserId);
      setUserToken(currentToken);

      if (currentUserId && currentToken) {
         // Profil bilgisini tekrar çek veya güncelle
         // (Yukarıdaki fetchUserAndProfile içindeki profil çekme mantığı tekrar kullanılabilir)
         try {
            const profileResponse = await fetch(`${API_BASE_URL}/profile/me/`, {
              headers: { 'Authorization': `Bearer ${currentToken}` },
            });
            if (profileResponse.ok) setUserProfile(await profileResponse.json());
            else setUserProfile(null);
         } catch { setUserProfile(null); }
      } else {
        setUserProfile(null);
        setPosts([]);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // -- Gönderileri Çekme --
  const fetchPosts = useCallback(async () => {
    if (!userToken || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/posts/`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });
      if (!response.ok) {
        // Hata yönetimi (önceki kodunuzdaki gibi)
        throw new Error(`Gönderiler yüklenemedi (HTTP ${response.status})`);
      }
      const responseData = await response.json();
      const sortedPosts = Array.isArray(responseData)
        ? responseData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        : [];
      setPosts(sortedPosts);
    } catch (err) {
      console.error("Gönderi fetch hatası:", err);
      setError(err.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userToken]); // loading state'ini dependency'den çıkar

  useEffect(() => {
    if (userToken) {
      fetchPosts();
    } else {
      setPosts([]);
      setLoading(false); // Token yoksa loading false olmalı
    }
  }, [userToken, fetchPosts]);

  // -- Yeni Gönderi Paylaşma --
  const handlePostSubmit = async () => {
    if (!newPostContent.trim() || isPosting) return;
    if (!userToken) {
      alert("Paylaşım için giriş yapmalısınız."); // Use browser alert
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/posts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ content: newPostContent }),
      });

      if (!response.ok) {
        throw new Error(`Paylaşım başarısız (HTTP ${response.status})`);
      }

      const newPost = await response.json();
      const postWithOwnerData = {
        ...newPost,
        author_nickname: userProfile?.nickname || 'Siz',
        author_avatar_url: userProfile?.avatar_url,
      };

      setPosts(currentPosts => [postWithOwnerData, ...currentPosts]);
      setNewPostContent('');
      setIsCreatePostExpanded(false);
    } catch (err) {
      console.error("Paylaşım hatası:", err);
      alert(`Hata: ${err.message}`); // Use browser alert
    } finally {
      setIsPosting(false);
    }
  };

  // Tıklanınca gönderi alanını aç ve textarea'ya focus ol
  const handleExpandCreatePost = () => {
      setIsCreatePostExpanded(true);
      // Kısa bir gecikmeyle focus yap, eleman DOM'a eklendikten sonra çalışsın
      setTimeout(() => {
          textareaRef.current?.focus();
      }, 50);
  };

  // Kullanıcı profil resmi veya varsayılan avatar URL'si
  const userAvatar = userProfile?.avatar_url || 'https://via.placeholder.com/48/cccccc/FFFFFF?text=?';

  return (
    <>
      {/* Header Bar */}
      <header className="header-bar">
        <div className="header-content">
          <div className="header-left">
            {/* Logo veya Site Adı */}
            <Link to="/home" className="header-logo">Future</Link> {/* Anasayfaya yönlendirsin */}
            {/* Arama Çubuğu (Gerekirse Eklenebilir) */}
            {/* <input type="text" placeholder="Ara..." className="header-search" /> */}
          </div>
          <nav className="header-nav">
            {/* Anasayfa (Feed) Linki */}
            <Link className="header-link" to="/home"> {/* Feed sayfası için /home route'u */}
              <i className="fas fa-home"></i> {/* FontAwesome ikonu örneği */}
              <span>Anasayfa</span>
            </Link>

            {/* Mesajlar Linki */}
            <Link className="header-link" to="/messages"> {/* App.jsx'te tanımladığımız route */}
              <i className="fas fa-envelope"></i> {/* Mesaj ikonu */}
              <span>Mesajlar</span>
            </Link>

            {/* Bildirimler Linki */}
            <Link className="header-link" to="/notifications"> {/* App.jsx'te tanımladığımız route */}
              <i className="fas fa-bell"></i> {/* Bildirim ikonu */}
              <span>Bildirimler</span>
            </Link>

            {/* Profil Linki */}
            <Link className="header-link" to={`/profile/${userId}`}> {/* userId kullanarak dinamik link */}
              <i className="fas fa-user"></i> {/* Profil ikonu */}
              <span>Profil</span>
            </Link>

            {/* AI Mentorship Linki */}
            <Link className="header-link" to="/mentorship"> {/* AI Mentorship sayfasına yönlendirme */}
              <i className="fas fa-brain"></i> {/* AI Mentorship ikonu */}
              <span>AI Mentorship</span>
            </Link>

            {/* Çıkış Yap Butonu */}
            <button
              className="header-link logout-button"
              onClick={async () => {
                await supabase.auth.signOut(); // Kullanıcıyı çıkış yap
                window.location.reload(); // Sayfayı yenile
              }}
            >
              <i className="fas fa-sign-out-alt"></i> {/* Çıkış ikonu */}
              <span>Çıkış Yap</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="content-container">
        {/* İsteğe Bağlı Sol Panel */}
        {/* <aside className="left-panel">...</aside> */}

        {/* Feed Alanı */}
        <section className="feed-container">

          {/* Yeni Gönderi Oluşturma Kutusu */}
          {userProfile && ( // Sadece kullanıcı profili yüklendiğinde göster
            <div className="create-post-box">
              <div className="create-post-input-area">
                <img src={userAvatar} alt="Avatar" className="create-post-avatar" />
                {/* Tıklanabilir Alan */}
                <button className="create-post-input-button" onClick={handleExpandCreatePost}>
                    Bir gönderi başlat
                </button>
              </div>

              {/* Tıklayınca Açılan Alan */}
              {isCreatePostExpanded && (
                  <div className="create-post-expanded">
                    <textarea
                      ref={textareaRef}
                      className="create-post-textarea"
                      placeholder="Ne düşünüyorsun?"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows="4" // Başlangıç satır sayısı
                    />
                    <div className="create-post-actions">
                      {/* Medya Ekleme Butonları (Örnek) */}
                      <div className="create-post-media-buttons">
                         <button title="Fotoğraf ekle">
                              <i className="fas fa-image"></i> {/* FontAwesome ikonu */}
                         </button>
                         <button title="Video ekle">
                              <i className="fas fa-video"></i> {/* FontAwesome ikonu */}
                         </button>
                         {/* Diğer butonlar eklenebilir */}
                      </div>
                      {/* Paylaş Butonu */}
                      <button
                        className="create-post-share-button"
                        onClick={handlePostSubmit}
                        disabled={isPosting || !newPostContent.trim()}
                      >
                        {isPosting ? 'Paylaşılıyor...' : 'Paylaş'}
                      </button>
                    </div>
                  </div>
              )}
            </div>
          )}

          {/* Yüklenme Durumu */}
          {loading && <p className="loading-message">Gönderiler yükleniyor...</p>}

          {/* Hata Durumu */}
          {error && !loading && <p className="error-message">Hata: {error}</p>}

          {/* Gönderi Listesi */}
          {!loading && !error && posts.length > 0 && (
            <div className="posts-list"> {/* Ekstra bir div ile sarmak gerekebilir */}
              {posts.map(post => (
                // PostItem component'inin props olarak post verisini aldığını varsayıyoruz
                <PostItem key={post.id} post={post} currentUserProfile={userProfile}/>
              ))}
            </div>
          )}

          {/* Gönderi Yoksa */}
          {!loading && !error && posts.length === 0 && (
            <p className="no-posts-message">Henüz gönderi bulunmamaktadır.</p>
          )}

        </section>

        {/* İsteğe Bağlı Sağ Panel */}
        {/* <aside className="right-panel">...</aside> */}

      </main>

       {/* Eski FAB ve Modal artık yok */}

    </>
  );
};

export default Home;
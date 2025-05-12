// pages/Home.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
// Routes ve Route componentlerini import edin
import { Link, Routes, Route } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Component importları
import PostItem from "../components/PostItem"; // PostItem componentini import edin
import AIMentorship from "./AIMentorship"; // AIMentorship componentini import edin
import Profile from './Profile'; // Profile.jsx dosyasını import edin

import "./Home.css";

// Backend API URL
const API_BASE_URL = 'http://10.196.191.59:8000/api'; // Kendi backend adresinizle değiştirin

const Home = () => {
  // State variables
  const [userId, setUserId] = useState(null); // Kullanıcının Supabase ID'si (UUID)
  const [userProfile, setUserProfile] = useState(null); // Kullanıcının backend'deki profil objesi
  const [userToken, setUserToken] = useState(null); // Supabase JWT token

  // Feed states
  const [posts, setPosts] = useState([]); // Gönderi listesi
  const [loadingPosts, setLoadingPosts] = useState(true); // Gönderiler yükleniyor mu? (Specific state)
  const [postError, setPostError] = useState(null); // Gönderi yükleme hatası (Specific state)

  // New Post states
  const [newPostContent, setNewPostContent] = useState(''); // Yeni gönderi içeriği
  const [isPosting, setIsPosting] = useState(false); // Gönderi paylaşılıyor mu?
  const [isCreatePostExpanded, setIsCreatePostExpanded] = useState(false); // Gönderi oluşturma alanı genişletildi mi?

  // Header ve UI states
  const [isHeaderFixed, setIsHeaderFixed] = useState(false); // Header sabitlendi mi?
  // Badge sayıları için state'ler (şimdilik manuel, backend'den çekilmeli)
  const [unreadMessages, setUnreadMessages] = useState(0); // <-- Backend'den güncellenmeli
  const [unreadNotifications, setUnreadNotifications] = useState(0); // <-- Backend'den güncellenmeli

  // Search states
  const [searchQuery, setSearchQuery] = useState(''); // Arama çubuğundaki metin
  const [searchResults, setSearchResults] = useState([]); // Arama sonuçları (UserProfile listesi)
  const [isSearching, setIsSearching] = useState(false); // Arama yapılıyor mu? (Specific state)
  const [searchError, setSearchError] = useState(null); // Arama hatası (Specific state)
  const [hasSearched, setHasSearched] = useState(false); // Arama yapıldı ve sonuçlar gösteriliyor mu?


  // Refs
  const textareaRef = useRef(null); // Yeni gönderi textarea ref'i
  const createPostRef = useRef(null); // Yeni gönderi kutusu ref'i
  const headerRef = useRef(null); // Header ref'i

  // --- Fetch User and Profile Data ---
  // Kullanıcı oturumunu ve profilini Supabase'den ve backend'den çeker
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const currentUserId = sessionData.session.user.id;
        const currentToken = sessionData.session.access_token;
        setUserId(currentUserId);
        setUserToken(currentToken); // Token'ı state'e kaydet

        // Token varsa backend'den kullanıcı profilini çek
        if (currentToken) { // Token kontrolü eklendi
          try {
            // Backend'de kendi profilinizi çeken endpoint'in '/api/profile/' olduğunu varsayıyorum
            const profileResponse = await fetch(`${API_BASE_URL}/profile/`, { // <-- Endpoint'i kontrol edin
              headers: {
                'Authorization': `Bearer ${currentToken}`, // Token'ı header'a ekle
              },
            });
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              setUserProfile(profileData); // Profil verisini state'e kaydet
            } else {
              console.error("Profile fetch failed:", profileResponse.status);
              setUserProfile(null);
              // Hata durumunda kullanıcıyı bilgilendir veya giriş sayfasına yönlendir
              // navigate('/login'); // React Router hook'u kullanılıyorsa
            }
          } catch (profileError) {
            console.error("Profile fetch error:", profileError);
            setUserProfile(null);
            // Hata durumunda kullanıcıyı bilgilendir veya giriş sayfasına yönlendir
            // alert("Profil bilgileri yüklenirken bir hata oluştu.");
            // navigate('/login'); // React Router hook'u kullanılıyorsa
          }
        } else {
          // Token yoksa profili temizle
          setUserProfile(null);
        }

      } else {
        console.error("Session retrieval failed:", sessionError);
        // Oturum bilgisi yoksa state'leri temizle
        // setError("Session information could not be loaded."); // Belki bir giriş uyarısı gösterilebilir
        setUserId(null);
        setUserToken(null);
        setUserProfile(null);
        setPosts([]); // Kullanıcı çıkış yapınca gönderileri temizle
        // İsteğe bağlı: Kullanıcıyı giriş sayfasına yönlendir
        // navigate('/login'); // React Router hook'u kullanılıyorsa
      }
    };
    fetchUserAndProfile();

    // Auth state değişikliklerini dinle (login, logout gibi)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUserId = session?.user?.id || null;
      const currentToken = session?.access_token || null;
      setUserId(currentUserId);
      setUserToken(currentToken); // Token state'ini güncelle

      // Eğer yeni bir oturum varsa profil bilgisini tekrar çek
      if (currentUserId && currentToken) {
        try {
          const profileResponse = await fetch(`${API_BASE_URL}/profile/`, { // <-- Endpoint'i kontrol edin
            headers: { 'Authorization': `Bearer ${currentToken}` },
          });
          if (profileResponse.ok) setUserProfile(await profileResponse.json());
          else setUserProfile(null);
        } catch { setUserProfile(null); }
      } else {
        // Oturum kapanırsa state'leri temizle
        setUserProfile(null);
        setPosts([]);
        // İsteğe bağlı: Kullanıcıyı giriş sayfasına yönlendir
        // navigate('/login'); // React Router hook'u kullanılıyorsa
      }
    });

    // Component unmount olduğunda listener'ı temizle
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Boş dependency array, sadece component mount olduğunda çalışır


  // --- Fetch Posts ---
  // Gönderileri backend'den çeker
  const fetchPosts = useCallback(async () => {
    // Token yoksa veya arama yapılıyorsa gönderileri çekme
    if (!userToken || isSearching) { // isSearching state'i eklendi
      setLoadingPosts(false); // Gönderi yüklemesini bitir
      setPosts([]); // Gönderi listesini temizle
      return;
    }

    setLoadingPosts(true); // Gönderi yüklemeye başla
    setPostError(null); // Önceki hataları temizle
    setHasSearched(false); // Arama sonuçları gösterilmiyorsa

    try {
      const response = await fetch(`${API_BASE_URL}/posts/`, {
        headers: { 'Authorization': `Bearer ${userToken}` }, // Token'ı header'a ekle
      });
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `Failed to load posts (HTTP ${response.status})`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.detail || JSON.stringify(errorJson);
        } catch {
          errorMessage = errorBody || errorMessage;
        }
        console.error("Post fetch backend error:", response.status, errorMessage);
        // 401 hatası durumunda kullanıcıyı bilgilendir ve giriş sayfasına yönlendir
        if (response.status === 401) {
          alert("Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın."); // Tarayıcı alert kullanıldı
          // navigate('/login'); // React Router hook'u kullanılıyorsa
        }
        throw new Error(errorMessage);
      }
      const responseData = await response.json();
      // Gönderileri tarihe göre yeniden eskiye sırala
      const sortedPosts = Array.isArray(responseData)
        ? responseData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        : [];
      setPosts(sortedPosts); // Gönderileri state'e kaydet
    } catch (err) {
      console.error("Post fetch error:", err);
      setPostError(`Failed to load posts: ${err.message}`); // Hata mesajını state'e kaydet
      setPosts([]); // Hata durumunda gönderi listesini boşalt
    } finally {
      setLoadingPosts(false); // Gönderi yüklemeyi bitir
    }
  }, [userToken, isSearching]); // userToken veya isSearching değiştiğinde fetchPosts yeniden oluşturulur


  // userToken değiştiğinde veya arama bittiğinde gönderileri çek
  useEffect(() => {
    if (userToken && !hasSearched) { // Token varsa ve arama sonuçları gösterilmiyorsa gönderileri çek
      fetchPosts();
    } else if (!userToken) { // Token yoksa gönderi listesini temizle
      setPosts([]);
      setLoadingPosts(false);
    }
  }, [userToken, hasSearched, fetchPosts]); // userToken, hasSearched ve fetchPosts değiştiğinde bu effect çalışır


  // --- Handle Scroll for Sticky Header ---
  // Sayfa kaydırıldığında header'ın sabitlenmesini kontrol eder
  useEffect(() => {
    const handleScroll = () => {
      // Scroll pozisyonu belirli bir eşiği geçtiğinde header'ı sabitle
      // Eşik değeri header yüksekliğine göre ayarlanabilir (örn: 60px)
      if (window.scrollY > 60) {
        setIsHeaderFixed(true);
      } else {
        setIsHeaderFixed(false);
      }
    };

    // Scroll event listener'ı ekle ve component unmount olduğunda kaldır
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Boş dependency array, sadece component mount/unmount olduğunda çalışır

  // --- Create New Post ---
  // Yeni gönderi oluşturma işlemini yapar
  const handlePostSubmit = async () => {
    // İçerik boşsa veya zaten gönderi paylaşılıyorsa işlemi durdur
    if (!newPostContent.trim() || isPosting) return;
    // Kullanıcı giriş yapmamışsa uyarı ver
    if (!userToken) {
      alert("Gönderi paylaşmak için giriş yapmalısınız."); // Tarayıcı alert kullanıldı
      return;
    }

    setIsPosting(true); // Gönderi paylaşma durumunu başlat
    try {
      const response = await fetch(`${API_BASE_URL}/posts/`, { // Backend gönderi oluşturma endpoint'i
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // Token'ı header'a ekle
        },
        body: JSON.stringify({ content: newPostContent }), // Gönderi içeriğini gönder
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `Gönderi paylaşılırken hata oluştu (HTTP ${response.status})`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.detail // DRF Detail hatası
            || errorJson.content?.[0] // Content alanının ilk hatası
            || JSON.stringify(errorJson); // Diğer JSON hataları
        } catch {
          errorMessage = errorBody || errorMessage;
        }
        console.error("Post backend error:", response.status, errorMessage);
        throw new Error(errorMessage);
      }

      const newPost = await response.json();
      // Yeni gönderiye yazar bilgisini ekle (backendden gelmiyorsa)
      // Backend serializer'ınız author_nickname ve author_avatar_url döndürüyorsa buna gerek yok
      const postWithOwnerData = {
        ...newPost,
        author_nickname: userProfile?.nickname || 'You', // Kendi nickname'inizi kullanın
        author_avatar_url: userProfile?.avatar_url, // Kendi avatar URL'nizi kullanın
      };


      // Yeni gönderiyi gönderi listesinin başına ekle
      setPosts(currentPosts => [postWithOwnerData, ...currentPosts]);
      setNewPostContent(''); // Input alanını temizle
      setIsCreatePostExpanded(false); // Gönderi oluşturma alanını daralt
    } catch (err) {
      console.error("Post error:", err);
      alert(`Hata: ${err.message}`); // Tarayıcı alert kullanıldı
    } finally {
      setIsPosting(false); // Gönderi paylaşma durumunu bitir
    }
  };

  // Handle post input expansion
  // Gönderi oluşturma inputına tıklayınca alanı genişletir
  const handleExpandCreatePost = () => {
    setIsCreatePostExpanded(true);
    // Kısa bir gecikmeyle textarea'ya focus yap, eleman DOM'a eklendikten sonra çalışsın
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // --- Handle Search ---
  // Kullanıcı arama işlemini yapar
  const handleSearchSubmit = async (e) => {
    e.preventDefault(); // Formun varsayılan submit işlemini engelle
    const query = searchQuery.trim(); // Arama sorgusunu al ve boşlukları temizle
    if (!query) {
      setSearchResults([]); // Sorgu boşsa sonuçları temizle
      setHasSearched(false); // Arama yapılmadı durumuna dön
      setSearchError(null);
      // Arama temizlendiğinde gönderileri tekrar çek
      if (userToken) fetchPosts();
      return;
    }

    // Kullanıcı giriş yapmamışsa arama yapmayı engelle
    if (!userToken) {
      alert("Arama yapmak için giriş yapmalısınız.");
      return;
    }

    setIsSearching(true); // Arama yükleme durumunu başlat
    setSearchError(null); // Önceki arama hatalarını temizle
    setHasSearched(true); // Arama yapıldı durumunu ayarla (Feed'i gizlemek için)
    setPosts([]); // Arama yaparken gönderi listesini temizle

    try {
      // URLSearchParams ile sorgu parametresini güvenli bir şekilde kodla
      const params = new URLSearchParams({ q: query });
      // Backend kullanıcı arama endpoint'ine GET isteği gönder
      const response = await fetch(`${API_BASE_URL}/search-users/?${params.toString()}`, { // <-- Endpoint'i kontrol edin
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // Token'ı header'a ekle
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `Arama başarısız oldu (HTTP ${response.status})`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.detail || JSON.stringify(errorJson);
        } catch {
          errorMessage = errorBody || errorMessage;
        }
        console.error("Search backend error:", response.status, errorMessage);
        // 401 hatası durumunda kullanıcıyı bilgilendir
        if (response.status === 401) {
          alert("Oturumunuzun süresi dolmuş. Arama yapmak için tekrar giriş yapın.");
          // navigate('/login'); // React Router hook'u kullanılıyorsa
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []); // Sonuçların dizi olduğundan emin ol
      console.log("Search results:", data.length);

    } catch (err) {
      console.error("Search fetch error:", err);
      setSearchError(`Arama başarısız oldu: ${err.message}`); // Hata mesajını state'e kaydet
      setSearchResults([]); // Hata durumunda sonuçları temizle
    } finally {
      setIsSearching(false); // Arama yükleme durumunu bitir
    }
  };

  // --- Handle Friend Request (from search results) ---
  // Arama sonuçlarından arkadaşlık isteği gönderme
  const handleSendFriendRequest = async (targetUserId) => {
    // Kullanıcı giriş yapmamışsa engelle
    if (!userToken) {
      alert("Arkadaşlık isteği göndermek için giriş yapmalısınız.");
      return;
    }

    // Kendine istek göndermeyi engelle
    if (targetUserId === userId) {
      alert("Kendinize arkadaşlık isteği gönderemezsiniz.");
      return;
    }

    // İsteğe bağlı: Butonu hemen devre dışı bırakarak çift tıklamayı önle
    // Bunun için arama sonuçlarındaki her kullanıcı için ayrı bir state yönetmeniz gerekebilir

    try {
      // Backend arkadaşlık oluşturma endpoint'ine POST isteği gönder
      const response = await fetch(`${API_BASE_URL}/friendships/`, { // <-- Endpoint'i kontrol edin
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // Token'ı header'a ekle
        },
        body: JSON.stringify({ receiver_id: targetUserId }), // Alıcı kullanıcının ID'sini gönder
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.detail || JSON.stringify(responseData) || `Arkadaşlık isteği başarısız oldu (HTTP ${response.status})`;
        console.error("Friend request backend error:", response.status, responseData);
        alert(`Arkadaşlık isteği başarısız oldu: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      console.log("Friend request sent successfully:", responseData);
      alert("Arkadaşlık isteği gönderildi!");

      // İsteğe bağlı: Arama sonucundaki kullanıcının durumunu güncelle (örn: "İstek Gönderildi" olarak değiştir)
      // Backend yanıtı güncel kullanıcı objesini döndürüyorsa kullanılabilir
      setSearchResults(prevResults =>
        prevResults.map(user =>
          user.id === targetUserId ? { ...user, friend_status: 'request_sent' } : user // Backend'in friend_status döndürdüğünü varsayarak
        )
      );

    } catch (err) {
      console.error("Friend request fetch error:", err);
      // Backend hatası durumunda alert zaten gösterildi
    } finally {
      // Buton devre dışı bırakıldıysa tekrar etkinleştir (eğer kullanıcı bazında state yönetiliyorsa)
    }
  };


  // User avatar or default
  // Placeholder avatar için basit bir SVG data URL kullanıldı
  const defaultAvatarUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ccc'/%3E%3Cpath d='M0 100 C20 60 80 60 100 100 Z' fill='%23ccc'/%3E%3C/svg%3E`;
  const userAvatar = userProfile?.avatar_url || defaultAvatarUrl;

  // --- Render Helper for Search Result Item ---
  // Arama sonuçlarındaki her kullanıcıyı render eder
  const renderSearchResultItem = (user) => {
    const defaultUserAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ddd'/%3E%3Ccircle cx='50' cy='100' r='40' fill='%23ddd'/%3E%3C/svg%3E`;
    const userProfileAvatar = user.avatar_url || defaultUserAvatar;

    // Arama sonucunun mevcut giriş yapmış kullanıcı olup olmadığını kontrol et
    const isCurrentUser = user.id === userId;

    // Backend'den gelen friend_status'a (varsa) veya client-side state'e göre buton metnini ve durumunu belirle
    const buttonText = user.friend_status === 'request_sent' ? 'İstek Gönderildi'
                        : user.friend_status === 'friends' ? 'Arkadaşlar'
                        : 'Arkadaş Ekle';

    const isButtonDisabled = isCurrentUser || user.friend_status === 'request_sent' || user.friend_status === 'friends';


    return (
      <div key={user.id} className="search-result-item">
        <img src={userProfileAvatar} alt={`${user.nickname}'s avatar`} className="search-result-avatar" />
        <div className="search-result-info">
          <span className="search-result-nickname">{user.nickname || user.email}</span>
          {/* İsteğe bağlı: Daha fazla kullanıcı detayı ekle */}
          {/* <span className="search-result-detail">{user.profession}</span> */}
        </div>
        {!isCurrentUser && ( // Kendimiz için butonu gösterme
          <button
            className={`add-friend-button ${isButtonDisabled ? 'disabled' : ''}`}
            onClick={() => handleSendFriendRequest(user.id)}
            disabled={isButtonDisabled}
          >
            {buttonText}
          </button>
        )}
        {/* Kendi profilimizse belirt */}
        {isCurrentUser && (
          <span className="current-user-label">Siz</span>
        )}
      </div>
    );
  };


  return (
    <>
      {/* Header Bar (Tüm sayfalarda görünür) */}
      <header className={`header-bar ${isHeaderFixed ? 'header-fixed' : ''}`} ref={headerRef}>
        <div className="header-content">
          <div className="header-left">
            {/* Logo */}
            <Link to="/home" className="header-logo">Menture</Link>

            {/* Search Bar */}
            <form className="header-search-form" onSubmit={handleSearchSubmit}>
              <div className="search-input-container">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Search..."
                  className="header-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {/* Arama temizleme butonu */}
                {searchQuery && (
                  <button
                    type="button" // Form içinde submit olmasını engellemek için
                    className="clear-search-button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setHasSearched(false);
                      setSearchError(null);
                      // Arama temizlendiğinde gönderileri tekrar çek
                      if (userToken) fetchPosts();
                    }}
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
              </div>
          </form>
          </div>

          <nav className="header-nav">
            {/* Home Link */}
            <Link className="header-link" to="/home">
              <i className="fas fa-home"></i>
              <span className="nav-text">Home</span>
            </Link>

            {/* Messages Link */}
            <Link className="header-link" to="/home/messages"> {/* /home/messages olarak güncellendi */}
              <div className="icon-badge-container"> {/* Badge için sarmalayıcı */}
                <i className="fas fa-envelope"></i>
                {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
              </div>
              <span className="nav-text">Messages</span>
            </Link>

            {/* Notifications Link */}
            <Link className="header-link" to="/home/notifications"> {/* /home/notifications olarak güncellendi */}
              <div className="icon-badge-container"> {/* Badge için sarmalayıcı */}
                <i className="fas fa-bell"></i>
                {unreadNotifications > 0 && <span className="badge">{unreadNotifications}</span>}
              </div>
              <span className="nav-text">Notifications</span>
            </Link>

            {/* AI Mentorship Link */}
            <Link className="header-link mentorship-link" to="/home/mentorship"> {/* /home/mentorship olarak güncellendi */}
              <i className="fas fa-robot"></i> {/* <-- Robot ikonu eklendi */}
              <span className="nav-text">AI Mentor</span>
            </Link>

            {/* Profile Link */}
            {userProfile ? ( /* userProfile objesi yüklendiğinde */
              <Link className="header-link profile-link" to={`/home/profile/${userId}`}> {/* userId kullanarak dinamik link, /home/profile olarak güncellendi */}
                {/* Avatar olarak profil resmi kullanma */}
                <img src={userAvatar} alt="Profile" className="header-avatar" /> {/* Yeni CSS class'ı */}
                <span className="nav-text">Profile</span>
              </Link>
            ) : ( /* userProfile yoksa (kullanıcı giriş yapmamışsa) */
              <Link className="header-link" to="/login"> {/* Giriş Yap sayfası (App.jsx'te "/login" login'e gidiyor) */}
                <i className="fas fa-sign-in-alt"></i> {/* Giriş ikonu */}
                <span className="nav-text">Login</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Container (Route'lar burada render edilecek) */}
      <main className="content-container">
        {/* Home component'i içindeki alt route'lar */}
        <Routes>
          {/* Ana Feed Route'u (Home component'i içindeki varsayılan alt route) */}
          {/* path="/" Home component'inin kendisi altında boş path'i temsil eder */}
          <Route path="/" element={
            <section className="feed-container"> {/* Feed içeriği için ana section */}
              {/* Create Post Box (userProfile yüklendiğinde ve arama yapılmıyorken göster) */}
              {userProfile && !hasSearched && ( // Arama yapılıyorken gönderi oluşturma kutusunu gizle
                <div className={`create-post-box ${isHeaderFixed ? 'create-post-fixed' : ''}`} ref={createPostRef}> {/* Gönderi oluşturma kutusu */}
                  <div className="create-post-input-area"> {/* Input alanı sarmalayıcısı */}
                    <img src={userAvatar} alt="Avatar" className="create-post-avatar" />
                    <button className="create-post-input-button" onClick={handleExpandCreatePost}>
                      What's on your mind?
                    </button>
                  </div> {/* create-post-input-area kapanışı */}

                  {/* Expanded Create Post Area */}
                  {isCreatePostExpanded && (
                    <div className="create-post-expanded"> {/* Genişletilmiş alan */}
                      <textarea
                        ref={textareaRef}
                        className="create-post-textarea"
                        placeholder="Share your thoughts..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        rows="4"
                      />
                      <div className="create-post-actions"> {/* Aksiyon butonları sarmalayıcısı */}
                        {/* Media Buttons */}
                        <div className="create-post-media-buttons"> {/* Medya butonları */}
                          <button title="Add photo">
                            <i className="fas fa-image"></i>
                          </button>
                          <button title="Add video">
                            <i className="fas fa-video"></i>
                          </button>
                          <button title="Add document">
                            <i className="fas fa-file-alt"></i>
                          </button>
                        </div> {/* create-post-media-buttons kapanışı */}
                        {/* Post Button */}
                        <button
                          className="create-post-share-button"
                          onClick={handlePostSubmit}
                          disabled={isPosting || !newPostContent.trim()}
                        >
                          {isPosting ? 'Posting...' : 'Post'}
                        </button>
                      </div> {/* create-post-actions kapanışı */}
                    </div> /* create-post-expanded kapanışı */
                  )}
                </div> /* create-post-box kapanışı */
              )} {/* userProfile && !hasSearched koşulunun kapanışı */}

              {/* Arama Sonuçları Bölümü (Arama yapılıyorsa göster) */}
              {isSearching && (
                <div className="loading-message">Kullanıcılar aranıyor...</div>
              )}

              {!isSearching && hasSearched && ( // Arama yapıldı ve sonuçlar gösteriliyor
                <div className="search-results-container"> {/* Arama sonuçları container'ı */}
                  {searchResults.length > 0 ? (
                    searchResults.map(user => renderSearchResultItem(user)) // Arama sonuçlarını render et
                  ) : (
                    <div className="no-results-message">"{searchQuery}" için kullanıcı bulunamadı.</div>
                  )}
                  {searchError && <div className="error-message">Arama Hatası: {searchError}</div>}
                </div> /* search-results-container kapanışı */
              )} {/* !isSearching && hasSearched koşulunun kapanışı */}

              {/* Gönderi Listesi (Arama yapılmıyorken göster) */}
              {!hasSearched && ( // Arama sonuçları gösterilmiyorsa gönderi listesini göster
                <div className="posts-list"> {/* Gönderi listesi container'ı */}
                  {/* Yüklenme Durumu */}
                  {loadingPosts && <div className="loading-message">Gönderiler yükleniyor...</div>}

                  {/* Hata Durumu */}
                  {postError && !loadingPosts && <div className="error-message">Hata: {postError}</div>}

                  {/* Gönderi Listesi */}
                  {!loadingPosts && !postError && posts.length > 0 && (
                    posts.map(post => (
                      <PostItem // PostItem componentini kullan
                        key={post.id}
                        post={post}
                        currentUserProfile={userProfile}
                        userToken={userToken}
                      />
                    ))
                  )}

                  {/* Boş Durum */}
                  {!loadingPosts && !postError && posts.length === 0 && (
                    <div className="no-posts-message">Gösterilecek gönderi yok.</div>
                  )}
                </div> /* posts-list kapanışı */
              )} {/* !hasSearched koşulunun kapanışı */}
            </section> 
          } /> {/* Ana Feed Route kapanışı */}

          {/* AI Mentorship Route (path "mentorship" olarak güncellendi) */}
          {/* userToken prop'unu AIMentorship componentine ilet */}
          <Route
            path="mentorship" // AI Mentorluk sayfasının relative URL yolu
            element={<AIMentorship userToken={userToken} />} // <-- userToken prop'u burada iletiliyor
          />

          {/* Profil Sayfası Route'u (path "profile/:userId" olarak güncellendi) */}
          <Route path="profile/:userId" element={<Profile userToken={userToken} currentUserProfile={userProfile} />} />

          {/* Mesajlar Sayfası Route'u (path "messages" olarak eklendi) */}
          {/* Eğer Messages componentiniz varsa buraya ekleyin */}
          {/* <Route path="messages" element={<Messages userToken={userToken} />} /> */}

          {/* Bildirimler Sayfası Route'u (path "notifications" olarak eklendi) */}
          {/* Eğer Notifications componentiniz varsa buraya ekleyin */}
          {/* <Route path="notifications" element={<Notifications userToken={userToken} />} /> */}

          {/* Arama Sonuçları Sayfası Route'u (isteğe bağlı) */}
          {/* Eğer arama sonuçlarını ayrı bir sayfada göstermek isterseniz */}
          {/* <Route path="search" element={<SearchResultsPage userToken={userToken} searchQuery={searchQuery} searchResults={searchResults} isSearching={isSearching} searchError={searchError} handleSendFriendRequest={handleSendFriendRequest} />} /> */}


        </Routes> {/* Routes kapanışı */}
      </main> {/* main kapanışı */}
    </> // Fragment kapanışı
  );
};

export default Home;

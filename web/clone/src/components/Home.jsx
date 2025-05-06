// pages/Home.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

import PostItem from "../components/PostItem";
import "./Home.css";

// Backend API URL
const API_BASE_URL = 'http://10.196.191.59:8000/api';

const Home = () => {
  // State variables
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isCreatePostExpanded, setIsCreatePostExpanded] = useState(false);
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Badge sayıları için state'ler (şimdilik manuel, backend'den çekilmeli)
  const [unreadMessages, setUnreadMessages] = useState(0); // <-- Backend'den güncellenmeli
  const [unreadNotifications, setUnreadNotifications] = useState(0); // <-- Backend'den güncellenmeli

  const textareaRef = useRef(null);
  const createPostRef = useRef(null);
  const headerRef = useRef(null);

  // Fetch user and profile data
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const currentUserId = sessionData.session.user.id;
        const currentToken = sessionData.session.access_token;
        setUserId(currentUserId);
        setUserToken(currentToken);

        // Fetch profile with user ID and token
        if (currentUserId && currentToken) {
          try {
            // Backend'de kendi profilinizi çeken endpoint'in '/api/profile/me/' olduğunu varsayıyorum
            // Eğer sadece '/api/profile/' ise ve backend login olan kullanıcıyı otomatik tanıyorsa bu da doğru olabilir.
            const profileResponse = await fetch(`${API_BASE_URL}/profile/`, { // <-- Endpoint'i kontrol edin
              headers: {
                'Authorization': `Bearer ${currentToken}`,
              },
            });
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              setUserProfile(profileData);
            } else {
              console.error("Profile fetch failed:", profileResponse.status);
              setUserProfile(null);
            }
          } catch (profileError) {
            console.error("Profile fetch error:", profileError);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }

      } else {
        console.error("Session retrieval failed:", sessionError);
        setError("Session information could not be loaded.");
        setUserId(null);
        setUserToken(null);
        setUserProfile(null);
      }
    };
    fetchUserAndProfile();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUserId = session?.user?.id || null;
      const currentToken = session?.access_token || null;
      setUserId(currentUserId);
      setUserToken(currentToken);

      if (currentUserId && currentToken) {
        try {
          // Auth state değişince de profil bilgisini çek
          const profileResponse = await fetch(`${API_BASE_URL}/profile/`, { // <-- Endpoint'i kontrol edin
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

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    // loading state'ini sadece fetchPosts'a özel yapalım
    // if (!userToken || loading) return; // Bu satırı kaldırın
    if (!userToken) {
      setLoading(false);
      setPosts([]);
      return;
    }

    setLoading(true); // Fetch başlamadan loading true yap
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/posts/`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
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
        throw new Error(errorMessage);
      }
      const responseData = await response.json();
      const sortedPosts = Array.isArray(responseData)
        ? responseData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        : [];
      setPosts(sortedPosts);
    } catch (err) {
      console.error("Post fetch error:", err);
      setError(`Failed to load posts: ${err.message}`);
      setPosts([]);
    } finally {
      setLoading(false); // Fetch bitince loading false yap
    }
  }, [userToken]);

  // Fetch posts when userToken changes
  useEffect(() => {
    if (userToken) {
      fetchPosts();
    } else {
      setPosts([]);
      setLoading(false); // Token yoksa loading false olmalı
    }
  }, [userToken, fetchPosts]); // fetchPosts useCallback içinde olduğu için buraya eklenmeli


  // Handle scroll for sticky header and create post
  useEffect(() => {
    const handleScroll = () => {
      // Header yüksekliğine göre ayarlanabilir
      if (window.scrollY > 60) { // Örneğin header yüksekliği 60px ise
        setIsHeaderFixed(true);
      } else {
        setIsHeaderFixed(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Create new post
  const handlePostSubmit = async () => {
    if (!newPostContent.trim() || isPosting) return;
    if (!userToken) {
      alert("You must be logged in to post."); // Use browser alert
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
        const errorBody = await response.text();
        let errorMessage = `Post failed (HTTP ${response.status})`;
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


      setPosts(currentPosts => [postWithOwnerData, ...currentPosts]);
      setNewPostContent('');
      setIsCreatePostExpanded(false);
    } catch (err) {
      console.error("Post error:", err);
      alert(`Error: ${err.message}`); // Use browser alert
    } finally {
      setIsPosting(false);
    }
  };

  // Handle post input expansion
  const handleExpandCreatePost = () => {
    setIsCreatePostExpanded(true);
    // Kısa bir gecikmeyle focus yap, eleman DOM'a eklendikten sonra çalışsın
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Handle search submit (Şimdilik sadece logluyor)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
      // TODO: Implement actual search functionality (Call backend search endpoint)
      // navigate(`/search?q=${encodeURIComponent(searchQuery)}`); // Ayrı bir arama sayfasına yönlendirebilirsiniz
    }
  };

  // User avatar or default
  const defaultAvatarUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ddd'/%3E%3Ccircle cx='50' cy='100' r='40' fill='%23ddd'/%3E%3C/svg%3E`; // Inline SVG fallback
  const userAvatar = userProfile?.avatar_url || defaultAvatarUrl;

  return (
    <>
      {/* Header Bar */}
      <header className={`header-bar ${isHeaderFixed ? 'header-fixed' : ''}`} ref={headerRef}>
        <div className="header-content">
          <div className="header-left">
            {/* Logo */}
            <Link to="/home" className="header-logo">Future</Link>

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
            <Link className="header-link" to="/messages">
              <div className="icon-badge-container"> {/* Badge için sarmalayıcı */}
                <i className="fas fa-envelope"></i>
                {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
              </div>
              <span className="nav-text">Messages</span>
            </Link>

            {/* Notifications Link */}
            <Link className="header-link" to="/notifications">
              <div className="icon-badge-container"> {/* Badge için sarmalayıcı */}
                <i className="fas fa-bell"></i>
                {unreadNotifications > 0 && <span className="badge">{unreadNotifications}</span>}
              </div>
              <span className="nav-text">Notifications</span>
            </Link>

            {/* AI Mentorship Link */}
            <Link className="header-link mentorship-link" to="/mentorship">
              <i className="fas fa-robot"></i> {/* <-- Robot ikonu eklendi */}
              <span className="nav-text">AI Mentor</span>
            </Link>

            {/* Profile Link */}
            {userProfile ? ( /* userProfile objesi yüklendiğinde */
              <Link className="header-link profile-link" to={`/profile/${userId}`}> {/* userId kullanarak dinamik link */}
                {/* Avatar olarak profil resmi kullanma */}
                <img src={userAvatar} alt="Profile" className="header-avatar" /> {/* Yeni CSS class'ı */}
                <span className="nav-text">Profile</span>
              </Link>
            ) : ( /* userProfile yoksa (kullanıcı giriş yapmamışsa) */
              <Link className="header-link" to="/"> {/* Giriş Yap sayfası (App.jsx'te "/" login'e gidiyor) */}
                <i className="fas fa-sign-in-alt"></i> {/* Giriş ikonu */}
                <span className="nav-text">Login</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="content-container">
        <section className="feed-container">
          {/* Create Post Box */}
          {userProfile && (
            <div className={`create-post-box ${isHeaderFixed ? 'create-post-fixed' : ''}`} ref={createPostRef}>
              <div className="create-post-input-area">
                <img src={userAvatar} alt="Avatar" className="create-post-avatar" />
                <button className="create-post-input-button" onClick={handleExpandCreatePost}>
                  What's on your mind?
                </button>
              </div>

              {/* Expanded Create Post Area */}
              {isCreatePostExpanded && (
                <div className="create-post-expanded">
                  <textarea
                    ref={textareaRef}
                    className="create-post-textarea"
                    placeholder="Share your thoughts..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows="4"
                  />
                  <div className="create-post-actions">
                    {/* Media Buttons */}
                    <div className="create-post-media-buttons">
                      <button title="Add photo">
                        <i className="fas fa-image"></i>
                      </button>
                      <button title="Add video">
                        <i className="fas fa-video"></i>
                      </button>
                      <button title="Add document">
                        <i className="fas fa-file-alt"></i>
                      </button>
                    </div>
                    {/* Post Button */}
                    <button
                      className="create-post-share-button"
                      onClick={handlePostSubmit}
                      disabled={isPosting || !newPostContent.trim()}
                    >
                      {isPosting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && <div className="loading-message">Loading posts...</div>}

          {/* Error State */}
          {error && !loading && <div className="error-message">Error: {error}</div>}

          {/* Posts List */}
          {!loading && !error && posts.length > 0 && (
            <div className="posts-list">
              {posts.map(post => (
                <PostItem key={post.id} post={post} currentUserProfile={userProfile} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && posts.length === 0 && (
            <div className="no-posts-message">No posts to display.</div>
          )}
        </section>
      </main>
    </>
  );
};

export default Home;

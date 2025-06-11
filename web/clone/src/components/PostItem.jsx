// components/PostItem.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./PostItem.css"; // PostItem'a özel stil dosyası

// Backend API URL - Updated
const API_BASE_URL = 'http://localhost:8000/api'; // <-- Updated backend address

const PostItem = ({ post, currentUserProfile, userToken, friends = [], userId }) => {
  // State'ler
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState("");

  // Beğenme fonksiyonu
  const handleLike = async () => {
    console.log("Beğenme isteği için token:", userToken);

    // userToken kontrolü
    if (!userToken) {
      console.error("Kimlik doğrulama token'ı bulunamadı. Lütfen giriş yapın.");
      alert("Bu işlemi yapmak için giriş yapmalısınız.");
      return;
    }

    try {
      // Optimistik local güncelleme kaldırıldı
      // Backend'e istek gönder
      const response = await fetch(`${API_BASE_URL}/posts/${post.id}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Like operation failed: ${response.status}`);
      }

      // Backend'den dönen gerçek sayıyı kullan
      const data = await response.json();
      console.log('Like response:', data);
      setIsLiked(data.liked);
      setLikesCount(typeof data.likes_count === 'number' ? data.likes_count : likesCount);
    } catch (err) {
      console.error("Like error:", err);
      alert(`Beğenme işlemi başarısız oldu: ${err.message}`);
    }
  };

  // Yorumları yükleme
  const loadComments = async () => {
    if (!userToken) {
      console.error("Kimlik doğrulama token'ı bulunamadı. Yorumlar yüklenemedi.");
      alert("Yorumları görmek için giriş yapmalısınız.");
      return;
    }

    if (!showComments) {
      setIsLoadingComments(true);
      try {
        const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comments/`, {
          headers: {
            'Authorization': `Bearer ${userToken}`,
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load comments: ${response.status}`);
        }

        const loadedComments = await response.json();
        console.log('Loaded comments:', loadedComments);
        setComments(loadedComments);
        setShowComments(true);
        setCommentsCount(Array.isArray(loadedComments) ? loadedComments.length : 0);
      } catch (err) {
        console.error("Load comments error:", err);
        alert(`Yorumlar yüklenemedi: ${err.message}`);
      } finally {
        setIsLoadingComments(false);
      }
    } else {
      setShowComments(false);
    }
  };

  // Yorum gönderme
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    // userToken kontrolü
    if (!userToken) {
      console.error("Kimlik doğrulama token'ı bulunamadı. Yorum gönderilemedi.");
      alert("Yorum yapmak için giriş yapmalısınız.");
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ comment_text: commentText, type: "comment" }),
      });

      let errorBody = null;
      if (!response.ok) {
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }
        console.error("Comment POST error body:", errorBody);
        alert(`Yorum gönderilemedi! Sunucu cevabı: ${JSON.stringify(errorBody)}`);
        throw new Error(`Comment failed: ${response.status} - ${JSON.stringify(errorBody)}`);
      }

      const newComment = await response.json();

      // Yorum yazar bilgisi backend'den geliyorsa kullan, yoksa currentUserProfile'dan al
      const commentWithUserData = {
        ...newComment,
        author_nickname: newComment.author_nickname || currentUserProfile?.nickname || 'You',
        author_avatar_url: newComment.author_avatar_url || currentUserProfile?.avatar_url,
        author_id: newComment.author_id || currentUserProfile?.id,
      };

      setComments(prevComments => [commentWithUserData, ...prevComments]);
      setCommentText("");
      setCommentsCount(prevCount => prevCount + 1);
    } catch (err) {
      console.error("Comment error:", err);
      alert(`Yorum gönderilemedi: ${err.message}`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Tarih formatlama
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      // Format as date: "May 5" or "Oct 12"
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  // Default avatar
  const defaultAvatarUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ddd'/%3E%3Ccircle cx='50' cy='100' r='40' fill='%23ddd'/%3E%3C/svg%3E`;
  const authorAvatar = post.author_avatar_url || defaultAvatarUrl;

  const handleShareAsMessage = async () => {
    if (!selectedFriendId) return;
    setIsSharing(true);
    setShareError("");
    try {
      const response = await fetch(`http://localhost:8000/api/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ receiver_id: selectedFriendId, message_text: `Bir gönderi paylaşıldı: \n\n${post.content}` })
      });
      if (!response.ok) throw new Error('Mesaj olarak paylaşma başarısız');
      setShowShareModal(false);
      setSelectedFriendId("");
      alert("Gönderi mesaj olarak paylaşıldı!");
    } catch (e) {
      setShareError("Mesaj gönderilemedi");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="post-item">
      {/* Post Header */}
      <div className="post-header">
        {/* Yazarın profil linki */}
        <Link to={`/profile/${post.author_id}`} className="post-author">
          {/* Yazarın avatarı */}
          <img 
            src={authorAvatar} 
            alt={post.author_nickname || "User"} 
            className="post-avatar" 
          />
          <div className="post-author-info">
            {/* Yazarın nickname'i veya adı */}
            <span className="post-author-name">
              {post.author_nickname || post.author_name || "Anonymous User"} {/* <-- Nickname veya adı göster */}
            </span>
            {/* Gönderi zamanı */}
            <span className="post-time">{formatDate(post.created_at)}</span>
          </div>
        </Link>
        
        {/* Post Menü (ellipsis) */}
        <button className="post-menu-button">
          <i className="fas fa-ellipsis-h"></i>
        </button>
      </div>

      {/* Post Content */}
      <div className="post-content">
        {post.content}
      </div>

      {/* Post Stats - Likes and Comments Count */}
      <div className="post-stats">
        <div className="stat-item likes-count">
          <i className="fas fa-thumbs-up stat-icon"></i>
          <span>{likesCount}</span>
        </div>
        <div className="stat-item comments-count">
          <i className="far fa-comment stat-icon"></i>
          <span>{commentsCount}</span>
        </div>
      </div>

      {/* Post Actions - Like, Comment, Share */}
      <div className="post-actions">
        <button 
          className={`post-action-button ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <i className={`${isLiked ? 'fas' : 'far'} fa-thumbs-up`}></i>
          <span>Like</span>
        </button>
        
        <button 
          className="post-action-button"
          onClick={loadComments}
        >
          <i className="far fa-comment"></i>
          <span>Comment</span>
        </button>
        
        <button className="post-action-button" onClick={() => setShowShareModal(true)}>
          <i className="fas fa-paper-plane"></i>
          <span>Mesaj olarak paylaş</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          {/* Comment Form */}
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <img 
              src={currentUserProfile?.avatar_url || defaultAvatarUrl} 
              alt="Your Avatar" 
              className="comment-avatar"
            />
            <div className="comment-input-container">
              <input
                type="text"
                className="comment-input"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={isSubmittingComment}
              />
              <button 
                type="submit" 
                className="comment-submit-button"
                disabled={!commentText.trim() || isSubmittingComment}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </form>

          {/* Loading State */}
          {isLoadingComments && (
            <div className="comments-loading">Loading comments...</div>
          )}

          {/* Comments List */}
          <div className="comments-list">
            {comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <Link to={`/profile/${comment.author_id || comment.user}`} className="comment-avatar-link">
                  <img 
                    src={comment.author_avatar_url || defaultAvatarUrl} 
                    alt={comment.author_nickname || "User"} 
                    className="comment-avatar"
                  />
                </Link>
                <div className="comment-content">
                  <div className="comment-bubble">
                    <Link to={`/profile/${comment.author_id || comment.user}`} className="comment-author">
                      {comment.author_nickname || comment.user_nickname || comment.author_name || "Anonymous User"} {/* <-- Yorum yazar nickname/adı göster */}
                    </Link>
                    <p className="comment-text">{comment.comment_text || comment.content}</p>
                  </div>
                  <div className="comment-actions">
                    <span className="comment-time">{formatDate(comment.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}

            {comments.length === 0 && !isLoadingComments && (
              <div className="no-comments">No comments yet. Be the first to comment!</div>
            )}
          </div>
        </div>
      )}

      {/* Mesaj olarak paylaş modalı */}
      {showShareModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Arkadaşına Mesaj Olarak Paylaş</h3>
            <select value={selectedFriendId} onChange={e => setSelectedFriendId(e.target.value)}>
              <option value="">Arkadaş seç</option>
              {friends.map(f => (
                <option key={f.id} value={f.id}>{f.nickname || (f.email ? f.email.slice(0,4) : 'Kullanıcı')}</option>
              ))}
            </select>
            <button onClick={handleShareAsMessage} disabled={!selectedFriendId || isSharing} style={{marginTop: 12}}>
              {isSharing ? 'Paylaşılıyor...' : 'Paylaş'}
            </button>
            {shareError && <div style={{color: 'red', marginTop: 8}}>{shareError}</div>}
            <button onClick={() => setShowShareModal(false)} style={{marginTop: 8}}>Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostItem;
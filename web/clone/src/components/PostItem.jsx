// components/PostItem.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./PostItem.css"; // PostItem'a özel stil dosyası

// Backend API URL - Home.jsx'ten alındı
const API_BASE_URL = 'http://10.196.191.59:8000/api';

const PostItem = ({ post, currentUserProfile }) => {
  // State'ler
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Beğenme fonksiyonu
  const handleLike = async () => {
    try {
      // Lokal optimistik güncelleme
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prevCount => newIsLiked ? prevCount + 1 : prevCount - 1);

      // Backend'e istek gönder
      const response = await fetch(`${API_BASE_URL}/posts/${post.id}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-auth-token')}`, // Token'ı localStorage'dan alma
        },
      });

      if (!response.ok) {
        // İstek başarısız olursa state'i geri al
        setIsLiked(!newIsLiked);
        setLikesCount(prevCount => newIsLiked ? prevCount - 1 : prevCount + 1);
        throw new Error(`Like operation failed: ${response.status}`);
      }

      // Backend'den dönen gerçek sayıyı kullan
      const data = await response.json();
      setLikesCount(data.likes_count || likesCount);
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // Yorumları yükleme
  const loadComments = async () => {
    if (!showComments) {
      setIsLoadingComments(true);
      try {
        const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comments/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sb-auth-token')}`,
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load comments: ${response.status}`);
        }

        const loadedComments = await response.json();
        setComments(loadedComments);
        setShowComments(true);
      } catch (err) {
        console.error("Load comments error:", err);
        alert("Failed to load comments. Please try again.");
      } finally {
        setIsLoadingComments(false);
      }
    } else {
      // Yorumlar zaten gösteriliyorsa, kapat
      setShowComments(false);
    }
  };

  // Yorum gönderme
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-auth-token')}`,
        },
        body: JSON.stringify({ content: commentText }),
      });

      if (!response.ok) {
        throw new Error(`Comment failed: ${response.status}`);
      }

      const newComment = await response.json();
      
      // Şu anki kullanıcıya ait verilerle yorumu zenginleştirme
      const commentWithUserData = {
        ...newComment,
        author_nickname: currentUserProfile?.nickname || 'You',
        author_avatar_url: currentUserProfile?.avatar_url,
      };
      
      setComments(prevComments => [commentWithUserData, ...prevComments]);
      setCommentText("");
      setCommentsCount(prevCount => prevCount + 1);
    } catch (err) {
      console.error("Comment error:", err);
      alert("Failed to post comment. Please try again.");
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

  return (
    <div className="post-item">
      {/* Post Header */}
      <div className="post-header">
        <Link to={`/profile/${post.author_id}`} className="post-author">
          <img 
            src={authorAvatar} 
            alt={post.author_nickname || "User"} 
            className="post-avatar" 
          />
          <div className="post-author-info">
            <span className="post-author-name">
              {post.author_nickname || "Anonymous User"}
            </span>
            <span className="post-time">{formatDate(post.created_at)}</span>
          </div>
        </Link>
        
        {/* Post Menu (ellipsis) */}
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
        {likesCount > 0 && (
          <div className="stat-item likes-count">
            <i className="fas fa-thumbs-up stat-icon"></i>
            <span>{likesCount}</span>
          </div>
        )}
        {commentsCount > 0 && (
          <div className="stat-item comments-count">
            <span>{commentsCount} comments</span>
          </div>
        )}
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
        
        <button className="post-action-button">
          <i className="fas fa-share"></i>
          <span>Share</span>
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
                <Link to={`/profile/${comment.author_id}`} className="comment-avatar-link">
                  <img 
                    src={comment.author_avatar_url || defaultAvatarUrl} 
                    alt={comment.author_nickname || "User"} 
                    className="comment-avatar"
                  />
                </Link>
                <div className="comment-content">
                  <div className="comment-bubble">
                    <Link to={`/profile/${comment.author_id}`} className="comment-author">
                      {comment.author_nickname || "Anonymous User"}
                    </Link>
                    <p className="comment-text">{comment.content}</p>
                  </div>
                  <div className="comment-actions">
                    <button className="comment-action-button">Like</button>
                    <button className="comment-action-button">Reply</button>
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
    </div>
  );
};

export default PostItem;
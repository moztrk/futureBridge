// components/PostItem.jsx
import React from 'react';
import './PostItem.css'; // PostItem'a özel CSS dosyasını import et

const PostItem = ({ post }) => {
  // Backend'den gelen ISO 8601 formatındaki tarihi daha okunur hale getirme
  const formatPostDate = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    try {
      const date = new Date(dateString);
      // Web için toLocaleString kullanarak daha okunur format
      return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.warn('Gönderi tarih formatlama hatası:', e);
      return dateString;
    }
  };

  const defaultAvatar = 'https://via.placeholder.com/40/cccccc/FFFFFF?text=?'; // Placeholder avatar

  return (
    <div className="post-item">
      {/* Yazar Bilgileri */}
      <div className="post-header">
        <img
          src={post.author_avatar_url || defaultAvatar}
          alt={`${post.author_nickname || 'Kullanıcı'}'nın avatarı`}
          className="post-avatar"
        />
        <div className="author-info">
          <h4 className="author-nickname">{post.author_nickname || 'İsimsiz Kullanıcı'}</h4>
          <span className="post-date">{formatPostDate(post.created_at)}</span>
        </div>
        {/* İsteğe bağlı: Gönderi seçenekleri (sil, düzenle) */}
        {/* <button className="post-options-button">...</button> */}
      </div>

      {/* Gönderi İçeriği */}
      <div className="post-content">
        <p>{post.content}</p>
      </div>

      {/* İsteğe bağlı: Resim alanı */}
      {/* {post.image_url && (
        <img src={post.image_url} alt="Gönderi resmi" className="post-image" />
      )} */}

      {/* İsteğe bağlı: Etkileşim butonları (Beğen, Yorum Yap) */}
      {/* <div className="post-actions">
        <button className="action-button">👍 Beğen</button>
        <button className="action-button">💬 Yorum Yap</button>
      </div> */}

      {/* Yorum Bölümü (Şimdilik pasif) */}
      {/* Burası yorumları listelemek ve yeni yorum eklemek için kullanılacak */}
      {/* <div className="comment-section">
        // Yorum formu ve mevcut yorumlar buraya gelecek
      </div> */}
    </div>
  );
};

export default PostItem;
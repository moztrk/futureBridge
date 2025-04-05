// Home.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient"; 
import "./Home.css";

const Home = () => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [userId, setUserId] = useState(null); // Kullanıcı ID'sini tutmak için state

  // Kullanıcı bilgilerini Supabase'den al
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data) {
        setUserId(data.user.id); // Kullanıcı ID'sini al ve state'e kaydet
        console.log("Home sayfasındaki userId:", data.user.id); // BU SATIRI EKLEDİM
      }
      if (error) console.error("Kullanıcı bilgisi alınamadı", error);
    };
    fetchUser();
  }, []);

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment) {
      setComments([...comments, comment]);
      setComment("");
    }
  };

  return (
    <>
      <div className="header-bar">
        <div className="header-nav">
          <Link className="header-link" to="/notifications">Bildirim</Link>
          <Link className="header-link" to="/">Anasayfa</Link>
          {userId &&
            <Link className="header-link" to={`/profile/${userId}`}>Profil</Link> /* Dinamik profil linki */}

          <Link className="header-link" to="/mentorship">AI Mentor Paneli</Link>
        </div>
      </div>

      <div className="home-h1">Hoşgeldiniz</div>

      <div className="content">
        <div className="home-container"></div>

        <div className="feed-container">
          {/* Post 1 */}
          <div className="post">
            <div className="post-header">
              <img src="https://via.placeholder.com/40" alt="User Avatar" />
              <h3>John Doe</h3>
            </div>
            <div className="post-content">
              AI destekli mentorluk, kariyerinizi ileriye taşıyacak müthiş bir araçtır!
            </div>
            <div className="post-actions">
              <button>👍 Beğen</button>
              <button>💬 Yorum Yap</button>
            </div>
            <div className="comment-section">
              <form onSubmit={handleCommentSubmit}>
                <input
                  type="text"
                  value={comment}
                  onChange={handleCommentChange}
                  placeholder="Yorum yapın..."
                />
              </form>
              <div className="comments">
                {comments.map((com, index) => (
                  <div key={index} className="comment">
                    <img src="https://via.placeholder.com/30" alt="User Avatar" />
                    <p>{com}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Diğer Gönderiler */}
          <div className="post">
            <div className="post-header">
              <img src="https://via.placeholder.com/40" alt="User Avatar" />
              <h3>Jane Doe</h3>
            </div>
            <div className="post-content">
              Yazılım geliştirme alanında AI'nın etkilerini keşfedin!
            </div>
            <div className="post-actions">
              <button>👍 Beğen</button>
              <button>💬 Yorum Yap</button>
            </div>
            <div className="comment-section">
              <form onSubmit={handleCommentSubmit}>
                <input
                  type="text"
                  value={comment}
                  onChange={handleCommentChange}
                  placeholder="Yorum yapın..."
                />
              </form>
              <div className="comments">
                {comments.map((com, index) => (
                  <div key={index} className="comment">
                    <img src="https://via.placeholder.com/30" alt="User Avatar" />
                    <p>{com}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
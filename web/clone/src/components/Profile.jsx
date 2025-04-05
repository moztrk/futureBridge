import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Profile.css";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Oturum kontrolü
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          throw new Error("Oturum açık değil. Lütfen giriş yapın.");
        }

        // 2. Profil ID'sini belirle
        const profileId = id || authUser.id;
        console.log("Kullanılan Profil ID:", profileId);

        // 3. Veritabanı sorgusu (daha güvenli versiyon)
        const { data, error: dbError } = await supabase
          .from("users")
          .select(`
            id,
            username,
            email,
            profile_picture,
            created_at
          `) // 'bio' sütununu kaldırdım
          .eq("id", profileId)
          .maybeSingle();

        if (dbError) {
          throw dbError;
        }

        if (!data) {
          throw new Error("Kullanıcı bulunamadı. ID: " + profileId);
        }

        setUserProfile(data);
      } catch (err) {
        setError(err.message);
        console.error("Profil hatası:", {
          error: err,
          timestamp: new Date().toISOString()
        });

        if (err.message.includes("Oturum açık değil")) {
          navigate("/login", { state: { from: "profile" } });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id, navigate]);

  // Yerel profil resmi fallback
  const defaultProfilePic = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ddd'/%3E%3Ccircle cx='50' cy='100' r='40' fill='%23ddd'/%3E%3C/svg%3E`;

  const formatDate = (dateString) => {
    if (!dateString) return "Bilinmiyor";
    try {
      return new Date(dateString).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      console.warn("Tarih formatlama hatası:", e);
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Profil bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <h3>Hata oluştu</h3>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={() => navigate("/")}>Ana Sayfa</button>
          <button onClick={() => window.location.reload()}>Yenile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <div className="profile-cover"></div>
        <img
          src={userProfile?.profile_picture || defaultProfilePic}
          alt={`${userProfile?.username || 'Kullanıcı'} profil fotoğrafı`}
          className="profile-picture"
          onError={(e) => {
            e.target.src = defaultProfilePic;
            e.target.onerror = null; // Sonsuz döngüyü önle
          }}
        />
      </div>

      <div className="profile-info">
        <h2 className="profile-username">
          {userProfile?.username || "Kullanıcı"}
        </h2>

        {userProfile?.bio && (
          <p className="profile-bio">{userProfile.bio}</p>
        )}

        <div className="profile-meta">
          <p>
            <span>📧</span> {userProfile?.email || "E-posta bilgisi yok"}
          </p>
          <p>
            <span>🆔</span> {userProfile?.id || "ID bilgisi yok"}
          </p>
          <p>
            <span>📅</span> Katılım: {formatDate(userProfile?.created_at)}
          </p>
        </div>
      </div>

      <div className="profile-content">
        <h3>Aktiviteler</h3>
        <div className="activity-placeholder">
          <p>Henüz aktivite bulunmamaktadır</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
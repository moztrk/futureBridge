import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Profile.css";

const API_BASE_URL = 'http://localhost:8000/api';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    email: '',
    profile_picture: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [friendCount, setFriendCount] = useState(null);

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
          `)
          .eq("id", profileId)
          .maybeSingle();

        if (dbError) {
          throw dbError;
        }

        if (!data) {
          throw new Error("Kullanıcı bulunamadı. ID: " + profileId);
        }

        setUserProfile(data);
        // Düzenleme formu için mevcut değerleri ayarla
        setEditData({
          username: data.username || '',
          email: data.email || '',
          profile_picture: data.profile_picture || ''
        });
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

  // Arkadaş sayısını çek
  useEffect(() => {
    const fetchFriendCount = async () => {
      try {
        const profileId = id || (await supabase.auth.getUser()).data.user.id;
        // Doğru tokenı al
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) throw new Error('Token bulunamadı');
        const response = await fetch(`${API_BASE_URL}/users/${profileId}/friends/`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error('Arkadaşlar yüklenemedi');
        const data = await response.json();
        setFriendCount(Array.isArray(data) ? data.length : 0);
      } catch (e) {
        setFriendCount(0);
      }
    };
    fetchFriendCount();
  }, [id]);

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
          <p>
            <span>👥</span> Arkadaş Sayısı: {friendCount === null ? '...' : friendCount}
          </p>
        </div>
        {/* Profil sahibi ise düzenle butonu */}
        {(!id || id === userProfile?.id) && !isEditing && (
          <button className="edit-profile-button" onClick={() => setIsEditing(true)}>
            Profili Düzenle
          </button>
        )}
        {/* Düzenleme Formu */}
        {isEditing && (
          <form className="edit-profile-form" onSubmit={async (e) => {
            e.preventDefault();
            setEditLoading(true);
            setEditError(null);
            setEditSuccess(false);
            try {
              // Supabase güncellemesi (örnek, backend API ile değiştirilebilir)
              const { error: updateError } = await supabase
                .from('users')
                .update({
                  username: editData.username,
                  email: editData.email,
                  profile_picture: editData.profile_picture
                })
                .eq('id', userProfile.id);
              if (updateError) throw updateError;
              setUserProfile({ ...userProfile, ...editData });
              setEditSuccess(true);
              setIsEditing(false);
            } catch (err) {
              setEditError(err.message || 'Güncelleme hatası');
            } finally {
              setEditLoading(false);
            }
          }}>
            <div className="edit-profile-row">
              <label>Kullanıcı Adı</label>
              <input type="text" value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} />
            </div>
            <div className="edit-profile-row">
              <label>E-posta</label>
              <input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
            </div>
            <div className="edit-profile-row">
              <label>Profil Fotoğrafı (URL)</label>
              <input type="text" value={editData.profile_picture} onChange={e => setEditData({ ...editData, profile_picture: e.target.value })} />
            </div>
            {editError && <div className="edit-profile-error">{editError}</div>}
            {editSuccess && <div className="edit-profile-success">Profil başarıyla güncellendi!</div>}
            <div className="edit-profile-actions">
              <button type="submit" disabled={editLoading}>{editLoading ? 'Kaydediliyor...' : 'Kaydet'}</button>
              <button type="button" onClick={() => setIsEditing(false)} disabled={editLoading}>İptal</button>
            </div>
          </form>
        )}
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
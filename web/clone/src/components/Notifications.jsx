import React, { useEffect, useState } from "react";

const API_BASE_URL = 'http://localhost:8000/api';

const defaultAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ddd'/%3E%3Ccircle cx='50' cy='100' r='40' fill='%23ddd'/%3E%3C/svg%3E`;

const NOTIF_ICONS = {
  like: '👍',
  comment: '💬',
  message: '✉️',
  friend_request: '🤝',
  roadmap_step: '✅',
};

const Notifications = ({ userToken }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    const res = await fetch(`${API_BASE_URL}/notifications/`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
    });
    const data = await res.json();
    setNotifications(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!userToken) return;
    setLoading(true);
    setError(null);
    fetchNotifications();
  }, [userToken]);

  const handleMarkRead = async (notifId) => {
    await fetch(`${API_BASE_URL}/notifications/${notifId}/read/`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${userToken}` },
    });
    fetchNotifications();
  };

  // Tarih formatı
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  return (
    <div className="notifications-page-container">
      <h2 style={{marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.4rem', color: '#222'}}>Bildirimler</h2>
      {loading && <div>Yükleniyor...</div>}
      {error && <div className="notification-error">{error}</div>}
      <div>
        {notifications.length === 0 && !loading && (
          <div style={{textAlign: 'center', color: '#888', marginTop: '2rem'}}>Hiç bildirimin yok.</div>
        )}
        {unread.length > 0 && <div style={{fontWeight:600,margin:'18px 0 8px 0',color:'#2563eb'}}>Okunmamış</div>}
        {unread.map(notif => (
          <div key={notif.id} className="post-item" style={{display: 'flex', alignItems: 'center', marginBottom: 16, background:'#e0e7ff', borderRadius:8, boxShadow:'0 1px 4px #2563eb11'}}>
            <span style={{fontSize:28,marginRight:10}}>{NOTIF_ICONS[notif.type] || '🔔'}</span>
            <img src={notif.actor_avatar_url || defaultAvatar} alt={notif.actor_nickname || 'Kullanıcı'} className="post-avatar" style={{marginRight: 12}} />
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                <span style={{fontWeight: 600, color: '#2563eb'}}>{notif.actor_nickname || 'Sistem'}</span>
                <span style={{color: '#333'}}>{notif.message}</span>
              </div>
              <div style={{fontSize: 12, color: '#888', marginTop: 2}}>{formatDate(notif.created_at)}</div>
            </div>
            <button style={{marginLeft: 16, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 1rem', fontWeight: 600, fontSize: '0.98rem', cursor: 'pointer', boxShadow: '0 1px 4px #22c55e22', transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s'}} onClick={() => handleMarkRead(notif.id)}>Okundu</button>
          </div>
        ))}
        {read.length > 0 && <div style={{fontWeight:600,margin:'18px 0 8px 0',color:'#888'}}>Okunanlar</div>}
        {read.map(notif => (
          <div key={notif.id} className="post-item" style={{display: 'flex', alignItems: 'center', marginBottom: 16, background:'#f3f4f6', borderRadius:8}}>
            <span style={{fontSize:28,marginRight:10}}>{NOTIF_ICONS[notif.type] || '🔔'}</span>
            <img src={notif.actor_avatar_url || defaultAvatar} alt={notif.actor_nickname || 'Kullanıcı'} className="post-avatar" style={{marginRight: 12}} />
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                <span style={{fontWeight: 600, color: '#2563eb'}}>{notif.actor_nickname || 'Sistem'}</span>
                <span style={{color: '#333'}}>{notif.message}</span>
              </div>
              <div style={{fontSize: 12, color: '#888', marginTop: 2}}>{formatDate(notif.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications; 
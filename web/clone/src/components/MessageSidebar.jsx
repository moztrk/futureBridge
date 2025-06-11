import React, { useEffect, useRef, useState } from "react";
import "./MessageSidebar.css";

const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=ddd&color=555&size=100';

const MessageSidebar = ({ friends, selectedFriend, setSelectedFriend, messages, setMessages, messageInput, setMessageInput, userToken, userId, userProfile }) => {
  const sidebarRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);

  // Mesajlar paneli scroll en alta
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Mesaj silme fonksiyonu
  const handleDeleteMessage = async (msgId) => {
    // Backend'de silme endpointi varsa kullan, yoksa localden sil
    setMessages(prev => prev.filter(msg => msg.id !== msgId));
    // TODO: Backend'de silme işlemi eklenirse burada fetch ile silinebilir
  };

  // Mesaj seçme
  const toggleSelectMessage = (msgId) => {
    setSelectedMessages(prev => prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]);
  };

  // Çoklu mesaj silme
  const handleDeleteSelected = () => {
    setMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)));
    setSelectedMessages([]);
    // TODO: Backend'de toplu silme işlemi eklenirse burada fetch ile silinebilir
  };

  // Arkadaş seçilince mesajları çek
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedFriend || !userToken) return;
      try {
        const response = await fetch(`http://localhost:8000/api/messages/`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (!response.ok) throw new Error('Mesajlar yüklenemedi');
        const data = await response.json();
        const filtered = Array.isArray(data) ? data.filter(msg =>
          (msg.sender === userId && msg.receiver === selectedFriend.id) ||
          (msg.sender === selectedFriend.id && msg.receiver === userId)
        ) : [];
        setMessages(filtered);
      } catch (e) {
        setMessages([]);
      }
    };
    if (open) fetchMessages();
  }, [selectedFriend, userToken, setMessages, userId, open]);

  // Mesaj gönder
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedFriend) return;
    try {
      const response = await fetch(`http://localhost:8000/api/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ receiver_id: selectedFriend.id, message_text: messageInput })
      });
      if (!response.ok) throw new Error('Mesaj gönderilemedi');
      const newMsg = await response.json();
      setMessages(prev => [...prev, newMsg]);
      setMessageInput("");
    } catch (e) {
      // Hata gösterilebilir
    }
  };

  // Dışarı tıklayınca paneli kapat
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target) && !e.target.classList.contains('message-bar')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <>
      {/* Sol altta küçük bar (çubuk) */}
      <div className="message-bar" onClick={() => setOpen(true)}>
        <i className="fas fa-comment-dots"></i>
        <span>Mesajlar</span>
      </div>
      {/* Açılır panel */}
      <div className={`message-sidebar-overlay${open ? ' open' : ''}`}></div>
      <aside className={`message-sidebar${open ? ' open' : ''}`} ref={sidebarRef}>
        <div className="sidebar-header">
          <span>Mesajlar</span>
          <button className="close-btn" onClick={() => setOpen(false)}><i className="fas fa-times"></i></button>
        </div>
        <div className="sidebar-content">
          <div className="friend-list">
            {friends.length === 0 && <div className="no-friends">Hiç arkadaşın yok</div>}
            {friends.map(friend => (
              <div
                key={friend.id}
                className={`friend-item${selectedFriend && selectedFriend.id === friend.id ? ' selected' : ''}`}
                onClick={() => setSelectedFriend(friend)}
              >
                <img src={friend.avatar_url || defaultAvatar} alt={friend.nickname || (friend.email ? friend.email.slice(0,4) : 'Kullanıcı')} className="friend-avatar" />
                <span className="friend-nickname">{friend.nickname || (friend.email ? friend.email.slice(0,4) : 'Kullanıcı')}</span>
              </div>
            ))}
          </div>
          <div className="message-panel">
            {selectedFriend ? (
              <>
                <div className="message-panel-header">
                  <img src={selectedFriend.avatar_url || defaultAvatar} alt={selectedFriend.nickname || (selectedFriend.email ? selectedFriend.email.slice(0,4) : 'Kullanıcı')} className="friend-avatar" />
                  <span className="friend-nickname">{selectedFriend.nickname || (selectedFriend.email ? selectedFriend.email.slice(0,4) : 'Kullanıcı')}</span>
                  {selectedMessages.length > 0 && (
                    <button className="delete-selected-btn" onClick={handleDeleteSelected} style={{marginLeft: 'auto', background: '#f43f5e', color: '#fff', borderRadius: 8, padding: '4px 12px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>Seçili Mesajları Sil</button>
                  )}
                </div>
                <div className="messages-list" style={{flex: 1, overflowY: 'auto', maxHeight: 320, marginBottom: 8}}>
                  {messages.length === 0 && <div className="no-messages">Henüz mesaj yok</div>}
                  {messages.slice().sort((a, b) => a.id - b.id).map(msg => (
                    <div key={msg.id} className={`message-item${msg.sender === userId ? ' sent' : ' received'}${selectedMessages.includes(msg.id) ? ' selected' : ''}`}> 
                      <div className="message-bubble" onClick={() => toggleSelectMessage(msg.id)} style={{cursor: 'pointer', background: selectedMessages.includes(msg.id) ? '#fbbf24' : undefined}}>{msg.message_text}</div>
                      <button className="delete-msg-btn" onClick={() => handleDeleteMessage(msg.id)} style={{marginLeft: 8, background: 'transparent', border: 'none', color: '#f43f5e', fontWeight: 'bold', cursor: 'pointer'}}>🗑️</button>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form className="message-input-form" onSubmit={handleSendMessage} style={{position: 'sticky', bottom: 0, background: '#fff', zIndex: 2}}>
                  <input
                    type="text"
                    className="message-input"
                    placeholder="Mesaj yaz..."
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                  />
                  <button type="submit" className="send-btn"><i className="fas fa-paper-plane"></i></button>
                </form>
              </>
            ) : (
              <div className="select-friend-placeholder">Bir arkadaş seç</div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default MessageSidebar; 
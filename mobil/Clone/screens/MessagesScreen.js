// screens/MessagesScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Keyboard,
  FlatList,
  StatusBar,
} from 'react-native';
import { API_BASE_URL } from '@env';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkZWeURXTVdPb1YvMVBNSkwiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2x6cnFpYWJ4ZXBzdnpuaXZ0ZmdkLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiNzNjOGNiMC1iMGUwLTRiNTAtODdjMC02Y2MxYTNjNTJkNzUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ4ODkzODI2LCJpYXQiOjE3NDg4OTAyMjYsImVtYWlsIjoibXVzdGFmYTQ0ZmJmYkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoibXVzdGFmYTQ0ZmJmYkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiNzNjOGNiMC1iMGUwLTRiNTAtODdjMC02Y2MxYTNjNTJkNzUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0ODg5MDIyNn1dLCJzZXNzaW9uX2lkIjoiYTIyZWY4OTUtYzM4Ni00MzYwLTk4MzYtNTM4ZWUzZDE4NGFhIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.d7jJq2oc6kREXDc1_KsL99ZlCPYJREQBBfr_dsyM1-8';

const defaultAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ddd'/%3E%3Ccircle cx='50' cy='100' r='40' fill='%23ddd'/%3E%3C/svg%3E`;

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'şimdi';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}g`;
  return date.toLocaleDateString('tr-TR');
}

// Avatar için güvenli url (FeedScreen.js ile aynı)
function getSafeAvatarUrl(url) {
  if (!url || typeof url !== 'string' || url.startsWith('data:image/svg+xml') || url.endsWith('.svg')) {
    const randomId = Math.floor(Math.random() * 99) + 1;
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    return `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`;
  }
  return url;
}

const MessagesScreen = () => {
  // Genel state
  const [userId, setUserId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [conversations, setConversations] = useState([]); // {friend, lastMessage, lastTime}
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef();

  // Kullanıcı ID'sini al
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/profile/`, {
          headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
        });
        if (!res.ok) throw new Error('Profil alınamadı');
        const data = await res.json();
        setUserId(data.supabase_id || data.id);
      } catch (e) {
        setUserId(null);
      }
    };
    fetchProfile();
  }, []);

  // Arkadaş listesini ve konuşmaları çek
  useEffect(() => {
    if (!userId) return;
    const fetchFriendsAndConversations = async () => {
      setLoadingConversations(true);
      try {
        // Arkadaşlar
        const profileRes = await fetch(`${API_BASE_URL}/profile/`, {
          headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
        });
        const profile = await profileRes.json();
        const userId = profile.supabase_id || profile.id;
        const friendsRes = await fetch(`${API_BASE_URL}/users/${userId}/friends/`, {
          headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
        });
        const friendsData = await friendsRes.json();
        setFriends(Array.isArray(friendsData) ? friendsData : []);
        // Mesajlar
        const messagesRes = await fetch(`${API_BASE_URL}/messages/`, {
          headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
        });
        const allMessages = await messagesRes.json();
        console.log("ALL MESSAGES:", allMessages);
        // Her arkadaş için son mesajı bul
        const convs = (Array.isArray(friendsData) ? friendsData : []).map(friend => {
          const msgs = allMessages.filter(msg =>
            (msg.sender === userId && msg.receiver === friend.id) ||
            (msg.sender === friend.id && msg.receiver === userId)
          );
          const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
          return {
            friend,
            lastMessage: lastMsg ? lastMsg.message_text : '',
            lastTime: lastMsg ? lastMsg.created_at : '',
          };
        });
        // Son mesaja göre sırala
        convs.sort((a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0));
        setConversations(convs);
      } catch (e) {
        setFriends([]);
        setConversations([]);
      } finally {
        setLoadingConversations(false);
      }
    };
    fetchFriendsAndConversations();
  }, [userId, USER_TOKEN]);

  // Arkadaşlar yüklendiğinde otomatik olarak ilk arkadaşı seç
  useEffect(() => {
    if (friends.length > 0 && !selectedFriend) {
      setSelectedFriend(friends[0]);
      console.log("Otomatik arkadaş seçildi:", friends[0]);
    }
  }, [friends]);

  // Seçili arkadaş değişince mesajları çek
  useEffect(() => {
    if (!selectedFriend || !userId) return;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(`${API_BASE_URL}/messages/`, {
          headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
        });
        if (!res.ok) throw new Error('Mesajlar alınamadı');
        const data = await res.json();
        console.log("GELEN MESAJ DATA:", data);
        console.log("userId:", userId, "selectedFriend.id:", selectedFriend?.id);
        console.log("data:", data);
        const filtered = Array.isArray(data) ? data.filter(msg =>
          String(msg.sender) === String(userId) && String(msg.receiver) === String(selectedFriend.id) ||
          String(msg.sender) === String(selectedFriend.id) && String(msg.receiver) === String(userId)
        ) : [];
        // Tarihe göre artan sırala (en eski en üstte, en yeni en altta)
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setMessages(filtered);
      } catch (e) {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedFriend, userId, USER_TOKEN]);

  // Mesaj gönder
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedFriend) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${USER_TOKEN}`
        },
        body: JSON.stringify({ receiver_id: selectedFriend.id, message_text: messageInput })
      });
      if (!res.ok) throw new Error('Mesaj gönderilemedi');
      const newMsg = await res.json();
      setMessages(prev => {
        const arr = [...prev, newMsg];
        arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        return arr;
      });
      setMessageInput("");
      Keyboard.dismiss();
      setTimeout(() => {
        if (scrollViewRef.current) scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      // Hata gösterilebilir
    } finally {
      setSending(false);
    }
  };

  // Arama filtreli arkadaşlar
  const filteredConversations = conversations.filter(conv =>
    conv.friend.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    conv.friend.email?.toLowerCase().includes(search.toLowerCase())
  );

  // --- Ekranlar ---
  // 1. Mesajlar/Arkadaşlar Listesi
  const renderConversations = () => (
    <SafeAreaView style={[styles.container, Platform.OS === 'android' && { paddingTop: StatusBar.currentHeight || 24 }]}> 
      <View style={styles.headerBarList}>
        <Text style={styles.headerTitle}>Mesajlar</Text>
      </View>
      <View style={styles.searchBarRow}>
        <TextInput
          style={styles.searchBar}
          placeholder="Ara..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loadingConversations ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 30 }} />
      ) : filteredConversations.length === 0 ? (
        <Text style={styles.noFriendsText}>Hiç arkadaşın yok</Text>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={item => item.friend.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.convItem} onPress={() => {
              console.log("Arkadaş seçildi:", item.friend);
              setSelectedFriend(item.friend);
            }}>
              <Image source={{ uri: getSafeAvatarUrl(item.friend.avatar_url) }} style={styles.convAvatar} />
              <View style={styles.convTextCol}>
                <Text style={styles.convName}>{item.friend.nickname || (item.friend.email ? item.friend.email.slice(0, 4) : 'Kullanıcı')}</Text>
                <Text style={styles.convLastMsg} numberOfLines={1}>{item.lastMessage || 'Henüz mesaj yok'}</Text>
              </View>
              <Text style={styles.convTime}>{formatTimeAgo(item.lastTime)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );

  // 2. Chat Ekranı
  const renderChat = () => (
    <SafeAreaView style={[styles.container, Platform.OS === 'android' && { paddingTop: StatusBar.currentHeight || 24 }]}> 
      <View style={styles.headerBarChat}>
        <TouchableOpacity onPress={() => setSelectedFriend(null)} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'}</Text>
        </TouchableOpacity>
        <Image source={{ uri: getSafeAvatarUrl(selectedFriend?.avatar_url) }} style={styles.headerAvatar} />
        <View>
          <Text style={styles.headerName}>{selectedFriend?.nickname || 'Kullanıcı'}</Text>
          {selectedFriend?.email && <Text style={styles.headerEmail}>{selectedFriend.email}</Text>}
        </View>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 10 }}
        onContentSizeChange={() => scrollViewRef.current && scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {loadingMessages ? (
          <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 20 }} />
        ) : messages.length === 0 ? (
          <Text style={styles.noMessagesText}>Henüz mesaj yok</Text>
        ) : (
          messages.map(msg => (
            <View
              key={msg.id}
              style={[styles.messageRow, msg.sender === userId ? styles.sentRow : styles.receivedRow]}
            >
              {msg.sender !== userId && (
                <Image source={{ uri: getSafeAvatarUrl(selectedFriend?.avatar_url) }} style={styles.bubbleAvatar} />
              )}
              <View style={[styles.messageBubble, msg.sender === userId ? styles.sentBubble : styles.receivedBubble]}>
                <Text style={styles.messageText}>{msg.message_text}</Text>
              </View>
              {msg.sender === userId && (
                <Image source={{ uri: getSafeAvatarUrl(null) }} style={styles.bubbleAvatar} />
              )}
            </View>
          ))
        )}
      </ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.messageInput}
            placeholder="Mesaj yaz..."
            value={messageInput}
            onChangeText={setMessageInput}
            editable={!sending && !!selectedFriend}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={sending || !messageInput.trim() || !selectedFriend}>
            <Text style={styles.sendBtnText}>Gönder</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return selectedFriend ? renderChat() : renderConversations();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  // --- Mesajlar Listesi ---
  headerBarList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    minHeight: 64,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563EB',
    flex: 1,
    textAlign: 'left',
  },
  searchBarRow: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#333',
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  convAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  convTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  convName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  convLastMsg: {
    fontSize: 14,
    color: '#666',
  },
  convTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  noFriendsText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 15,
  },
  // --- Chat ---
  headerBarChat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    minHeight: 64,
  },
  backBtn: {
    marginRight: 10,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
  },
  backBtnText: {
    fontSize: 20,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  headerName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  headerEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  messagesList: {
    flex: 1,
    minHeight: 100,
    maxHeight: 500,
  },
  noMessagesText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  sentRow: {
    justifyContent: 'flex-end',
  },
  receivedRow: {
    justifyContent: 'flex-start',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 4,
    backgroundColor: '#e0e0e0',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginHorizontal: 2,
  },
  sentBubble: {
    backgroundColor: '#2563EB',
    borderTopRightRadius: 4,
    marginLeft: 40,
  },
  receivedBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 40,
  },
  messageText: {
    color: '#222',
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#333',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default MessagesScreen; 
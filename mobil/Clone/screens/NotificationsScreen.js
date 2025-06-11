import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { API_BASE_URL } from '@env';

const NOTIF_ICONS = {
  like: '👍',
  comment: '💬',
  message: '✉️',
  friend_request: '🤝',
  roadmap_step: '✅',
};

const defaultAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ddd'/%3E%3Ccircle cx='50' cy='100' r='40' fill='%23ddd'/%3E%3C/svg%3E`;

const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkZWeURXTVdPb1YvMVBNSkwiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2x6cnFpYWJ4ZXBzdnpuaXZ0ZmdkLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiNzNjOGNiMC1iMGUwLTRiNTAtODdjMC02Y2MxYTNjNTJkNzUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ4ODkzODI2LCJpYXQiOjE3NDg4OTAyMjYsImVtYWlsIjoibXVzdGFmYTQ0ZmJmYkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoibXVzdGFmYTQ0ZmJmYkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiNzNjOGNiMC1iMGUwLTRiNTAtODdjMC02Y2MxYTNjNTJkNzUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0ODg5MDIyNn1dLCJzZXNzaW9uX2lkIjoiYTIyZWY4OTUtYzM4Ni00MzYwLTk4MzYtNTM4ZWUzZDE4NGFhIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.d7jJq2oc6kREXDc1_KsL99ZlCPYJREQBBfr_dsyM1-8';

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getSafeAvatarUrl(url) {
  if (!url || typeof url !== 'string' || url.startsWith('data:image/svg+xml') || url.endsWith('.svg')) {
    const randomId = Math.floor(Math.random() * 99) + 1;
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    return `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`;
  }
  return url;
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: { 'Authorization': `Bearer ${USER_TOKEN}` },
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Bildirimler yüklenemedi.');
      setNotifications([]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (notifId) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${notifId}/read/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${USER_TOKEN}` },
      });
      fetchNotifications();
    } catch (e) {}
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  const renderNotif = ({ item }) => (
    <View style={[styles.notifItem, !item.is_read && styles.notifUnread]}> 
      <Text style={styles.notifIcon}>{NOTIF_ICONS[item.type] || '🔔'}</Text>
      <Image source={{ uri: getSafeAvatarUrl(item.actor_avatar_url) }} style={styles.notifAvatar} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.notifActor}>{item.actor_nickname || 'Sistem'}</Text>
          <Text style={styles.notifMsg}>{item.message}</Text>
        </View>
        <Text style={styles.notifTime}>{formatDate(item.created_at)}</Text>
      </View>
      {!item.is_read && (
        <TouchableOpacity style={styles.notifReadBtn} onPress={() => handleMarkRead(item.id)}>
          <Text style={styles.notifReadBtnText}>Okundu</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'android' && { paddingTop: StatusBar.currentHeight || 24 }]}> 
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Bildirimler</Text>
      </View>
      {loading && <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 30 }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={[...unread, ...read]}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={renderNotif}
        contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} tintColor="#2563EB" />}
        ListEmptyComponent={!loading && <Text style={styles.emptyText}>Hiç bildirimin yok.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerBar: {
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
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#2563eb22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  notifUnread: {
    backgroundColor: '#e0e7ff',
    borderColor: '#2563eb',
    borderWidth: 1.2,
  },
  notifIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  notifAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
  },
  notifActor: {
    fontWeight: 'bold',
    color: '#2563eb',
    fontSize: 15,
    marginRight: 6,
  },
  notifMsg: {
    color: '#333',
    fontSize: 15,
    flexShrink: 1,
  },
  notifTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  notifReadBtn: {
    marginLeft: 12,
    backgroundColor: '#22c55e',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  notifReadBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
    fontSize: 14,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 15,
  },
});

export default NotificationsScreen; 
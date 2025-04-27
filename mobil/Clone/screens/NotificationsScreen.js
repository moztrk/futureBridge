// screens/NotificationsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  RefreshControl, // Yenileme için
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // Ekrana odaklanıldığında yenilemek için

// -- Supabase Auth'tan JWT tokenını Alma (Placeholder) --
// GERÇEK UYGULAMADA: Oturum açmış kullanıcının güncel JWT tokenını alacağınız yerdir.
// Context API, Redux veya başka bir kimlik doğrulama yönetimi kullanıyorsanız oradan çekin.
const userToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkZWeURXTVdPb1YvMVBNSkwiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2x6cnFpYWJ4ZXBzdnpuaXZ0ZmdkLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2M2VjOTQ3ZC0zNTczLTRkYjMtYjU4My1kZjA3NGUwYjE4ZTEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ1NzAxMjUxLCJpYXQiOjE3NDU2OTc2NTEsImVtYWlsIjoidGVzdHVzZXJAZXhhbXBsZS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0NTY5NzY1MX1dLCJzZXNzaW9uX2lkIjoiMGNlNWU1OTgtODIwZS00Y2QzLTg4ZjEtOTU4YzRiNTNjOGQxIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.fe_0m6ggUgwfeBNN3XpS3T76wkvtu2xb2mUCYoDi8OQ", "expires_at": 1745701251, "expires_in": 3600, "refresh_token": "niu0HGsXgxzOaNlZ36MCeQ'; // <-- Burayı KENDİ güncel tokenınızla DOLDURUN!

// -- Backend API URL'niz --
const API_BASE_URL = 'http://192.168.182.27:8000/api'; // IP adresinizin doğru olduğundan emin olun

const NotificationsScreen = () => {
  // -- State Değişkenleri --
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh için

  // -- Bekleyen İstekleri Çekme Fonksiyonu --
  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/friendships/pending/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage;
        try {
          const responseData = JSON.parse(responseText);
          errorMessage = responseData?.detail || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = responseText || `HTTP error! status: ${response.status}`;
        }
        console.error("Bekleyen istekleri çekerken backend hatası:", errorMessage);
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      setPendingRequests(Array.isArray(responseData) ? responseData : []);
    } catch (err) {
      console.error("Bekleyen istekleri çekerken Network/Fetch hatası:", err);
      setError(`İstekler yüklenirken bir hata oluştu: ${err.message}`);
      setPendingRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Ekrana odaklanıldığında veriyi çek
  useFocusEffect(
    useCallback(() => {
      fetchPendingRequests();
    }, []) // Bağımlılık dizisi boş, sadece ekran ilk odaklandığında çalışır
  );

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPendingRequests(); // Veriyi tekrar çek
  }, []);

  const handleAcceptRequest = async (friendshipId) => {
    console.log('Accepting friendship request with ID:', friendshipId);

    setPendingRequests(currentRequests =>
        currentRequests.map(request =>
            request.id === friendshipId ? { ...request, requestStatus: 'processing' } : request
        )
    );

    try {
        const response = await fetch(`${API_BASE_URL}/friendships/${friendshipId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({ status: 'accepted' }),
        });

        if (!response.ok) {
            const responseText = await response.text();
            let errorMessage;
            try {
                const responseData = JSON.parse(responseText);
                errorMessage = responseData?.detail || responseData?.non_field_errors?.[0] || `HTTP error! status: ${response.status}`;
            } catch {
                errorMessage = responseText || `HTTP error! status: ${response.status}`;
            }
            console.error("Arkadaşlık isteği kabul edilirken backend hatası:", errorMessage);
            Alert.alert("Hata", `İstek kabul edilemedi: ${errorMessage}`);

            setPendingRequests(currentRequests =>
                currentRequests.map(request =>
                    request.id === friendshipId ? { ...request, requestStatus: 'error', errorMessage: errorMessage } : request
                )
            );
        } else {
            console.log("Arkadaşlık isteği başarıyla kabul edildi:", friendshipId);
            setPendingRequests(currentRequests =>
                currentRequests.filter(request => request.id !== friendshipId)
            );
        }
    } catch (err) {
        console.error("Arkadaşlık isteği kabul edilirken Network/Fetch hatası:", err);
        Alert.alert("Network Hatası", `İstek kabul edilemedi: ${err.message}`);

        setPendingRequests(currentRequests =>
            currentRequests.map(request =>
                request.id === friendshipId ? { ...request, requestStatus: 'networkError', errorMessage: err.message } : request
            )
        );
    }
};

const handleRejectRequest = async (friendshipId) => {
    console.log('Rejecting friendship request with ID:', friendshipId);

    setPendingRequests(currentRequests =>
        currentRequests.map(request =>
            request.id === friendshipId ? { ...request, requestStatus: 'processing' } : request
        )
    );

    try {
        const response = await fetch(`${API_BASE_URL}/friendships/${friendshipId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({ status: 'rejected' }),
        });

        if (!response.ok) {
            const responseText = await response.text();
            let errorMessage;
            try {
                const responseData = JSON.parse(responseText);
                errorMessage = responseData?.detail || responseData?.non_field_errors?.[0] || `HTTP error! status: ${response.status}`;
            } catch {
                errorMessage = responseText || `HTTP error! status: ${response.status}`;
            }
            console.error("Arkadaşlık isteği reddedilirken backend hatası:", errorMessage);
            Alert.alert("Hata", `İstek reddedilemedi: ${errorMessage}`);

            setPendingRequests(currentRequests =>
                currentRequests.map(request =>
                    request.id === friendshipId ? { ...request, requestStatus: 'error', errorMessage: errorMessage } : request
                )
            );
        } else {
            console.log("Arkadaşlık isteği başarıyla reddedildi:", friendshipId);
            setPendingRequests(currentRequests =>
                currentRequests.filter(request => request.id !== friendshipId)
            );
        }
    } catch (err) {
        console.error("Arkadaşlık isteği reddedilirken Network/Fetch hatası:", err);
        Alert.alert("Network Hatası", `İstek reddedilemedi: ${err.message}`);

        setPendingRequests(currentRequests =>
            currentRequests.map(request =>
                request.id === friendshipId ? { ...request, requestStatus: 'networkError', errorMessage: err.message } : request
            )
        );
    }
};

  // Her bir bekleyen isteği render eden component
  const renderRequestItem = ({ item }) => {
    const senderNickname = item.sender_nickname || 'Bilinmeyen Kullanıcı';
    const senderAvatar = item.sender?.avatar_url || 'https://via.placeholder.com/40/cccccc/FFFFFF?text=?';

    return (
      <View style={styles.requestItem}>
        <Image
          source={{ uri: senderAvatar }}
          style={styles.requestAvatar}
        />
        <View style={styles.requestInfo}>
          <Text style={styles.requestText}>
            <Text style={{ fontWeight: 'bold' }}>{senderNickname}</Text> size arkadaşlık isteği gönderdi.
          </Text>
        </View>
        <View style={styles.requestButtons}>
          <TouchableOpacity
            style={[styles.requestButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(item.id)} // Ensure item.id exists
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.buttonText}>Kabul</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestButton, styles.rejectButton]}
            onPress={() => handleRejectRequest(item.id)} // Ensure item.id exists
          >
            <Ionicons name="close" size={18} color="#fff" />
            <Text style={styles.buttonText}>Reddet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#fff"
        barStyle="dark-content"
        translucent={false}
      />
      <View style={[styles.header, Platform.OS === 'android' && styles.androidHeader]}>
        <Text style={styles.headerTitle}>Bildirimler</Text>
      </View>

      {loading && !refreshing && <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 30 }} />}
      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {!loading && !error && pendingRequests.length > 0 && (
        <FlatList
          data={pendingRequests}
          renderItem={renderRequestItem}
          keyExtractor={item => item.id?.toString() || Math.random().toString()} // Ensure unique key
          contentContainerStyle={{ paddingVertical: 10 }}
          refreshControl={ // Pull-to-refresh ekleme
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563EB"]} // Android için yenileme indikatör rengi
              tintColor="#2563EB" // iOS için yenileme indikatör rengi
            />
          }
        />
      )}

      {!loading && !error && pendingRequests.length === 0 && (
        <Text style={styles.noRequestsText}>Bekleyen arkadaşlık isteğiniz bulunmamaktadır.</Text>
      )}
    </SafeAreaView>
  );
};

// --- Stil Tanımlamaları ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center', // Başlığı ortala
  },
  androidHeader: {
    // Android spesifik stil gerekiyorsa
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  requestInfo: {
    flex: 1, // Butonların sağa yaslanması için
    justifyContent: 'center',
  },
  requestText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  requestButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10, // Bilgi ile butonlar arası boşluk
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginLeft: 8, // Butonlar arası boşluk
  },
  acceptButton: {
    backgroundColor: '#22C55E', // Yeşil tonu
  },
  rejectButton: {
    backgroundColor: '#EF4444', // Kırmızı tonu
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4, // İkon ile metin arası boşluk
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
    fontSize: 14,
  },
  noRequestsText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#666',
    paddingHorizontal: 20,
    fontSize: 14,
  },
});

export default NotificationsScreen;
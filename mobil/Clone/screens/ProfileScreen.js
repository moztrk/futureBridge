import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '@env';

const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkZWeURXTVdPb1YvMVBNSkwiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2x6cnFpYWJ4ZXBzdnpuaXZ0ZmdkLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiNzNjOGNiMC1iMGUwLTRiNTAtODdjMC02Y2MxYTNjNTJkNzUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ4ODkzODI2LCJpYXQiOjE3NDg4OTAyMjYsImVtYWlsIjoibXVzdGFmYTQ0ZmJmYkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoibXVzdGFmYTQ0ZmJmYkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiNzNjOGNiMC1iMGUwLTRiNTAtODdjMC02Y2MxYTNjNTJkNzUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0ODg5MDIyNn1dLCJzZXNzaW9uX2lkIjoiYTIyZWY4OTUtYzM4Ni00MzYwLTk4MzYtNTM4ZWUzZDE4NGFhIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.d7jJq2oc6kREXDc1_KsL99ZlCPYJREQBBfr_dsyM1-8';

function getSafeAvatarUrl(url) {
  if (!url || typeof url !== 'string' || url.startsWith('data:image/svg+xml') || url.endsWith('.svg')) {
    const randomId = Math.floor(Math.random() * 99) + 1;
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    return `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`;
  }
  return url;
}

const ProfileScreen = (props) => {
  const [userProfile, setUserProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFriendsModalVisible, setIsFriendsModalVisible] = useState(false);

  const userToken = USER_TOKEN;

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);

    let profileData = null;
    try {
      const profileResponse = await fetch(`${API_BASE_URL}/profile/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        throw new Error(errorText || `HTTP error fetching profile! status: ${profileResponse.status}`);
      }
      profileData = await profileResponse.json();
      setUserProfile(profileData);
    } catch (err) {
      console.error("Profil bilgileri çekerken hata:", err);
      setError(`Profil bilgileri yüklenirken bir hata oluştu: ${err.message}`);
      setLoading(false);
      return;
    }

    const friendsListUserId = profileData?.supabase_id;
    if (!friendsListUserId) {
      setFriends([]);
      setLoading(false);
      return;
    }

    try {
      const friendsResponse = await fetch(`${API_BASE_URL}/users/${friendsListUserId}/friends/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (!friendsResponse.ok) {
        const errorText = await friendsResponse.text();
        throw new Error(errorText || `HTTP error fetching friends! status: ${friendsResponse.status}`);
      }
      const friendsData = await friendsResponse.json();
      setFriends(Array.isArray(friendsData) ? friendsData : []);
    } catch (err) {
      console.error("Arkadaş listesi çekerken hata:", err);
      Alert.alert("Uyarı", `Arkadaş listesi yüklenirken bir sorun oluştu: ${err.message}`);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [userToken, props.YOUR_OWN_USER_ID])
  );

  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <Image
        source={{ uri: getSafeAvatarUrl(item.avatar_url) }}
        style={styles.friendAvatar}
      />
      <Text style={styles.friendNickname}>{item.nickname || 'İsimsiz Arkadaş'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10 }}>Profil bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Hata oluştu</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const defaultProfilePic = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%23ddd'/%3E%3Ccircle cx='50' cy='100' r='40' fill='%23ddd'/%3E%3C/svg%3E`;

  const formatDate = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.warn('Tarih formatlama hatası:', e);
      return dateString;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <StatusBar
        backgroundColor="#2563EB"
        barStyle="light-content"
        translucent={false}
      />
      <ScrollView style={styles.profilePageContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: getSafeAvatarUrl(userProfile?.avatar_url) }}
            style={styles.profilePicture}
            onError={(e) => console.log('Profil resmi yüklenirken hata:', e.nativeEvent.error)}
          />
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileNickname}>
            {userProfile?.nickname || 'Kullanıcı Adı Yok'}
          </Text>

          {userProfile?.profession && (
            <Text style={styles.profileProfession}>{userProfile.profession}</Text>
          )}

          {friends !== null && (
            <TouchableOpacity onPress={() => setIsFriendsModalVisible(true)} style={styles.friendsCountContainer}>
              <Text style={styles.friendsCountText}>{friends.length}</Text>
              <Text style={styles.friendsLabelText}>Arkadaş</Text>
            </TouchableOpacity>
          )}

          <View style={styles.profileMeta}>
            {userProfile?.email && (
              <Text style={styles.profileMetaText}>
                <Text style={{ fontWeight: 'bold' }}>E-posta:</Text> {userProfile.email}
              </Text>
            )}
            {userProfile?.supabase_id && (
              <Text style={styles.profileMetaText}>
                <Text style={{ fontWeight: 'bold' }}>ID:</Text> {userProfile.supabase_id}
              </Text>
            )}
            {userProfile?.created_at && (
              <Text style={styles.profileMetaText}>
                <Text style={{ fontWeight: 'bold' }}>Katılım Tarihi:</Text> {formatDate(userProfile.created_at)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.profileContent}>
          <Text style={styles.contentTitle}>Aktiviteler</Text>
          <View style={styles.activityPlaceholder}>
            <Text>Henüz aktivite bulunmamaktadır</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isFriendsModalVisible}
        onRequestClose={() => {
          setIsFriendsModalVisible(!isFriendsModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Arkadaşlarım ({friends.length})</Text>

            {friends.length > 0 ? (
              <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.friendList}
              />
            ) : (
              <Text>Henüz kabul edilmiş arkadaşınız yok.</Text>
            )}

            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setIsFriendsModalVisible(!isFriendsModalVisible)}
            >
              <Text style={styles.textStyle}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  profilePageContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  errorText: {
    color: '#666',
    textAlign: 'center',
  },
  profileHeader: {
    backgroundColor: '#2563EB',
    height: 180,
    marginBottom: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  profilePicture: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    marginBottom: -55,
    backgroundColor: '#e0e0e0',
  },
  profileInfo: {
    padding: 20,
    alignItems: 'center',
    marginTop: 60,
    paddingBottom: 10,
  },
  profileNickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  profileProfession: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 15,
    textAlign: 'center',
  },
  friendsCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  friendsCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 5,
  },
  friendsLabelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  profileMeta: {
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  profileMetaText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  profileContent: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 0,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  activityPlaceholder: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },

  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: "center"
  },
  friendList: {
    width: '100%',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
    backgroundColor: '#e0e0e0',
  },
  friendNickname: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    minWidth: 100,
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
});

export default ProfileScreen; 
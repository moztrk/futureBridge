// screens/ProfileScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity, // Tıklanabilir alanlar için
  FlatList, // Arkadaş listesi için
  Modal, // Arkadaş listesi modalı için
  Pressable, // Modal kapatma için
  SafeAreaView, // Güvenli alan için
  StatusBar, // Status bar
  Platform, // Platform kontrolü
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // Ekrana odaklanıldığında yenilemek için
// import { useNavigation, useRoute } from '@react-navigation/native'; // Eğer navigasyon veya route parametresi kullanacaksanız

// -- Supabase Auth'tan JWT tokenını ve Kullanıcı ID'sini Alma (Placeholder) --
// GERÇEK UYGULAMADA: Burası, oturum açmış kullanıcının güncel JWT tokenını ve KENDİ UUID'sini alacağınız yerdir.
// Context API, Redux veya başka bir kimlik doğrulama yönetimi kullanıyorsanız oradan çekin.
// Şimdilik test için buraya elle bir token ve kendi kullanıcı ID'nizi yazacaksınız.
// ProfileScreen genellikle oturum açmış kullanıcının kendi profilini gösterir,
// bu yüzden YOUR_OWN_USER_ID login olan kullanıcının ID'si olmalı.
// userToken da aynı şekilde login olan kullanıcının tokenı olmalı.
const userToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkZWeURXTVdPb1YvMVBNSkwiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2x6cnFpYWJ4ZXBzdnpuaXZ0ZmdkLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2M2VjOTQ3ZC0zNTczLTRkYjMtYjU4My1kZjA3NGUwYjE4ZTEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ1NzAxOTk1LCJpYXQiOjE3NDU2OTgzOTUsImVtYWlsIjoidGVzdHVzZXJAZXhhbXBsZS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0NTY5ODM5NX1dLCJzZXNzaW9uX2lkIjoiYzU5MGQ0MGEtYzJjMi00OGU1LWJlMWMtNTAxY2E4ZTc3ODVlIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.4D56e6HkJrKVJGOk98ps549ZTZx_pqUvXPYKHiXzzWQ'; // <-- Burayı GÜNCEL login olan kullanıcının tokenıyla DOLDURUN!
const YOUR_OWN_USER_ID = '63ec947d-3573-4db3-b583-df074e0b18e1'; // <-- Burayı GÜNCEL login olan kullanıcının Supabase UUID'siyle DOLDURUN!


// -- Backend API URL'niz --
const API_BASE_URL = 'http://192.168.182.27:8000/api'; // IP adresinizin doğru olduğundan emin olun


// Eğer başka bir kullanıcının profilini göstermek istiyorsanız,
// route.params'tan ID alabilirsiniz. Şimdilik login olan kullanıcının profilini göstereceğiz.
// const ProfileScreen = ({ route }) => { // route parametresini alabilirsiniz
//   const { userId: profileUserId } = route.params || {}; // Eğer parametre varsa onu kullan

const ProfileScreen = () => {
  // const navigation = useNavigation();
  // const route = useRoute();
  // const { userId: profileUserId } = route.params || {}; // Eğer başka bir kullanıcının profilini gösterecekseniz


  // -- State Değişkenleri --
  const [userProfile, setUserProfile] = useState(null);
  const [friends, setFriends] = useState([]); // Arkadaş listesi için state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFriendsModalVisible, setIsFriendsModalVisible] = useState(false); // Modal görünürlüğü


  // -- Profil ve Arkadaş Listesini Çekme Fonksiyonu --
  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);

    // Gösterilecek kullanıcının ID'si (Şimdilik login olan kullanıcı)
    // const targetUserId = profileUserId || YOUR_OWN_USER_ID; // Eğer route.params kullanıyorsanız


    // --- Profil Bilgilerini Çekme (/api/profile/) ---
    try {
      const profileResponse = await fetch(`${API_BASE_URL}/profile/`, { // <-- Login olan kullanıcının profili
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // <-- Login olan kullanıcının tokenı
        },
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        throw new Error(errorText || `HTTP error fetching profile! status: ${profileResponse.status}`);
      }
      const profileData = await profileResponse.json();
      setUserProfile(profileData);
    } catch (err) {
      console.error("Profil bilgileri çekerken hata:", err);
      setError(`Profil bilgileri yüklenirken bir hata oluştu: ${err.message}`);
      setLoading(false); // Profil yüklenemezse arkadaş listesini de yüklemeye çalışma
      return; // Hata durumunda buradan çık
    }


    // --- Arkadaş Listesini Çekme (/api/users/{user_uuid}/friends/) ---
    // Profil bilgileri başarıyla çekildiyse veya targetUserId belliyse devam et
    // Login olan kullanıcının kendi arkadaş listesini çekeceğiz.
    const friendsListUserId = userProfile?.supabase_id || YOUR_OWN_USER_ID; // Eğer profil çekildiyse onun UUID'sini kullan


    try {
      const friendsResponse = await fetch(`${API_BASE_URL}/users/${friendsListUserId}/friends/`, { // <-- Yeni endpoint
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // <-- Login olan kullanıcının tokenı
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
      // Arkadaş listesi çekilemezse bile profili göstermeye devam edebiliriz
      Alert.alert("Uyarı", `Arkadaş listesi yüklenirken bir sorun oluştu: ${err.message}`);
      setFriends([]); // Hata olsa bile listeyi boş olarak ayarla
    } finally {
      setLoading(false);
    }
  };

  // Ekrana odaklanıldığında veriyi çek
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [userToken, YOUR_OWN_USER_ID]) // Token veya ID değişirse yeniden çek (placeholder için)
  );

  // --- Arkadaş Listesi Modal Rendering ---
  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <Image
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/40/cccccc/FFFFFF?text=?' }}
        style={styles.friendAvatar}
      />
      <Text style={styles.friendNickname}>{item.nickname || 'İsimsiz Arkadaş'}</Text>
      {/* İsteğe bağlı: Arkadaşın profiline gitmek için buton */}
      {/* <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.id })}>
        <Text>Profili Gör</Text>
      </TouchableOpacity> */}
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
        {/* Yeniden deneme butonu eklenebilir */}
      </View>
    );
  }

  // Profil bilgileri yüklendikten sonra
  const defaultProfilePic = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?Text=No+Image';

  const formatDate = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    try {
      // Backend'den gelen ISO stringini Date objesine çevir
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
        backgroundColor="#2563EB" // Kapak fotoğrafı rengiyle uyumlu
        barStyle="light-content" // Açık renk ikonlar
        translucent={false}
      />
      <ScrollView style={styles.profilePageContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          {/* Kapak fotoğrafı buraya gelebilir */}
          <Image
            source={{ uri: userProfile?.avatar_url || defaultProfilePic }} // avatar_url kullanıyoruz
            style={styles.profilePicture}
            onError={(e) => console.log('Profil resmi yüklenirken hata:', e.nativeEvent.error)}
          />
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileNickname}>
            {userProfile?.nickname || 'Kullanıcı Adı Yok'} {/* nickname kullanıyoruz */}
          </Text>

          {userProfile?.profession && ( // Meslek varsa göster
            <Text style={styles.profileProfession}>{userProfile.profession}</Text>
          )}

          {/* Arkadaş Sayısı */}
          {friends !== null && ( // Friends state'i null değilse (yükleme bitmişse)
            <TouchableOpacity onPress={() => setIsFriendsModalVisible(true)} style={styles.friendsCountContainer}>
              <Text style={styles.friendsCountText}>{friends.length}</Text>
              <Text style={styles.friendsLabelText}>Arkadaş</Text>
            </TouchableOpacity>
          )}


          <View style={styles.profileMeta}>
            {userProfile?.email && ( // Email varsa göster
              <Text style={styles.profileMetaText}>
                <Text style={{ fontWeight: 'bold' }}>E-posta:</Text> {userProfile.email}
              </Text>
            )}
            {userProfile?.supabase_id && ( // Supabase ID varsa göster
              <Text style={styles.profileMetaText}>
                <Text style={{ fontWeight: 'bold' }}>ID:</Text> {userProfile.supabase_id} {/* supabase_id kullanıyoruz */}
              </Text>
            )}
            {userProfile?.created_at && ( // Katılım tarihi varsa göster
              <Text style={styles.profileMetaText}>
                <Text style={{ fontWeight: 'bold' }}>Katılım Tarihi:</Text> {formatDate(userProfile.created_at)}
              </Text>
            )}
          </View>
      </View>

      {/* Aktivite/Gönderi Alanı */}
      <View style={styles.profileContent}>
        <Text style={styles.contentTitle}>Aktiviteler</Text>
        <View style={styles.activityPlaceholder}>
          <Text>Henüz aktivite bulunmamaktadır</Text>
        </View>
      </View>
      {/* ScrollView sonuna boşluk */}
      <View style={{ height: 20 }} />
    </ScrollView>


    {/* Arkadaş Listesi Modal'ı */}
    <Modal
      animationType="slide" // Aşağıdan yukarı kayarak gelsin
      transparent={true} // Arka planı saydam yap
      visible={isFriendsModalVisible} // State'e bağlı olarak görünürlük
      onRequestClose={() => { // Android'de geri tuşu ile kapatma
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
              keyExtractor={item => item.id?.toString() || Math.random().toString()} // friend item'ın ID'sini kullan
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.friendList}
            />
          ) : (
            <Text>Henüz kabul edilmiş arkadaşınız yok.</Text>
          )}


          <Pressable // Modalı kapatma butonu veya alanı
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
    backgroundColor: '#F3F4F6', // Arka plan rengiyle uyumlu
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F3F4F6', // Arka plan rengiyle uyumlu
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  errorText: {
    color: '#666', // Daha soluk hata metni
    textAlign: 'center',
  },
  profileHeader: {
    backgroundColor: '#2563EB', // Mavi başlık bandı
    height: 180, // Yüksekliği biraz azalttım
    marginBottom: 60, // Avatar için boşluk
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    justifyContent: 'flex-end', // Avatarı alta hizala
    paddingBottom: 0, // Avatarın tam altına gelmesi için
  },
  // profileCover: { // Kapak fotoğrafı stilini kaldırdım, Image component'i kullanabiliriz
  //   ...StyleSheet.absoluteFillObject,
  //   backgroundColor: 'rgba(0,0,0,0.1)',
  // },
  profilePicture: {
    width: 110, // Biraz küçülttüm
    height: 110,
    borderRadius: 55, // Tam yuvarlak
    borderWidth: 4, // Kenarlık kalınlığını azalttım
    borderColor: '#FFFFFF',
    marginBottom: -55, // Avatarın kapak fotoğrafının altına kayması için
    backgroundColor: '#e0e0e0', // Placeholder renk
  },
  profileInfo: {
    padding: 20,
    alignItems: 'center',
    marginTop: 60, // Avatar boşluğunu telafi etmek için
    // borderBottomWidth: 1, // Genel info altında border olmasın
    // borderBottomColor: '#eee',
    paddingBottom: 10, // Meta bilgisi için boşluk
  },
  profileNickname: { // Kullanıcı adı stili
    fontSize: 24, // Biraz büyüttüm
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5, // Meslek veya meta bilgisi için boşluk
    textAlign: 'center',
  },
  profileProfession: { // Meslek stili
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 15, // Arkadaş sayısı veya meta bilgisi için boşluk
    textAlign: 'center',
  },
  // profileBio: { // Bio stili (varsa)
  //   fontSize: 16,
  //   color: '#6B7280',
  //   marginBottom: 15,
  //   textAlign: 'center',
  //   maxWidth: 600,
  // },
  friendsCountContainer: { // Arkadaş sayısı alanı
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
  profileMeta: { // Meta bilgileri (email, ID, tarih)
    marginTop: 10,
    alignItems: 'center',
    width: '100%', // Ortalamak için
    paddingHorizontal: 20,
    borderTopWidth: 1, // Üstüne ince çizgi
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  profileMetaText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8, // Satırlar arası boşluk
  },
  profileContent: { // Aktivite/Gönderi bölümü
    padding: 20,
    // alignItems: 'center', // İçeriği ortaya alma
    borderTopWidth: 1, // Üstüne ince çizgi
    borderTopColor: '#eee',
    marginTop: 0, // Meta bölümü ile bitişik
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
    alignItems: 'center', // Placeholder metni ortaya
  },


  // --- Modal Stilleri ---
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)', // Yarı saydam arka plan
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
    width: '90%', // Ekranın genişliğinin %90'ı
    maxHeight: '70%', // Ekranın yüksekliğinin %70'i
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: "center"
  },
  friendList: {
    width: '100%', // FlatList içeriği modal genişliğini alsın
    // paddingBottom: 10, // Kapat butonu için boşluk
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
    // justifyContent: 'space-between', // İsim ve buton arası boşluk (buton eklenirse)
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
    flex: 1, // Kalan alanı kapla
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15, // Liste ile buton arası boşluk
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
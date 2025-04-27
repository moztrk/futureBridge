// screens/FeedScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList, // Gönderi listesi için
  ActivityIndicator,
  Alert,
  Image, // Avatar ve potansiyel gönderi resimleri için
  RefreshControl, // Pull-to-refresh
  StatusBar,
  Platform,
  TextInput, // Yeni gönderi girişi için
  TouchableOpacity, // Yeni gönderi paylaş butonu ve FAB için
  KeyboardAvoidingView, // Klavye açıldığında input'u yukarı kaydırmak için
  ScrollView, // Eğer KeyboardAvoidingView ile kullanılıyorsa
  Modal, // Yeni gönderi modalı için
  Pressable, // Modal kapatma veya arka plana tıklama için
  Dimensions, // Ekran boyutunu almak için (modal boyutu ayarlarken işe yarar)
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Ekran yüksekliğini alalım, KeyboardAvoidingView için offset hesaplarken işe yarar
const windowHeight = Dimensions.get('window').height;

// -- Supabase Auth'tan JWT tokenını Alma (Placeholder) --
// GERÇEK UYGULAMADA: Oturum açmış kullanıcının güncel JWT tokenını alacağınız yerdir.
// Context API, Redux veya başka bir kimlik doğrulama yönetimi kullanıyorsanız oradan çekin.
const userToken = 'EYJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cnFpYWJ4ZXBzdnpuaXZ0ZmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM5Nzc3NDQsImV4cCI6MTcyMjYxNzc0NH0.e_1eJ5oO_aI7Z8l0353K0g8JvB8N_t51f4S_m5_y_8M'; // <-- Burayı GÜNCEL login olan kullanıcının tokenıyla DOLDURUN!


// -- Backend API URL'niz --
const API_BASE_URL = 'http://192.168.182.27:8000/api'; // IP adresinizin doğru olduğundan emin olun


const FeedScreen = () => {
  // -- State Değişkenleri --
  const [posts, setPosts] = useState([]); // Gönderiler için state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh
  const [newPostContent, setNewPostContent] = useState(''); // Yeni gönderi içeriği state'i
  const [isPosting, setIsPosting] = useState(false); // Gönderi paylaşma işlemi devam ediyor mu?
  const [isCreatePostModalVisible, setIsCreatePostModalVisible] = useState(false); // Yeni gönderi modalı görünürlüğü


  // -- Gönderileri Çekme Fonksiyonu --
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!userToken) {
        // Eğer token yoksa fetch yapma ve hata göster
        setError("Kimlik doğrulama tokenı bulunamadı. Lütfen giriş yapın.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/posts/`, { // <-- Gönderi listeleme endpointi
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // <-- Tokenı ekle
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
        console.error("Gönderileri çekerken backend hatası:", errorMessage);
        // 401 hatası durumunda oturum süresinin dolduğu uyarısı verilebilir
        if (response.status === 401) {
          Alert.alert("Oturum Süresi Doldu", "Lütfen tekrar giriş yapın.");
          // Burada navigasyonu login ekranına yönlendirme kodu eklenebilir (örneğin useNavigation hook'u ile)
          // navigation.navigate('Login');
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      // Gönderileri oluşturulma tarihine göre yeniden sırala (backendden zaten sıralı gelmeli ama emin olalım)
      const sortedPosts = Array.isArray(responseData)
        ? responseData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        : [];
      setPosts(sortedPosts);
    } catch (err) {
      console.error("Gönderileri çekerken Network/Fetch hatası:", err);
      setError(`Gönderiler yüklenirken bir hata oluştu: ${err.message}`);
      setPosts([]); // Hata durumunda listeyi temizle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // -- Yeni Gönderi Paylaşma Fonksiyonu --
  const handlePostSubmit = async () => {
    if (!newPostContent.trim()) {
      Alert.alert("Uyarı", "Lütfen bir gönderi içeriği girin.");
      return;
    }

    if (!userToken) {
      Alert.alert("Hata", "Paylaşım yapmak için giriş yapmalısınız.");
      // Burada navigasyonu login ekranına yönlendirme kodu eklenebilir
      // navigation.navigate('Login');
      return;
    }

    setIsPosting(true); // Paylaşım sürecini başlat
    try {
      const response = await fetch(`${API_BASE_URL}/posts/`, { // <-- Gönderi oluşturma endpointi
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // <-- Tokenı ekle
        },
        body: JSON.stringify({ content: newPostContent }), // <-- Gönderi içeriğini body'e ekle
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage;
        try {
          const responseData = JSON.parse(responseText);
          errorMessage = responseData?.detail || responseData?.content?.[0] || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = responseText || `HTTP error! status: ${response.status}`;
        }
        console.error("Gönderi paylaşılırken backend hatası:", errorMessage);
        Alert.alert("Paylaşım Hatası", `Gönderi paylaşılırken bir hata oluştu: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const newPost = await response.json();
      console.log("Gönderi başarıyla paylaşıldı:", newPost);

      // Paylaşımdan sonra listeyi yenilemek yerine, yeni gönderiyi listenin başına ekleyelim
      setPosts(currentPosts => [newPost, ...currentPosts]);
      setNewPostContent(''); // Input alanını temizle
      setIsCreatePostModalVisible(false); // Modalı kapat
      Alert.alert("Başarılı", "Gönderiniz paylaşıldı!");

    } catch (err) {
      console.error("Gönderi paylaşılırken Network/Fetch hatası:", err);
      Alert.alert("Network Hatası", `Gönderi paylaşılırken bir hata oluştu: ${err.message}`);
    } finally {
      setIsPosting(false); // Paylaşım sürecini sonlandır
    }
  };


  // Ekrana odaklanıldığında gönderileri çek
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [userToken]) // Token değişirse yeniden çek (placeholder için)
  );

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts(); // Gönderileri tekrar çek
  }, [userToken]);


  // --- Gönderi Listesi Rendering ---
  const renderPostItem = ({ item }) => {
    const defaultAvatar = 'https://via.placeholder.com/40/cccccc/FFFFFF?text=?'; // Placeholder avatar

    // Backend'den gelen ISO 8601 formatındaki tarihi daha okunur hale getirme
    const formatPostDate = (dateString) => {
      if (!dateString) return 'Bilinmiyor';
      try {
        const date = new Date(dateString);
        // İsteğe bağlı: Farklı formatlar kullanabilirsiniz (örn. 'tr-TR')
        return date.toLocaleString('tr-TR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (e) {
        console.warn('Gönderi tarih formatlama hatası:', e);
        return dateString;
      }
    };


    return (
      <View style={styles.postItem}>
        {/* Yazar Bilgileri */}
        <View style={styles.postHeader}>
          <Image
            source={{ uri: item.author_avatar_url || defaultAvatar }}
            style={styles.postAvatar}
            onError={(e) => console.log('Gönderi avatar yüklenirken hata:', e.nativeEvent.error)}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorNickname}>{item.author_nickname || 'İsimsiz Kullanıcı'}</Text>
            <Text style={styles.postDate}>{formatPostDate(item.created_at)}</Text>
          </View>
          {/* İsteğe bağlı: Gönderi seçenekleri (sil, düzenle) */}
          {/* <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity> */}
        </View>

        {/* Gönderi İçeriği */}
        <Text style={styles.postContent}>{item.content}</Text>

        {/* İsteğe bağlı: Resim alanı */}
        {/* {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.postImage} resizeMode="cover" />
        )} */}

        {/* İsteğe bağlı: Etkileşim butonları (Beğen, Yorum Yap) */}
        {/* <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={20} color="#666" />
            <Text style={styles.actionText}>Beğen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.actionText}>Yorum Yap</Text>
          </TouchableOpacity>
        </View> */}
      </View>
    );
  };

  // --- Ana Render Metodu ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#fff" // Beyaz status bar
        barStyle="dark-content" // Koyu ikonlar
        translucent={false}
      />
      <View style={[styles.header, Platform.OS === 'android' && styles.androidHeader]}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      {/* Yeni Gönderi Oluşturma Alanı (İsteğe bağlı: Bunu ayrı bir component yapıp modalda gösterebiliriz) */}
      {/* Şimdilik FAB ile modal açılacak */}


      {loading && !refreshing && <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 30 }} />}
      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {!loading && !error && posts.length > 0 && (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id?.toString() || Math.random().toString()} // Gönderi ID'sini key olarak kullan
          contentContainerStyle={{ paddingVertical: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={ // Pull-to-refresh ekleme
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563EB"]}
              tintColor="#2563EB"
            />
          }
        />
      )}

      {!loading && !error && posts.length === 0 && (
        <Text style={styles.noPostsText}>Henüz gönderi bulunmamaktadır.</Text>
      )}

      {/* FAB (Floating Action Button) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreatePostModalVisible(true)} // Modalı aç
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>


      {/* Yeni Gönderi Oluşturma Modalı */}
      <Modal
        animationType="slide" // Aşağıdan yukarı gelsin
        transparent={true} // Arka plan saydam
        visible={isCreatePostModalVisible} // State'e bağlı
        onRequestClose={() => { // Android geri tuşu
          setIsCreatePostModalVisible(!isCreatePostModalVisible);
          setNewPostContent(''); // Modalı kapatırken inputu temizle
        }}
      >
        <KeyboardAvoidingView // Klavye açıldığında içeriği yukarı kaydır
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // İhtiyaca göre ayarla
        >
          {/* Modalı kapatmak için arka plana tıklama alanı */}
          <Pressable style={styles.modalOverlay} onPress={() => {
            setIsCreatePostModalVisible(false);
            setNewPostContent('');
          }} />

          <View style={styles.createPostModalView}>
            <Text style={styles.createPostModalTitle}>Yeni Gönderi Oluştur</Text>

            <TextInput
              style={styles.postInput}
              placeholder="Ne düşünüyorsun?"
              multiline={true} // Birden fazla satır girişi için
              value={newPostContent}
              onChangeText={setNewPostContent}
              maxHeight={windowHeight * 0.3} // Input alanının maksimum yüksekliği (Ekranın %30'u gibi)
            />

            {/* Medya Ekleme Alanı (Şimdilik placeholder) */}
            {/* <TouchableOpacity style={styles.addMediaButton}>
              <Ionicons name="image-outline" size={24} color="#2563EB" />
              <Text style={styles.addMediaText}>Fotoğraf/Video Ekle</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[styles.shareButton, isPosting && styles.shareButtonDisabled]}
              onPress={handlePostSubmit}
              disabled={isPosting} // Paylaşım sürerken butonu devre dışı bırak
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.shareButtonText}>Paylaş</Text>
              )}
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>


    </SafeAreaView>
  );
};

// --- Stil Tanımlamaları ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Arka plan rengi
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center', // Başlığı ortala
    justifyContent: 'center',
  },
  androidHeader: {
    // Android spesifik stil gerekiyorsa
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
    fontSize: 14,
  },
  noPostsText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#666',
    paddingHorizontal: 20,
    fontSize: 14,
  },

  // --- Gönderi Item Stilleri ---
  postItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8, // Gönderiler arası boşluk
    // iOS ve Android için gölge eklenebilir
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: 10, // Kenarlardan boşluk
    borderRadius: 8, // Hafif yuvarlak köşeler
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  authorInfo: {
    flex: 1, // Kalan alanı kapla
    justifyContent: 'center',
  },
  authorNickname: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22, // Okunurluk için satır yüksekliği
    marginBottom: 10,
  },
  // postImage: { // Eğer resim alanı eklenirse
  //   width: '100%',
  //   height: 200, // Sabit yükseklik veya orana göre ayarlanabilir
  //   borderRadius: 8,
  //   marginBottom: 10,
  // },
  // postActions: { // Etkileşim butonları eklenirse
  //   flexDirection: 'row',
  //   borderTopWidth: 1,
  //   borderTopColor: '#eee',
  //   paddingTop: 10,
  // },
  // actionButton: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginRight: 20,
  // },
  // actionText: {
  //   marginLeft: 5,
  //   color: '#666',
  //   fontWeight: 'bold',
  // },

  // --- FAB Stili ---
  fab: {
    position: 'absolute', // Sabit pozisyon
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20, // Sağ kenardan 20px
    bottom: 20, // Alt kenardan 20px (Bottom Tab Navigator varsa bunun üzerine denk gelmeli)
    backgroundColor: '#2563EB', // Mavi renk
    borderRadius: 30, // Tam yuvarlak
    elevation: 8, // Android'de gölge
    shadowColor: '#000', // iOS'ta gölge
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // --- Yeni Gönderi Modalı Stilleri ---
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end', // İçeriği alta yasla
    // alignItems: 'center', // Yatayda ortala
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Yarı saydam arka plan
  },
  modalOverlay: { // Modalı kapatmak için arka plana tıklama alanı
    flex: 1,
    // Eğer sadece alt View'a tıklayınca kapanmasını isterseniz burayı kaldırın
  },
  createPostModalView: {
    backgroundColor: "white",
    borderTopLeftRadius: 20, // Üst köşeleri yuvarlak
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%', // Tam genişlik
    // alignItems: "center", // İçeriği ortalama (sol/sağ yaslı kalsın)
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  createPostModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: "center" // Başlığı ortaya al
  },
  postInput: {
    width: '100%',
    minHeight: 100, // Minimum yükseklik
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlignVertical: 'top', // Yazıyı üstten başlat
    marginBottom: 15,
  },
  // addMediaButton: { // Medya ekleme butonu stilleri
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   paddingVertical: 10,
  //   marginBottom: 15,
  // },
  // addMediaText: {
  //   marginLeft: 5,
  //   fontSize: 16,
  //   color: '#2563EB',
  // },
  shareButton: {
    backgroundColor: "#2563EB", // Mavi renk
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // width: '100%', // Tam genişlik yapabilirsiniz
    alignSelf: 'flex-end', // Sağa yasla
  },
  shareButtonDisabled: {
    backgroundColor: '#93C5FD', // Soluk mavi
  },
  shareButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});


export default FeedScreen;
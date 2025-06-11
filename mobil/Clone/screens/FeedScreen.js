// screens/FeedScreen.js - Düzeltilmiş token yönetimi
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  StatusBar,
  Platform,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '@env';
import Modal from 'react-native-modal';

const windowHeight = Dimensions.get('window').height;

const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkZWeURXTVdPb1YvMVBNSkwiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2x6cnFpYWJ4ZXBzdnpuaXZ0ZmdkLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiNzNjOGNiMC1iMGUwLTRiNTAtODdjMC02Y2MxYTNjNTJkNzUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ4ODkzODI2LCJpYXQiOjE3NDg4OTAyMjYsImVtYWlsIjoibXVzdGFmYTQ0ZmJmYkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoibXVzdGFmYTQ0ZmJmYkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiNzNjOGNiMC1iMGUwLTRiNTAtODdjMC02Y2MxYTNjNTJkNzUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0ODg5MDIyNn1dLCJzZXNzaW9uX2lkIjoiYTIyZWY4OTUtYzM4Ni00MzYwLTk4MzYtNTM4ZWUzZDE4NGFhIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.d7jJq2oc6kREXDc1_KsL99ZlCPYJREQBBfr_dsyM1-8';

// Avatar için güvenli url
function getSafeAvatarUrl(url) {
  // Eğer url yoksa veya svg ise random bir avatar döndür
  if (!url || typeof url !== 'string' || url.startsWith('data:image/svg+xml') || url.endsWith('.svg')) {
    // randomuser.me'den rastgele bir avatar
    const randomId = Math.floor(Math.random() * 99) + 1;
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    return `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`;
  }
  return url;
}

const FeedScreen = (props) => {
  const userToken = USER_TOKEN;

  // Kullanıcı profilini tutacak state
  const [currentUser, setCurrentUser] = useState(null);

  // Kullanıcı profilini çek
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userToken) return;
      try {
        const res = await fetch(`${API_BASE_URL}/profile/`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setCurrentUser(data);
      } catch (e) {
        setCurrentUser(null);
      }
    };
    fetchProfile();
  }, [userToken]);

  // Eğer token yoksa login sayfasına yönlendir
  useEffect(() => {
    if (!userToken) {
      Alert.alert(
        "Token Bulunamadı", 
        "Lütfen tekrar giriş yapın.",
        [
          {
            text: "Tamam",
            onPress: () => {
              props.navigation.navigate('Login');
            }
          }
        ]
      );
    }
  }, [userToken, props.navigation]);

  // State değişkenleri
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isCreatePostModalVisible, setIsCreatePostModalVisible] = useState(false);
  const [likeLoading, setLikeLoading] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [comments, setComments] = useState({});
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [sharePostId, setSharePostId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [sharing, setSharing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Gönderileri çekme fonksiyonu
  const fetchPosts = async () => {
    if (!userToken) {
      setError("Kimlik doğrulama tokenı bulunamadı. Lütfen giriş yapın.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('fetchPosts KULLANILAN TOKEN:', userToken ? 'Token mevcut' : 'Token yok');
      
      const postsHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      };
      
      const response = await fetch(`${API_BASE_URL}/posts/`, {
        method: 'GET',
        headers: postsHeaders,
      });
      
      console.log('fetchPosts RESPONSE STATUS:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("Oturum Süresi Doldu", "Lütfen tekrar giriş yapın.");
          props.navigation.navigate('Login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      const sortedPosts = Array.isArray(responseData)
        ? responseData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        : [];
      setPosts(sortedPosts);
    } catch (err) {
      console.error("Gönderileri çekerken hata:", err);
      setError(`Gönderiler yüklenirken bir hata oluştu: ${err.message}`);
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Arkadaş listesini çek
  useEffect(() => {
    const fetchFriends = async () => {
      if (!userToken) return;
      
      try {
        console.log('fetchFriends - Token mevcut');
        
        const friendsHeaders = { 'Authorization': `Bearer ${userToken}` };
        
        const profileRes = await fetch(`${API_BASE_URL}/profile/`, {
          headers: friendsHeaders
        });
        
        if (!profileRes.ok) {
          if (profileRes.status === 401) {
            Alert.alert("Oturum Süresi Doldu", "Lütfen tekrar giriş yapın.");
            props.navigation.navigate('Login');
            return;
          }
          throw new Error('Profil alınamadı');
        }
        
        const profile = await profileRes.json();
        console.log('PROFILE alındı');
        
        const userId = profile.supabase_id || profile.id;
        
        if (!userId) {
          console.warn('userId undefined! Profil:', profile);
          setFriends([]);
          return;
        }
        
        const friendsRes = await fetch(`${API_BASE_URL}/users/${userId}/friends/`, {
          headers: friendsHeaders
        });
        
        if (friendsRes.ok) {
          const friendsData = await friendsRes.json();
          setFriends(Array.isArray(friendsData) ? friendsData : []);
        }
      } catch (e) {
        setFriends([]);
        console.error('Arkadaş listesi alınırken hata:', e);
      }
    };
    
    fetchFriends();
  }, [userToken, props.navigation]);

  // Yeni gönderi paylaşma
  const handlePostSubmit = async () => {
    if (!newPostContent.trim()) {
      Alert.alert("Uyarı", "Lütfen bir gönderi içeriği girin.");
      return;
    }

    if (!userToken) {
      Alert.alert("Hata", "Paylaşım yapmak için giriş yapmalısınız.");
      props.navigation.navigate('Login');
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/posts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ content: newPostContent }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("Oturum Süresi Doldu", "Lütfen tekrar giriş yapın.");
          props.navigation.navigate('Login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newPost = await response.json();
      setPosts(currentPosts => [newPost, ...currentPosts]);
      setNewPostContent('');
      setIsCreatePostModalVisible(false);
      Alert.alert("Başarılı", "Gönderiniz paylaşıldı!");

    } catch (err) {
      console.error("Gönderi paylaşılırken hata:", err);
      Alert.alert("Hata", `Gönderi paylaşılırken bir hata oluştu: ${err.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  // Beğenme
  const handleLike = async (post) => {
    if (!userToken) return;
    setLikeLoading(l => ({ ...l, [post.id]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${post.id}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          props.navigation.navigate('Login');
          return;
        }
        throw new Error('Beğenilemedi');
      }
      const data = await response.json();
      setPosts(current => current.map(p => p.id === post.id ? { ...p, likes_count: data.likes_count, is_liked: data.is_liked } : p));
    } catch (e) {
      console.error('Beğeni hatası:', e);
    }
    setLikeLoading(l => ({ ...l, [post.id]: false }));
  };

  // Yorumları yükle/gizle
  const toggleComments = async (post) => {
    if (!userToken) return;
    if (!showComments[post.id]) {
      setCommentLoading(l => ({ ...l, [post.id]: true }));
      try {
        const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comments/`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (!response.ok) {
          if (response.status === 401) {
            props.navigation.navigate('Login');
            return;
          }
          throw new Error('Yorumlar yüklenemedi');
        }
        const loadedComments = await response.json();
        setComments(c => ({ ...c, [post.id]: loadedComments }));
        setShowComments(s => ({ ...s, [post.id]: true }));
      } catch (e) {
        console.error('Yorum yükleme hatası:', e);
      }
      setCommentLoading(l => ({ ...l, [post.id]: false }));
    } else {
      setShowComments(s => ({ ...s, [post.id]: false }));
    }
  };

  // Yorum gönder
  const handleCommentSubmit = async (post) => {
    if (!userToken || !commentInputs[post.id]?.trim()) return;
    setCommentLoading(l => ({ ...l, [post.id]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ comment_text: commentInputs[post.id], type: 'comment' }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          props.navigation.navigate('Login');
          return;
        }
        throw new Error('Yorum gönderilemedi');
      }
      const newComment = await response.json();
      setComments(c => ({ ...c, [post.id]: [newComment, ...(c[post.id] || [])] }));
      setCommentInputs(i => ({ ...i, [post.id]: '' }));
      setPosts(current => current.map(p => p.id === post.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
    } catch (e) {
      console.error('Yorum gönderme hatası:', e);
    }
    setCommentLoading(l => ({ ...l, [post.id]: false }));
  };

  // Mesaj olarak paylaş
  const handleShareAsMessage = async () => {
    if (!selectedFriendId || !sharePostId || !userToken) return;
    setSharing(true);
    try {
      const post = posts.find(p => p.id === sharePostId);
      const response = await fetch(`${API_BASE_URL}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ receiver_id: selectedFriendId, message_text: `Bir gönderi paylaşıldı: \n\n${post.content}` })
      });
      if (!response.ok) {
        if (response.status === 401) {
          props.navigation.navigate('Login');
          return;
        }
        throw new Error('Mesaj olarak paylaşma başarısız');
      }
      setShareModalVisible(false);
      setSelectedFriendId('');
      setSharePostId(null);
      Alert.alert('Başarılı', 'Gönderi mesaj olarak paylaşıldı!');
    } catch (e) {
      console.error('Paylaşma hatası:', e);
    }
    setSharing(false);
  };

  // Kullanıcı arama fonksiyonu
  const handleSearch = async (text) => {
    setSearch(text);
    if (!text.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    if (!userToken) return;
    
    setSearchLoading(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams({ q: text.trim() });
      const response = await fetch(`${API_BASE_URL}/search-users/?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
          props.navigation.navigate('Login');
          return;
        }
        throw new Error('Arama başarısız');
      }
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setSearchError('Arama başarısız');
      setSearchResults([]);
      console.error('Arama hatası:', e);
    }
    setSearchLoading(false);
  };

  // Arkadaşlık isteği gönderme
  const handleSendFriendRequest = async (targetUserId) => {
    if (!userToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/friendships/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ receiver_id: targetUserId }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'İstek başarısız');
      }
      Alert.alert('Başarılı', 'Arkadaşlık isteği gönderildi!');
      setSearchResults(prev => prev.map(u => u.id === targetUserId ? { ...u, friend_status: 'request_sent' } : u));
    } catch (e) {
      Alert.alert('Hata', `Arkadaşlık isteği gönderilemedi: ${e.message}`);
      console.error('Arkadaşlık isteği hatası:', e);
    }
  };

  // Ekrana odaklanıldığında gönderileri çek
  useFocusEffect(
    useCallback(() => {
      if (userToken) {
        fetchPosts();
      }
    }, [userToken])
  );

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    if (userToken) {
      setRefreshing(true);
      fetchPosts();
    }
  }, [userToken]);

  // Token yoksa loading göster
  if (!userToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={{ marginTop: 10, color: '#666' }}>Oturum kontrol ediliyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Gönderi render fonksiyonu
  const renderPostItem = ({ item: post }) => {
    const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=ddd&color=555&size=100';

    const formatPostDate = (dateString) => {
      if (!dateString) return 'Bilinmiyor';
      try {
        const date = new Date(dateString);
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
        <View style={styles.postHeader}>
          <Image
            source={{ uri: getSafeAvatarUrl(post.author_avatar_url) }}
            style={styles.postAvatar}
            onError={(e) => console.log('Gönderi avatar yüklenirken hata:', e.nativeEvent.error)}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorNickname}>{post.author_nickname || 'İsimsiz Kullanıcı'}</Text>
            <Text style={styles.postDate}>{formatPostDate(post.created_at)}</Text>
          </View>
        </View>
        <Text style={styles.postContent}>{post.content}</Text>
        <View style={styles.postStatsRow}>
          {typeof post.likes_count === 'number' && (
            <View style={styles.statItem}>
              <Ionicons name="heart" size={18} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.statText}>{post.likes_count}</Text>
            </View>
          )}
          {typeof post.comments_count === 'number' && (
            <View style={styles.statItem}>
              <Ionicons name="chatbubble" size={18} color="#2563EB" style={{ marginRight: 4 }} />
              <Text style={styles.statText}>{post.comments_count}</Text>
            </View>
          )}
        </View>
        <View style={styles.postActionsRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleLike(post)} disabled={likeLoading[post.id]}>
            <Ionicons name={post.is_liked ? 'heart' : 'heart-outline'} size={22} color={post.is_liked ? '#EF4444' : '#666'} />
            <Text style={styles.iconBtnText}>{post.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => toggleComments(post)}>
            <Ionicons name="chatbubble-outline" size={22} color="#2563EB" />
            <Text style={styles.iconBtnText}>{post.comments_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { setShareModalVisible(true); setSharePostId(post.id); }}>
            <Ionicons name="paper-plane-outline" size={22} color="#666" />
          </TouchableOpacity>
        </View>
        {showComments[post.id] && (
          <View style={styles.commentsSection}>
            <View style={styles.commentFormRow}>
              <Image
                source={{ uri: getSafeAvatarUrl(currentUser?.avatar_url) }}
                style={styles.commentAvatar}
              />
              <TextInput
                style={styles.commentInput}
                placeholder="Yorum yaz..."
                value={commentInputs[post.id] || ''}
                onChangeText={text => setCommentInputs(i => ({ ...i, [post.id]: text }))}
                editable={!commentLoading[post.id]}
                onSubmitEditing={() => handleCommentSubmit(post)}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.commentSendBtn} onPress={() => handleCommentSubmit(post)} disabled={commentLoading[post.id] || !(commentInputs[post.id] || '').trim()}>
                <Ionicons name="send" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
            {commentLoading[post.id] ? (
              <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 10 }} />
            ) : (Array.isArray(comments[post.id]) && comments[post.id].length > 0 ? (
              comments[post.id].map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image source={{ uri: getSafeAvatarUrl(comment.user_avatar_url) }} style={styles.commentAvatar} />
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>{comment.user_nickname}</Text>
                    <Text style={styles.commentText}>{comment.comment_text || comment.content}</Text>
                    <Text style={styles.commentTime}>{formatPostDate(comment.created_at)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noCommentsText}>Henüz yorum yok. İlk yorumu sen yap!</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#fff"
        barStyle="dark-content"
        translucent={true}
      />
      <View style={[styles.headerBar, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44 }]}>
        <Text style={styles.mentureTitle}>Menture</Text>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#2563EB" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kullanıcı ara..."
            value={search}
            onChangeText={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>
      
      {search.length > 0 && (
        <View style={styles.searchResultsBox}>
          {searchLoading && <Text style={styles.searchResultText}>Aranıyor...</Text>}
          {searchError && <Text style={styles.searchResultText}>{searchError}</Text>}
          {!searchLoading && !searchError && searchResults.length === 0 && (
            <Text style={styles.searchResultText}>Kullanıcı bulunamadı.</Text>
          )}
          {!searchLoading && !searchError && searchResults.map(user => (
            <View key={user.id} style={styles.searchResultItem}>
              <Image source={{ uri: getSafeAvatarUrl(user.avatar_url) }} style={styles.searchResultAvatar} />
              <Text style={styles.searchResultNickname}>{user.nickname || user.email}</Text>
              {user.friend_status !== 'friends' && user.friend_status !== 'request_sent' && (
                <TouchableOpacity style={styles.addFriendBtn} onPress={() => handleSendFriendRequest(user.id)}>
                  <Text style={styles.addFriendBtnText}>Arkadaş Ekle</Text>
                </TouchableOpacity>
              )}
              {user.friend_status === 'request_sent' && (
                <Text style={styles.requestSentText}>İstek Gönderildi</Text>
              )}
              {user.friend_status === 'friends' && (
                <Text style={styles.friendsText}>Arkadaşsınız</Text>
              )}
            </View>
          ))}
        </View>
      )}
      
      {loading && !refreshing && <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 30 }} />}
      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {!loading && !error && posts.length > 0 && (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={{ paddingVertical: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreatePostModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal isVisible={isCreatePostModalVisible} onBackdropPress={() => { setIsCreatePostModalVisible(false); setNewPostContent(''); }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.createPostModalView}>
            <Text style={styles.createPostModalTitle}>Yeni Gönderi Oluştur</Text>
            <TextInput
              style={styles.postInput}
              placeholder="Ne düşünüyorsun?"
              multiline={true}
              value={newPostContent}
              onChangeText={setNewPostContent}
              maxHeight={windowHeight * 0.3}
            />
            <TouchableOpacity
              style={[styles.shareButton, isPosting && styles.shareButtonDisabled]}
              onPress={handlePostSubmit}
              disabled={isPosting}
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

      <Modal isVisible={shareModalVisible} onBackdropPress={() => setShareModalVisible(false)}>
        <View style={styles.shareModalContent}>
          <Text style={styles.shareModalTitle}>Arkadaşına Mesaj Olarak Paylaş</Text>
          <View style={styles.shareModalPickerRow}>
            <Text style={{ marginRight: 8 }}>Arkadaş:</Text>
            <View style={styles.shareModalPickerBox}>
              <FlatList
                data={friends}
                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                horizontal
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.shareModalFriendBtn, selectedFriendId === item.id && styles.shareModalFriendBtnSelected]}
                    onPress={() => setSelectedFriendId(item.id)}
                  >
                    <Image source={{ uri: getSafeAvatarUrl(item.avatar_url) }} style={styles.shareModalFriendAvatar} />
                    <Text style={styles.shareModalFriendName}>{item.nickname || (item.email ? item.email.slice(0, 4) : 'Kullanıcı')}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.shareModalSendBtn} onPress={handleShareAsMessage} disabled={!selectedFriendId || sharing}>
            <Text style={styles.shareModalSendBtnText}>{sharing ? 'Paylaşılıyor...' : 'Paylaş'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareModalCloseBtn} onPress={() => setShareModalVisible(false)}>
            <Text style={styles.shareModalCloseBtnText}>Kapat</Text>
          </TouchableOpacity>
        </View>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mentureTitle: {
    color: '#2563EB',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 2,
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  searchResultsBox: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginHorizontal: 10,
    marginTop: -2,
    paddingBottom: 8,
    elevation: 2,
    zIndex: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
  },
  searchResultNickname: {
    flex: 1,
    fontSize: 15,
    color: '#222',
  },
  addFriendBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  addFriendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  requestSentText: {
    color: '#999',
    fontSize: 13,
    fontWeight: 'bold',
  },
  friendsText: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 13,
  },
  searchResultText: {
    color: '#666',
    fontSize: 14,
    padding: 8,
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
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'visible',
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
  postStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 13,
    color: '#444',
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  iconBtnText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  commentsSection: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
  },
  commentFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  commentSendBtn: {
    backgroundColor: '#E0E7FF',
    borderRadius: 8,
    padding: 8,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  commentBubble: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#2563eb11',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  commentAuthor: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#2563EB',
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#222',
    marginTop: 2,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  commentTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    textAlign: 'right',
  },
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
  // --- Share Modal ---
  shareModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 12,
  },
  shareModalPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shareModalPickerBox: {
    flex: 1,
    flexDirection: 'row',
  },
  shareModalFriendBtn: {
    alignItems: 'center',
    marginRight: 12,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  shareModalFriendBtnSelected: {
    backgroundColor: '#2563EB',
  },
  shareModalFriendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 2,
    backgroundColor: '#e0e0e0',
  },
  shareModalFriendName: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  shareModalSendBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 10,
  },
  shareModalSendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  shareModalCloseBtn: {
    marginTop: 10,
    backgroundColor: '#E0E7FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  shareModalCloseBtnText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noCommentsText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#999',
  },
});

export default FeedScreen;
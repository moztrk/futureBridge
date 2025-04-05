import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, ScrollView } from 'react-native';

const ProfileScreen = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const tempProfile = {
      id: 'someUserId',
      username: 'ReactNativeUser',
      email: 'reactnative@example.com',
      profile_picture: null,
      created_at: new Date().toISOString(),
    };
    setUserProfile(tempProfile);
    setLoading(false);
  }, []);

  const defaultProfilePic = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?Text=No+Image';

  const formatDate = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.warn('Tarih formatlama hatası:', e);
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Profil bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Hata oluştu</Text>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.profilePageContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.profileCover} />
        <Image
          source={{ uri: userProfile?.profile_picture || defaultProfilePic }}
          style={styles.profilePicture}
          onError={(e) => console.log('Profil resmi yüklenirken hata:', e.nativeEvent.error)}
        />
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.profileUsername}>
          {userProfile?.username || 'Kullanıcı'}
        </Text>

        <View style={styles.profileMeta}>
          <Text>
            <Text style={{ fontWeight: 'bold' }}>E-posta:</Text> {userProfile?.email || 'E-posta bilgisi yok'}
          </Text>
          <Text>
            <Text style={{ fontWeight: 'bold' }}>ID:</Text> {userProfile?.id || 'ID bilgisi yok'}
          </Text>
          <Text>
            <Text style={{ fontWeight: 'bold' }}>Katılım Tarihi:</Text> {formatDate(userProfile?.created_at)}
          </Text>
        </View>
      </View>

      <View style={styles.profileContent}>
        <Text style={styles.contentTitle}>Aktiviteler</Text>
        <View style={styles.activityPlaceholder}>
          <Text>Henüz aktivite bulunmamaktadır</Text>
        </View>
      </View>
    </ScrollView>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  profileHeader: {
    backgroundColor: '#2563EB',
    height: 200,
    marginBottom: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  profileCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    marginBottom: -50,
  },
  profileInfo: {
    padding: 20,
    alignItems: 'center',
    marginTop: 70,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 30,
  },
  profileUsername: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  profileBio: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 15,
    textAlign: 'center',
    maxWidth: 600,
  },
  profileMeta: {
    marginTop: 15,
    alignItems: 'center',
  },
  profileMetaText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  profileContent: {
    padding: 20,
    alignItems: 'center',
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  activityPlaceholder: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    marginTop: 10,
  },
});

export default ProfileScreen;
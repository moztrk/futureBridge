// screens/FeedScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FeedScreen = () => {
  // Fake Feed Data
  const feedPosts = [
    {
      id: 1,
      user: 'Ahmet Yılmaz',
      role: 'AI Developer',
      content: 'Yeni bir makine öğrenmesi projesi üzerinde çalışıyorum! 🚀',
      likes: 42,
      comments: 15,
      time: '2h önce'
    },
    {
      id: 2,
      user: 'Startup Türkiye',
      role: 'Topluluk',
      content: 'Yapay zeka girişimleri için hibe programı başvuruları açıldı!',
      likes: 89,
      comments: 30,
      time: '5h önce'
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Future</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="search" size={24} color="black" style={styles.icon} />
          <Ionicons name="notifications" size={24} color="black" style={styles.icon} />
        </View>
      </View>

      {/* Feed */}
      <ScrollView>
        {feedPosts.map(post => (
          <View key={post.id} style={styles.post}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Image
                source={{ uri: 'https://via.placeholder.com/50' }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.userName}>{post.user}</Text>
                <Text style={styles.userRole}>{post.role} • {post.time}</Text>
              </View>
            </View>

            {/* Post Content */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Engagement Bar */}
            <View style={styles.engagementBar}>
              <TouchableOpacity style={styles.engagementButton}>
                <Ionicons name="heart-outline" size={20} />
                <Text>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.engagementButton}>
                <Ionicons name="chatbubble-outline" size={20} />
                <Text>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.engagementButton}>
                <Ionicons name="share-social-outline" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    fontStyle: 'italic'
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 20
  },
  post: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16
  },
  userRole: {
    color: '#666',
    fontSize: 12
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15
  },
  engagementBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
});

export default FeedScreen;
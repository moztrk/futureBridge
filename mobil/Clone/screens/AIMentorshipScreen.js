import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

const AIMentorshipScreen = () => {
  const handleBookAppointment = () => {
    // Burada randevu alma işlemini gerçekleştirecek kodunuzu yazabilirsiniz.
    // Örneğin, kullanıcıyı başka bir ekrana yönlendirebilirsiniz.
    console.log('Randevu Alındı!');
  };

  return (
    <View style={styles.mentorshipContainer}>
      <View style={styles.mentorshipHeader}>
        <Text style={styles.headerTitle}>AI Mentorluk Paneli</Text>
        <Text style={styles.headerSubtitle}>Kariyer hedeflerinize göre kişiselleştirilmiş yol haritaları oluşturun.</Text>
      </View>

      <View style={styles.mentorshipBody}>
        {/* Mentor Kartları */}
        <View style={styles.mentorCard}>
          <Text style={styles.mentorName}>Mentor: Dr. Ahmet Yılmaz</Text>
          <Text style={styles.mentorSpeciality}>Yapay zeka ve veri bilimi uzmanı</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleBookAppointment}>
            <Text style={styles.buttonText}>Randevu Al</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mentorCard}>
          <Text style={styles.mentorName}>Mentor: Elif Demir</Text>
          <Text style={styles.mentorSpeciality}>Makine öğrenimi ve derin öğrenme uzmanı</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleBookAppointment}>
            <Text style={styles.buttonText}>Randevu Al</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mentorshipFooter}>
        <Text style={styles.footerText}>AI Mentorluk Paneli, kariyerinizi yönlendirecek bir yol haritası sunar.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mentorshipContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 20,
    fontFamily: 'Arial, sans-serif',
  },
  mentorshipHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    color: '#2563EB',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 800,
  },
  mentorshipBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    gap: 20,
    flexWrap: 'wrap', // Küçük ekranlarda kartların alt alta gelmesini sağlar
  },
  mentorCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    width: '45%', // İki kartın yan yana sığması için
    marginBottom: 20,
  },
  mentorName: {
    fontSize: 18,
    color: '#2563EB',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mentorSpeciality: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  mentorshipFooter: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default AIMentorshipScreen;
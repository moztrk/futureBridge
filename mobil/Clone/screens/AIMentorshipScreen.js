import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView, 
} from 'react-native';

const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

const AIMentorshipScreen = () => {
  const [userCareerInput, setUserCareerInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGetSuggestion = async () => {
    if (!userCareerInput.trim()) {
      Alert.alert("Uyarı", "Lütfen kariyer hedefleriniz veya durumunuz hakkında bilgi girin.");
      return;
    }

    setLoading(true);
    setError(null);
    setAiSuggestion('');

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `Kariyer hedeflerim/durumum hakkında bilgi: "${userCareerInput}". Bana bu konuda detaylı bir kariyer yol haritası veya öneri sunar mısın? Türkçe yanıt ver.` }
              ]
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API HTTP Hatası:", response.status, errorBody);
        throw new Error(`API isteği başarısız oldu: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Gemini API Yanıtı:", responseData);

      const suggestionText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (suggestionText) {
        setAiSuggestion(suggestionText);
      } else {
        setError("AI'dan öneri alınamadı. Lütfen tekrar deneyin.");
        console.error("Gemini API yanıt formatı beklenenden farklı:", responseData);
      }
    } catch (err) {
      console.error("AI Öneri Çekerken Hata:", err);
      setError(`Öneri alınırken bir hata oluştu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    console.log('Randevu Alındı!');
    Alert.alert("Bilgi", "Randevu alma özelliği henüz aktif değil.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView style={styles.mentorshipContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.mentorshipHeader}>
            <Text style={styles.headerTitle}>AI Mentorluk Paneli</Text>
            <Text style={styles.headerSubtitle}>Kariyer hedeflerinize göre kişiselleştirilmiş yol haritaları oluşturun.</Text>
          </View>

          <View style={styles.aiInputContainer}>
            <Text style={styles.inputLabel}>Kariyer hedefleriniz veya durumunuz nedir?</Text>
            <TextInput
              style={styles.careerInput}
              placeholder="Örn: Frontend geliştirici olmak istiyorum, mevcut becerilerim HTML, CSS, JS. Ne öğrenmeliyim?"
              multiline={true}
              value={userCareerInput}
              onChangeText={setUserCareerInput}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.getSuggestionButton, loading && styles.buttonDisabled]}
              onPress={handleGetSuggestion}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Öneri Al</Text>
              )}
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {aiSuggestion && (
            <View style={styles.aiSuggestionContainer}>
              <Text style={styles.aiSuggestionTitle}>AI Kariyer Önerisi:</Text>
              <Text style={styles.aiSuggestionText}>{aiSuggestion}</Text>
            </View>
          )}

          <View style={styles.mentorshipBody}>
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
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mentorshipContainer: {
    flexGrow: 1,
    backgroundColor: '#F3F4F6',
    padding: 20,
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
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  aiInputContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  careerInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
    color: '#333',
  },
  getSuggestionButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  aiSuggestionContainer: {
    backgroundColor: '#EBF4FF',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    marginBottom: 20,
  },
  aiSuggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 10,
  },
  aiSuggestionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  mentorshipBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 0,
    gap: 20,
    flexWrap: 'wrap',
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
    width: '48%',
    marginBottom: 20,
  },
  mentorName: {
    fontSize: 18,
    color: '#2563EB',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
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
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mentorshipFooter: {
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default AIMentorshipScreen;

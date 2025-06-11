import React, { useState, useEffect } from 'react';
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
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { API_BASE_URL } from '@env';
import Modal from 'react-native-modal';

// !!! DİKKAT: API ANAHTARINIZI FRONTEND KODUNA DOĞRUDAN KOYMAYIN!
// Bu sadece bir örnektir. Güvenlik için backend proxy kullanmalısınız.
// Gerçek uygulamada bu anahtarı güvenli bir yerden (örn. environment variables veya backend) alın.
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // <-- BURAYA KENDİ API ANAHTARINIZI YAZIN (SADECE TEST İÇİN)
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Eğer backend proxy kullanacaksanız, URL'niz şöyle bir şey olabilir:
// const API_BASE_URL = 'http://192.168.200.192:8000/api'; // Backend URL'niz
// const GEMINI_PROXY_URL = `${API_BASE_URL}/generate-career-suggestion/`; // Backend'deki yeni endpoint'iniz

const AIMentorshipScreen = (props) => {
  // -- State Değişkenleri --
  const [userCareerInput, setUserCareerInput] = useState(''); // Kullanıcının girdiği kariyer bilgisi
  const [aiSuggestion, setAiSuggestion] = useState(''); // AI'dan gelen öneri
  const [loading, setLoading] = useState(false); // AI önerisi yükleniyor mu?
  const [error, setError] = useState(null); // Hata oluştu mu?
  const { width } = useWindowDimensions();

  const userToken = props.userToken;

  const [aiSteps, setAiSteps] = useState([]); // parse edilmiş adımlar
  const [aiCompleted, setAiCompleted] = useState([]); // öneri kartı için tikler
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [detailSteps, setDetailSteps] = useState([]);
  const [detailCompleted, setDetailCompleted] = useState([]);

  // Yol haritalarını çek
  useEffect(() => {
    if (!userToken) return;
    setLoadingRoadmaps(true);
    fetchRoadmaps(userToken)
      .then(data => setRoadmaps(Array.isArray(data) ? data : []))
      .catch(() => setRoadmaps([]))
      .finally(() => setLoadingRoadmaps(false));
  }, [userToken]);

  // AI öneri parse
  useEffect(() => {
    if (!aiSuggestion) { setAiSteps([]); setAiCompleted([]); return; }
    let steps = parseTextToSteps(aiSuggestion);
    setAiSteps(steps);
    setAiCompleted(Array(steps.length).fill(false));
  }, [aiSuggestion]);

  // AI Önerisi Alma Fonksiyonu --
  const handleGetSuggestion = async () => {
    if (!userCareerInput.trim()) {
      Alert.alert("Uyarı", "Lütfen kariyer hedefleriniz veya durumunuz hakkında bilgi girin.");
      return;
    }

    setLoading(true);
    setError(null);
    setAiSuggestion('');

    try {
      const response = await fetch(`${API_BASE_URL}/ai-suggestion/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ user_input: userCareerInput }),
      });

      if (!response.ok) {
        let errorMessage = `API isteği başarısız oldu: ${response.status}`;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.detail || JSON.stringify(errorBody) || errorMessage;
        } catch {}
        setError(errorMessage);
        return;
      }

      const responseData = await response.json();
      const suggestionText = responseData?.suggestion_text;
      if (suggestionText) {
        setAiSuggestion(suggestionText);
      } else {
        setError("AI'dan öneri alınamadı veya boş yanıt döndü. Lütfen tekrar deneyin.");
      }
    } catch (err) {
      setError(`Öneri alınırken bir hata oluştu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShareAsPost = async () => {
    if (!aiSuggestion.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/posts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ content: `AI Kariyer Yol Haritası:\n\n${aiSuggestion}` }),
      });
      if (!response.ok) {
        let errorMessage = `Gönderi paylaşılırken hata oluştu (HTTP ${response.status})`;
        try {
          const errorJson = await response.json();
          errorMessage = errorJson.detail || JSON.stringify(errorJson);
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        Alert.alert('Hata', errorMessage);
        return;
      }
      Alert.alert('Başarılı', 'Yol haritası başarıyla gönderi olarak paylaşıldı!');
    } catch (err) {
      Alert.alert('Hata', `Gönderi paylaşılırken bir hata oluştu: ${err.message}`);
    }
  };

  // Randevu alma fonksiyonu (mevcut kodunuzdan)
  const handleBookAppointment = () => {
    console.log('Randevu Alındı!');
    Alert.alert("Bilgi", "Randevu alma özelliği henüz aktif değil.");
    // Burada navigasyon veya başka bir işlem eklenebilir.
  };

  // --- Yol Haritası API Fonksiyonları ---
  const fetchRoadmaps = async (token) => {
    const res = await fetch(`${API_BASE_URL}/roadmap/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  };

  const saveRoadmap = async (token, title, steps) => {
    const res = await fetch(`${API_BASE_URL}/roadmap/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, steps })
    });
    return res.json();
  };

  const deleteRoadmap = async (token, roadmapId) => {
    const res = await fetch(`${API_BASE_URL}/roadmap/${roadmapId}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.ok;
  };

  const patchRoadmapStep = async (token, roadmapId, steps) => {
    await fetch(`${API_BASE_URL}/roadmap/${roadmapId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ steps }),
    });
  };

  // --- AI metnini adım adım parse eden fonksiyon (her satırı bir adım olarak alır) ---
  function parseTextToSteps(aiText) {
    const lines = aiText.split('\n').filter(line => line.trim() !== '');
    return lines.map((text, idx) => ({
      id: String(idx + 1),
      text: text.replace(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[^\w\s])/, '').trim(),
      completed: false,
    }));
  }

  // Yol haritası detayını aç
  const handleShowDetail = (roadmap) => {
    setSelectedRoadmap(roadmap);
    let steps = [];
    if (roadmap.steps && Array.isArray(roadmap.steps)) steps = roadmap.steps;
    else if (typeof roadmap.steps === 'string') {
      try { steps = JSON.parse(roadmap.steps); } catch { steps = []; }
    }
    setDetailSteps(steps);
    setDetailCompleted(steps.map(s => !!s.completed));
    setShowDetailModal(true);
  };

  // Yol haritası kaydet
  const handleSaveRoadmap = async () => {
    if (!aiSteps.length) return;
    setSavingRoadmap(true);
    const stepsToSave = aiSteps.map((s, i) => ({...s, completed: aiCompleted[i]}));
    const title = 'AI Yol Haritası';
    await saveRoadmap(userToken, title, stepsToSave);
    fetchRoadmaps(userToken).then(data => setRoadmaps(Array.isArray(data) ? data : []));
    setSavingRoadmap(false);
    setAiSuggestion("");
    setAiSteps([]);
    setAiCompleted([]);
  };

  // Detay modalında adım tiklerini güncelle (backend'e de kaydet)
  const handleDetailToggle = (idx) => {
    setDetailCompleted(arr => {
      const copy = [...arr];
      copy[idx] = !copy[idx];
      setDetailSteps(steps => steps.map((s, i) => i === idx ? {...s, completed: copy[idx]} : s));
      if (selectedRoadmap && selectedRoadmap.id) {
        patchRoadmapStep(userToken, selectedRoadmap.id, detailSteps.map((s, i) => i === idx ? {...s, completed: !detailCompleted[idx]} : s));
      }
      return copy;
    });
  };

  // Yol haritası paylaş
  const handleShareRoadmap = async (roadmap) => {
    await saveRoadmap(userToken, roadmap.title, roadmap.steps);
    Alert.alert('Başarılı', 'Yol haritası gönderi olarak paylaşıldı!');
  };

  // Yol haritası sil
  const handleDeleteRoadmap = async (roadmap) => {
    if (!roadmap.id) return;
    await deleteRoadmap(userToken, roadmap.id);
    setRoadmaps(rms => rms.filter(r => r.id !== roadmap.id));
  };

  // AI önerisi kartlarında tiklenince tamamlanma oranı güncellensin
  const handleAiToggle = (idx) => {
    setAiCompleted(arr => {
      const copy = [...arr];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: '#F3F4F6' }, Platform.OS === 'android' && { paddingTop: StatusBar.currentHeight || 24 }]}>
      <KeyboardAvoidingView // Klavye açıldığında içeriği yukarı kaydır
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // İhtiyaca göre ayarla
      >
        <ScrollView style={styles.mentorshipContainer} showsVerticalScrollIndicator={false}>
          <Text style={{fontSize:22,fontWeight:'bold',color:'#2563EB',marginBottom:10}}>Yol Haritalarım</Text>
          {loadingRoadmaps ? (
            <ActivityIndicator size="large" color="#2563EB" style={{marginVertical:20}} />
          ) : roadmaps.length === 0 ? (
            <Text style={{textAlign:'center',color:'#888',marginBottom:18}}>Henüz yol haritanız yok.</Text>
          ) : (
            roadmaps.map((rm, idx) => {
              let steps = [];
              if (Array.isArray(rm.steps)) steps = rm.steps;
              else if (typeof rm.steps === 'string') {
                try { steps = JSON.parse(rm.steps); } catch { steps = []; }
              }
              const completedCount = steps.filter(s => s.completed).length;
              const percent = steps.length ? Math.round((completedCount/steps.length)*100) : 0;
              return (
                <View key={rm.id || idx} style={{background:'#fff',borderRadius:14,marginBottom:14,padding:16,shadowColor:'#000',shadowOpacity:0.08,shadowRadius:4,elevation:2}}>
                  <Text style={{fontWeight:'bold',fontSize:16,color:'#2563EB',marginBottom:4}}>{rm.title || 'Yol Haritası'}</Text>
                  <Text style={{fontSize:13,color:'#16a34a',marginBottom:2}}>Tamamlanma: %{percent}</Text>
                  <View style={{flexDirection:'row',gap:10,marginTop:8}}>
                    <TouchableOpacity style={{background:'#2563EB',borderRadius:8,padding:8,paddingHorizontal:18}} onPress={()=>handleShowDetail(rm)}><Text style={{color:'#fff',fontWeight:'bold'}}>Detay</Text></TouchableOpacity>
                    <TouchableOpacity style={{background:'#fbbf24',borderRadius:8,padding:8,paddingHorizontal:18}} onPress={()=>handleShareRoadmap(rm)}><Text style={{color:'#fff',fontWeight:'bold'}}>Paylaş</Text></TouchableOpacity>
                    <TouchableOpacity style={{background:'#f43f5e',borderRadius:8,padding:8,paddingHorizontal:18}} onPress={()=>handleDeleteRoadmap(rm)}><Text style={{color:'#fff',fontWeight:'bold'}}>Sil</Text></TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Yol haritası detay modalı */}
          <Modal isVisible={showDetailModal} onBackdropPress={()=>setShowDetailModal(false)}>
            <View style={{background:'#fff',borderRadius:18,padding:24,maxHeight:'80%'}}>
              <Text style={{fontWeight:'bold',fontSize:18,color:'#2563EB',marginBottom:10}}>{selectedRoadmap?.title || 'Yol Haritası'}</Text>
              <ScrollView style={{maxHeight:320}}>
                {detailSteps.map((step, idx) => (
                  <View key={step.id || idx} style={{flexDirection:'row',alignItems:'center',marginBottom:12}}>
                    <TouchableOpacity onPress={()=>handleDetailToggle(idx)} style={{width:32,height:32,borderRadius:16,backgroundColor:detailCompleted[idx]?'#22c55e':'#fff',borderWidth:2,borderColor:'#22c55e',alignItems:'center',justifyContent:'center',marginRight:10}}>
                      {detailCompleted[idx] && <Text style={{color:'#fff',fontWeight:'bold',fontSize:18}}>✔️</Text>}
                    </TouchableOpacity>
                    <Text style={{fontSize:15,color:'#222',flex:1}}>{step.text}</Text>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity style={{marginTop:16,alignSelf:'center',backgroundColor:'#E0E7FF',borderRadius:8,paddingVertical:8,paddingHorizontal:18}} onPress={()=>setShowDetailModal(false)}>
                <Text style={{color:'#2563EB',fontWeight:'bold'}}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </Modal>

          {/* AI Öneri Giriş Alanı */}
          <View style={styles.aiInputContainer}>
            <Text style={styles.inputLabel}>Kariyer hedefleriniz veya durumunuz nedir?</Text>
            <TextInput
              style={styles.careerInput}
              placeholder="Örn: Frontend geliştirici olmak istiyorum, mevcut becerilerim HTML, CSS, JS. Ne öğrenmeliyim?"
              multiline={true}
              value={userCareerInput}
              onChangeText={setUserCareerInput}
              editable={!loading} // Yüklenirken inputu devre dışı bırak
            />
            <TouchableOpacity
              style={[styles.getSuggestionButton, loading && styles.buttonDisabled]}
              onPress={handleGetSuggestion}
              disabled={loading} // Yüklenirken butonu devre dışı bırak
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Öneri Al</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* AI Öneri Sonuç Alanı - Kartlar ve tikleme */}
          {error && <Text style={styles.errorText}>{error}</Text>}
          {aiSteps.length > 0 && (
            <View style={{marginTop:10,marginBottom:18}}>
              <Text style={{fontWeight:'bold',fontSize:16,color:'#2563EB',marginBottom:8}}>AI Yol Haritası Adımları</Text>
              {aiSteps.map((step, idx) => (
                <View key={step.id || idx} style={{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:12,marginBottom:10,padding:14,shadowColor:'#000',shadowOpacity:0.06,shadowRadius:2,elevation:1}}>
                  <TouchableOpacity onPress={()=>handleAiToggle(idx)} style={{width:28,height:28,borderRadius:14,backgroundColor:aiCompleted[idx]?'#22c55e':'#fff',borderWidth:2,borderColor:'#22c55e',alignItems:'center',justifyContent:'center',marginRight:10}}>
                    {aiCompleted[idx] && <Text style={{color:'#fff',fontWeight:'bold',fontSize:16}}>✔️</Text>}
                  </TouchableOpacity>
                  <Text style={{fontSize:15,color:'#222',flex:1}}>{step.text}</Text>
                </View>
              ))}
              <TouchableOpacity style={{backgroundColor:'#2563EB',borderRadius:8,paddingVertical:12,alignItems:'center',marginTop:6}} onPress={handleSaveRoadmap} disabled={savingRoadmap}>
                <Text style={{color:'#fff',fontWeight:'bold',fontSize:16}}>{savingRoadmap ? 'Kaydediliyor...' : 'Yol Haritası Olarak Kaydet'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Mentor Kartları */}
          <View style={styles.mentorshipBody}>
            {/* Mentor 1 */}
            <View style={styles.mentorCard}>
              <Text style={styles.mentorName}>Mentor: Dr. Ahmet Yılmaz</Text>
              <Text style={styles.mentorSpeciality}>Yapay zeka ve veri bilimi uzmanı</Text>
              <TouchableOpacity style={styles.ctaButton} onPress={handleBookAppointment}>
                <Text style={styles.buttonText}>Randevu Al</Text>
              </TouchableOpacity>
            </View>

            {/* Mentor 2 */}
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
          {/* ScrollView sonuna boşluk */}
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mentorshipContainer: {
    flexGrow: 1, // ScrollView içeriğinin büyümesine izin ver
    backgroundColor: '#F3F4F6',
    padding: 20,
    // fontFamily: 'Arial, sans-serif', // React Native'de font kullanımı farklıdır
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
    textAlign: 'center', // Başlığı ortala
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    // maxWidth: 800, // React Native'de maxWidth yerine container padding/margin kullanılır
  },

  // --- AI Öneri Alanı Stilleri ---
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
    minHeight: 100, // Minimum yükseklik
    textAlignVertical: 'top', // Yazıyı üstten başlat
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
    alignSelf: 'flex-end', // Sağa yasla
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD', // Soluk mavi
  },

  aiSuggestionContainer: {
    backgroundColor: '#EBF4FF', // Açık mavi arka plan
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB', // Mavi kenarlık
    marginBottom: 20,
    alignItems: 'center',
  },
  aiSuggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 10,
    textAlign: 'center',
  },
  roadmapStep: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadmapStepText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },


  // --- Mentor Kartları Stilleri (Mevcut code) ---
  mentorshipBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 0, // AI alanı ile birleşik
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
    width: '48%', // İki kartın yan yana sığması için (gap ile birlikte %100'ü geçmemeli)
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
    // color: '#FFFFFF', // Text componentine uygulanmalı
    // fontWeight: 'bold', // Text componentine uygulanmalı
    // border: 'none', // React Native'de borderStyle kullanılır
    borderRadius: 5,
    // cursor: 'pointer', // React Native'de cursor yoktur
    alignItems: 'center', // Text'i ortala
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold', // Text componentine uygulandı
  },
  mentorshipFooter: {
    alignItems: 'center',
    marginTop: 10, // Mentor kartları ile footer arasına boşluk
    paddingBottom: 20, // En alttan boşluk
  },
  footerText: {
    fontSize: 14, // Biraz küçülttüm
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default AIMentorshipScreen; 
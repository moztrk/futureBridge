// screens/SignUpScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../supabaseClient';
// Login stillerini import etmeye GEREK YOK, hepsini aşağıda tanımlayacağız

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Tüm alanları doldurun!');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor!');
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert('Kayıt Hatası', error.message);
    } else {
      Alert.alert(
        'Başarılı',
        'Kayıt başarılı! Lütfen email adresinizi doğrulayın.'
      );
      navigation.navigate('Login');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      // Stil artık localStyles'dan geliyor
      style={localStyles.container}
    >
      <ScrollView contentContainerStyle={localStyles.scrollViewContent}>
        {/* Stil artık localStyles'dan geliyor */}
        <View style={localStyles.authBox}>
          {/* Stil artık localStyles'dan geliyor */}
          <Text style={localStyles.title}>Hesap Oluştur</Text>

          <TextInput
            // Stil artık localStyles'dan geliyor
            style={localStyles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            // Stil artık localStyles'dan geliyor
            style={localStyles.input}
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            // Stil artık localStyles'dan geliyor
            style={localStyles.input}
            placeholder="Şifre Tekrar"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity
            // Stil artık localStyles'dan geliyor
            style={localStyles.button}
            onPress={handleSignUp}
          >
            {/* Stil artık localStyles'dan geliyor */}
            <Text style={localStyles.buttonText}>Kayıt Ol</Text>
          </TouchableOpacity>

          <TouchableOpacity
            // Stil artık localStyles'dan geliyor
            style={localStyles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            {/* Stil artık localStyles'dan geliyor */}
            <Text style={localStyles.secondaryButtonText}>
              Zaten hesabınız var mı? Giriş Yap
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// SignUpScreen için TÜM stiller burada tanımlanıyor
const localStyles = StyleSheet.create({
  // --- Genel Konteyner Stilleri ---
  container: {
      flex: 1,
      backgroundColor: '#2563EB', // Mavi arka plan
  },
   scrollViewContent: {
      flexGrow: 1, // ScrollView'un tüm alanı kaplamasını sağlar
      justifyContent: 'center', // İçeriği dikeyde ortalar
      alignItems: 'center', // İçeriği yatayda ortalar
      paddingVertical: 20, // Üst/Alt boşluk
      paddingHorizontal: 15, // Yan boşluklar (authBox'ın kenara yapışmaması için)
   },
  // --- Beyaz Kutu Stilleri (Düzenlendi) ---
  authBox: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
      alignItems: 'center',
      width: '95%',              // <--- DAHA GENİŞ (%90 yerine %95)
      maxWidth: 450,
      paddingVertical: 28,       // <--- Dikey iç boşluk biraz artırıldı
      paddingHorizontal: 25,     // <--- Yatay iç boşluk ayarlandı
  },
  // --- Başlık Stili (Düzenlendi) ---
  title: {
      fontSize: 26,
      fontWeight: 'bold',
      marginBottom: 20,          // <--- Alt boşluk azaltıldı
      color: '#1F2937',
      textAlign: 'center',
  },
  // --- Input Stili (Düzenlendi) ---
  input: {
      width: '100%', // Kutu içindeki genişliği %100 kapla
      paddingVertical: 12,
      paddingHorizontal: 15,
      marginVertical: 8,         // <--- Dikey dış boşluk azaltıldı
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 8,
      fontSize: 16,
      color: '#111827',
  },
  // --- Ana Buton Stilleri (Düzenlendi) ---
  button: {
      backgroundColor: '#2563EB',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 25,
      marginTop: 15,             // <--- Üst boşluk ayarlandı
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%', // Kutu içindeki genişliği %100 kapla
      elevation: 2,
  },
  buttonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
  },
  // --- İkincil Link/Buton Stilleri (Düzenlendi) ---
  secondaryButton: {
      marginTop: 18,             // <--- Üst boşluk azaltıldı
  },
  secondaryButtonText: {
      color: '#6B7280',  // Gri renk
      fontSize: 14,     // Boyut
      fontWeight: '500', // Orta kalınlık
  },
});

export default SignUpScreen;
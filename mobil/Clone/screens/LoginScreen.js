import React, { useState } from 'react';
import {
  View,
  Alert,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';
import styles from '../styles/LoginScreenStyles';
import { supabase } from '../supabaseClient';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Email ve şifre gerekli!');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Giriş Hatası', error.message);
    } else {
      console.log('Giriş başarılı:', data);
      navigation.navigate('Home'); // Doğru şekilde yönlendirme yapılır
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.authSection}>
        {/* Uygulama Başlığı */}
        <Text style={styles.appTitle}>Future</Text>

        {/* Giriş Kutusu */}
        <View style={styles.authBox}>
          <TextInput
            style={styles.input}
            placeholder="Email adresinizi girin"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="Şifrenizi girin"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Giriş Yap</Text>
          </TouchableOpacity>

          <View style={styles.footerTextView}>
            <Text style={styles.footerText}>
              Hesabınız yok mu?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.linkText}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;

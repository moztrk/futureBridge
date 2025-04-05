// styles/LoginScreenStyles.js
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB', // Arka plan mavi
  },
  authSection: {
    width: '100%', // Genişliği doldur
    justifyContent: 'center',
    alignItems: 'center', // İçeriği ortala
    paddingHorizontal: 20, // Kenarlardan biraz boşluk
  },
  appTitle: {
    fontSize: 64,
    fontWeight: 'bold',
    fontStyle: 'italic', // Eğik yazı
    color: '#FFFFFF',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.3)', // Hafif gölge efekti
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    transform: [{ skewX: '-10deg' }] // Hafif çarpıtma efekti
  },
  authBox: {
    backgroundColor: '#FFFFFF', // Beyaz kutu
    padding: 24, // İç boşluk
    borderRadius: 12, // Köşe yuvarlaklığı
    shadowColor: '#000', // Gölge rengi
    shadowOpacity: 0.1, // Gölge opaklığı
    shadowRadius: 10, // Gölge bulanıklığı
    shadowOffset: { width: 0, height: 4 }, // Gölge yönü
    elevation: 5, // Android için gölge
    width: '90%', // Kutu genişliği (ekranın %90'ı)
    maxWidth: 400, // Büyük ekranlarda çok genişlemesin
    alignItems: 'center', // İçindeki elemanları (buton, text vs) ortala
  },
  input: {
    width: '100%', // Kutu genişliğini doldur
    paddingVertical: 12,
    paddingHorizontal: 15, // İç boşluklar
    marginVertical: 10, // Üst ve alt dış boşluk
    borderWidth: 1, // Kenarlık kalınlığı
    borderColor: '#D1D5DB', // Kenarlık rengi (açık gri)
    borderRadius: 8, // Köşe yuvarlaklığı
    fontSize: 16, // Yazı boyutu
    color: '#111827', // Yazı rengi (koyu gri)
  },
  button: {
    backgroundColor: '#2563EB', // Buton rengi (mavi)
    paddingVertical: 14,
    paddingHorizontal: 20, // İç boşluklar
    borderRadius: 25, // Daha yuvarlak köşeler
    marginTop: 15, // Üst dış boşluk
    alignItems: 'center', // Yazıyı ortala (yatay)
    justifyContent: 'center', // Yazıyı ortala (dikey)
    width: '100%', // Kutu genişliğini doldur
    elevation: 2, // Hafif buton gölgesi (Android)
  },
  buttonText: {
    color: '#FFFFFF', // Buton yazı rengi (beyaz)
    fontWeight: 'bold',
    fontSize: 16,
  },
  // --- Footer Stilleri ---
  footerTextView: { // "Hesabınız yok mu? Kayıt Ol" satırını saran View
    flexDirection: 'row', // Elemanları yan yana diz
    justifyContent: 'center', // Yatayda ortala
    alignItems: 'center', // Dikeyde ortala
    marginTop: 20, // Buton ile arasına boşluk
    width: '100%', // Ortalamanın düzgün çalışması için genişlik
  },
  footerText: { // "Hesabınız yok mu?" yazısı
    color: '#6B7280', // Normal metin rengi (gri)
    fontSize: 14,
  },
  linkText: { // "Kayıt Ol" yazısı
    color: '#2563EB', // Link rengi (mavi, butonla aynı)
    fontWeight: 'bold', // Kalın yazı
    fontSize: 14, // Normal metinle aynı boyutta
    marginLeft: 5, // Solundaki yazı ile arasında boşluk
  },
  // --- ---
});

export default styles;
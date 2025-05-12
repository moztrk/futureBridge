import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Supabase Authentication ile giriş yap
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Giriş hatası: ' + error.message);
      setLoading(false);
      return;
    }

    // Giriş başarılı olduğunda (error yoksa ve data.user doluysa)
    if (data && data.user) { // data objesinin varlığını da kontrol etmek iyi olabilir
      alert('Giriş başarılı!');

      // *** JWT TOKEN BURADA! ***
      console.log('Giriş Başarılı Data:', data); // İsteğe bağlı: Tüm data objesini görmek isterseniz
      if (data.session && data.session.access_token) {
         const jwtToken = data.session.access_token;
         console.log('-----------------------------------------');
         console.log('SUPABASE JWT TOKEN (TEST İÇİN KOPYALA):');
         console.log(jwtToken); // <<-- BU SATIR TOKENI KONSOLA YAZAR!
         console.log('-----------------------------------------');

         // *** Yönlendirmeden önce tokenı buradan kopyalayabilirsiniz! ***

      } else {
         console.warn('Giriş başarılı görünüyor ancak session veya access_token data objesinde bulunamadı.');
      }

      // Yönlendirme
      navigate('/home');

    } else {
        // Başarılı response geldi ama user objesi gelmediyse (nadiren olur)
        console.warn("Giriş işlemi tamamlandı ancak kullanıcı bilgisi dönmedi.", data);
         // Hata yok ama kullanıcı da yoksa ne yapılacağına karar verin
        alert('Giriş işlemi beklenenden farklı sonuçlandı.');
    }


    setLoading(false);
  };

  return (
    <div className="auth-container">
      {/* Sol Taraf - Login */}
      <div className="auth-section">
        <div className="auth-box">
          <h2>Giriş Yap</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email adresinizi girin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Şifrenizi girin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
          <p>Hesabınız yok mu? <Link to="/signup">Kayıt Ol</Link></p>
        </div>
      </div>

      {/* Sağ Taraf - Tanıtım Bölümü */}
      <div className="intro-section">
        <h1>Menture</h1>
        <p>
          Kişiselleştirilmiş kariyer önerileri ve yapay zeka destekli mentorluk ile geleceğinizi şekillendirin.
        </p>
        <button className="cta-button">Daha Fazla Keşfet</button>
      </div>
    </div>
  );
};

export default Login;
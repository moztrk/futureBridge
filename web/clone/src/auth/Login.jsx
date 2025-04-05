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

    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Giriş hatası: ' + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      alert('Giriş başarılı!');
      navigate('/home'); 
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
        <h1>Future</h1>
        <p>
          Kişiselleştirilmiş kariyer önerileri ve yapay zeka destekli mentorluk ile geleceğinizi şekillendirin.
        </p>
        <button className="cta-button">Daha Fazla Keşfet</button>
      </div>
    </div>
  );
};

export default Login;

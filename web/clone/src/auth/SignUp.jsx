import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Şifreler eşleşmiyor!');
      return;
    }
    console.log('Kayıt olunuyor:', { email, password });
  };

  return (
    <div className="auth-container">
      {/* Sol Taraf - Kayıt Ol */}
      <div className="auth-section">
        <div className="auth-box">
          <h2>Kayıt Ol</h2>
          <form onSubmit={handleSignUp}>
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
            <input
              type="password"
              placeholder="Şifreyi tekrar girin"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit">Kayıt Ol</button>
          </form>
          <p>Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link></p>
        </div>
      </div>

      {/* Sağ Taraf - Tanıtım Bölümü */}
      <div className="intro-section">
        <h1>Future</h1>
        <p>
          Yapay zeka destekli mentorluk ile hedeflerinize ulaşmak için geleceğe bir adım atın.
        </p>
        <button className="cta-button">Daha Fazla Keşfet</button>
      </div>
    </div>
  );
};

export default SignUp;

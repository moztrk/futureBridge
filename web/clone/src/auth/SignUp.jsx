import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../auth/Auth.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('❌ Şifreler eşleşmiyor!');
      return;
    }

    setLoading(true);

    // Supabase Authentication ile kullanıcıyı kaydet
    const { data, error } = await supabase.auth.signUp({
      email,
      password,  // Supabase kendi hash'leyecek
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    
    if (user) {
      // Kullanıcıyı "users" tablosuna ekle
      const { error: insertError } = await supabase.from('users').insert([
        {
          id: user.id,
          email: user.email,
          username: email.split('@')[0],  
          password: password,  // Bcrypt yerine düz şifre kaydediyoruz (Supabase hash'leyecek)
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]);

      if (insertError) {
        alert('Veritabanı hatası: ' + insertError.message);
      } else {
        alert('✅ Kayıt başarılı! Lütfen e-postanızı doğrulayın.');
        navigate('/login');
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
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
            <button type="submit" disabled={loading}>
              {loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
            </button>
          </form>
          <p>Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
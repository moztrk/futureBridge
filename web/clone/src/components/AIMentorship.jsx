import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AIMentorship.css";

const API_BASE_URL = 'http://10.196.191.59:8000/api';

const AIMentorship = ({ userToken }) => {
  const { mentorId } = useParams();
  const navigate = useNavigate();

  const [userCareerInput, setUserCareerInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);
  const [isSharingPost, setIsSharingPost] = useState(false);

  const handleBookAppointment = () => {
    console.log('Randevu Alındı!');
    alert('Randevu alma özelliği şu anda aktif değil.');
  };

  const handleGetSuggestion = async () => {
    if (!userCareerInput.trim()) {
      alert("Lütfen kariyer hedefleriniz veya durumunuz hakkında bilgi girin.");
      return;
    }

    if (!userToken) {
      setSuggestionError("Kimlik doğrulama token'ı bulunamadı. Lütfen giriş yapın.");
      console.error("Kimlik doğrulama token'ı bulunamadı.");
      navigate('/login');
      return;
    }

    setLoadingSuggestion(true);
    setSuggestionError(null);
    setAiSuggestion('');

    try {
      const response = await fetch(`${API_BASE_URL}/ai-suggestion/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          user_input: userCareerInput,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        const errorMessage = errorBody.detail || JSON.stringify(errorBody) || `API isteği başarısız oldu: ${response.status}`;
        console.error("Backend AI Öneri Hatası:", response.status, errorBody);
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      const suggestionText = responseData?.suggestion_text;

      if (suggestionText) {
        setAiSuggestion(suggestionText);
      } else {
        setSuggestionError("AI'dan öneri alınamadı veya boş yanıt döndü. Lütfen tekrar deneyin.");
        console.error("Backend AI Öneri Yanıtı beklenenden farklı veya boş:", responseData);
      }

    } catch (err) {
      console.error("AI Öneri Çekerken Hata:", err);
      setSuggestionError(`Öneri alınırken bir hata oluştu: ${err.message}`);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleShareAsPost = async () => {
    if (!aiSuggestion.trim() || isSharingPost) return;

    if (!userToken) {
      alert("Bu öneriyi paylaşmak için giriş yapmalısınız.");
      return;
    }

    setIsSharingPost(true);
    try {
      const response = await fetch(`${API_BASE_URL}/posts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          content: `AI Kariyer Yol Haritası:\n\n${aiSuggestion}`,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `Gönderi paylaşılırken hata oluştu (HTTP ${response.status})`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.detail || JSON.stringify(errorJson);
        } catch {
          errorMessage = errorBody || errorMessage;
        }
        console.error("Gönderi paylaşma backend hatası:", response.status, errorMessage);
        throw new Error(errorMessage);
      }

      const sharedPost = await response.json();
      console.log("Gönderi başarıyla paylaşıldı:", sharedPost);
      alert("Yol haritası başarıyla gönderi olarak paylaşıldı!");
      navigate('/home');

    } catch (err) {
      console.error("Gönderi paylaşma hatası:", err);
      alert(`Gönderi paylaşılırken bir hata oluştu: ${err.message}`);
    } finally {
      setIsSharingPost(false);
    }
  };

  return (
    <div className="mentorship-container">
      <div className="mentorship-header">
        <h1>AI Mentorluk Paneli</h1>
        <p>Kariyer hedeflerinize göre kişiselleştirilmiş yol haritaları oluşturun.</p>
      </div>

      <div className="ai-suggestion-panel">
        <h2>AI Kariyer Önerisi Alın</h2>
        <p>Kariyer hedeflerinizi, mevcut becerilerinizi veya öğrenmek istediğiniz konuları girin, AI size özel bir yol haritası sunsun.</p>

        <div className="ai-input-area">
          <textarea
            className="career-input-textarea"
            placeholder="Örn: Frontend geliştirici olmak istiyorum, mevcut becerilerim HTML, CSS, JS. Ne öğrenmeliyim? Veya: Veri bilimi alanında kariyer yapmak için hangi sertifikalar faydalı olur?"
            value={userCareerInput}
            onChange={(e) => setUserCareerInput(e.target.value)}
            rows="6"
            disabled={loadingSuggestion || isSharingPost}
          ></textarea>
          <button
            className="get-suggestion-button"
            onClick={handleGetSuggestion}
            disabled={loadingSuggestion || !userCareerInput.trim() || isSharingPost}
          >
            {loadingSuggestion ? 'Öneri Alınıyor...' : 'Öneri Al'}
          </button>
        </div>

        {loadingSuggestion && <div className="suggestion-loading">Öneri hazırlanıyor...</div>}
        {suggestionError && <div className="suggestion-error">Hata: {suggestionError}</div>}

        {aiSuggestion && (
          <div className="ai-suggestion-output">
            <h3>AI'dan Gelen Öneri:</h3>
            <div dangerouslySetInnerHTML={{ __html: aiSuggestion.replace(/\n/g, '<br>') }}></div>
            <button
              className="share-as-post-button"
              onClick={handleShareAsPost}
              disabled={isSharingPost || loadingSuggestion || !userToken}
            >
              {isSharingPost ? 'Paylaşılıyor...' : 'Gönderi Olarak Paylaş'}
            </button>
          </div>
        )}

        {aiSuggestion && (
          <div className="visual-roadmap-section">
            <h3>Kariyer Yol Haritası (Görsel):</h3>
            <div className="visual-roadmap-placeholder">
              <p>Görsel yol haritası burada gösterilecektir.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mentorship-body">
        <div className="mentor-card">
          <h2>Mentor: Dr. Ahmet Yılmaz</h2>
          <p>Yapay zeka ve veri bilimi uzmanı</p>
          <button className="cta-button" onClick={handleBookAppointment}>Randevu Al</button>
        </div>

        <div className="mentor-card">
          <h2>Mentor: Elif Demir</h2>
          <p>Makine öğrenimi ve derin öğrenme uzmanı</p>
          <button className="cta-button" onClick={handleBookAppointment}>Randevu Al</button>
        </div>
      </div>

      <div className="mentorship-footer">
        <p>AI Mentorluk Paneli, kariyerinizi yönlendirecek bir yol haritası sunar.</p>
      </div>
    </div>
  );
};

export default AIMentorship;
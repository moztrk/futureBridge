import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AIMentorship.css";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Read API key from .env
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`; // <-- Model adı güncellendi



const AIMentorship = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();

  const [userCareerInput, setUserCareerInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);

  const handleBookAppointment = () => {
    console.log('Randevu Alındı!');
    alert('Randevu alma özelliği şu anda aktif değil.');
  };

  const handleGetSuggestion = async () => {
    if (!userCareerInput.trim()) {
      alert("Lütfen kariyer hedefleriniz veya durumunuz hakkında bilgi girin.");
      return;
    }

    if (!GEMINI_API_KEY) {
      setSuggestionError("Gemini API anahtarı yüklenemedi. .env dosyanızı kontrol edin.");
      console.error("Gemini API anahtarı .env dosyasından yüklenemedi.");
      return;
    }

    setLoadingSuggestion(true);
    setSuggestionError(null);
    setAiSuggestion('');

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `Kariyer hedeflerim/durumum hakkında bilgi: "${userCareerInput}". Bana bu konuda detaylı bir kariyer yol haritası veya öneri sunar mısın? Türkçe yanıt ver. Yanıtını Markdown formatında düzenle.` }
              ]
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        const errorMessage = errorBody.error?.message || JSON.stringify(errorBody) || `API isteği başarısız oldu: ${response.status}`;
        console.error("Gemini API HTTP Hatası:", response.status, errorBody);
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log("Gemini API Yanıtı:", responseData);

      const suggestionText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (suggestionText) {
        setAiSuggestion(suggestionText);
      } else {
        setSuggestionError("AI'dan öneri alınamadı veya boş yanıt döndü. Lütfen tekrar deneyin.");
        console.error("Gemini API yanıt formatı beklenenden farklı veya boş:", responseData);
      }
    } catch (err) {
      console.error("AI Öneri Çekerken Hata:", err);
      setSuggestionError(`Öneri alınırken bir hata oluştu: ${err.message}`);
    } finally {
      setLoadingSuggestion(false);
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
            placeholder="Örn: Frontend geliştirici olmak istiyorum, mevcut becerilerim HTML, CSS, JS. Ne öğrenmeliyim?"
            value={userCareerInput}
            onChange={(e) => setUserCareerInput(e.target.value)}
            rows="6"
            disabled={loadingSuggestion}
          ></textarea>
          <button
            className="get-suggestion-button"
            onClick={handleGetSuggestion}
            disabled={loadingSuggestion || !userCareerInput.trim()}
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

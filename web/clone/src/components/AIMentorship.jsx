import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AIMentorship.css";

const AIMentorship = () => {
  const { mentorId } = useParams(); // mentorId parametresini almak için useParams kullanıyoruz
  const navigate = useNavigate(); // sayfa yönlendirmeleri için navigate kullanıyoruz

  const handleBookAppointment = () => {
    
    navigate(`/book-appointment/${mentorId}`);
  };

  return (
    <div className="mentorship-container">
      <div className="mentorship-header">
        <h1>AI Mentorluk Paneli</h1>
        <p>Kariyer hedeflerinize göre kişiselleştirilmiş yol haritaları oluşturun.</p>
      </div>

      <div className="mentorship-body">
        {/* Mentor Kartları */}
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

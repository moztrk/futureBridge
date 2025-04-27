import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./auth/Login";
import SignUp from "./auth/SignUp";
import Home from "./components/Home";
import Profile from "./components/Profile"; // Profil component'ini import et
import AIMentorship from "./components/AIMentorship"; // AI Mentorluk component'ini import et

// Yeni sayfalar için basit placeholder componentler
const Messages = () => <div><h2>Mesajlar Sayfası</h2><p>Bu sayfa henüz geliştirilmedi.</p></div>;
const Notifications = () => <div><h2>Bildirimler Sayfası</h2><p>Bu sayfa henüz geliştirilmedi.</p></div>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Giriş ve Kayıt Sayfaları */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Ana Sayfa */}
        <Route path="/home" element={<Home />} />

        {/* Profil Sayfası - Dinamik userId parametresi ile */}
        <Route path="/profile/:userId" element={<Profile />} />

        {/* AI Mentorluk Sayfası */}
        <Route path="/mentorship" element={<AIMentorship />} />

        {/* Mesajlar Sayfası (Yeni) */}
        <Route path="/messages" element={<Messages />} />

        {/* Bildirimler Sayfası (Yeni) */}
        <Route path="/notifications" element={<Notifications />} />

        {/* Eşleşmeyen yollar için belki bir 404 sayfası */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Router>
  );
}

export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./auth/Login";
import SignUp from "./auth/SignUp";
import Home from "./components/Home";
import Profile from "./components/Profile";
import AIMentorship from "./components/AIMentorship";

// Placeholder componentler
const Messages = () => (
  <div>
    <h2>Mesajlar Sayfası</h2>
    <p>Bu sayfa henüz geliştirilmedi.</p>
  </div>
);

const Notifications = () => (
  <div>
    <h2>Bildirimler Sayfası</h2>
    <p>Bu sayfa henüz geliştirilmedi.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Uygulama başladığında doğrudan /login'e yönlendir */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Giriş ve Kayıt Sayfaları */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Ana Sayfa */}
        <Route path="/home/*" element={<Home />} />

        {/* Aşağıdaki route'lar Home bileşeni içinde yönlendiriliyorsa, burada yoruma alınabilir */}
        {/*
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/mentorship" element={<AIMentorship />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        */}

        {/* Eşleşmeyen yollar için 404 sayfası tanımlanabilir */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
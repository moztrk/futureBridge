import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import Home from "./components/Home";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/*"
          element={
            <>
              <Routes>
                <Route path="/home" element={<Home />} />
                {/* Removed routes for Profile, Feed, and AIMentorship */}
              </Routes>
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

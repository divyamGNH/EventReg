import axios from "axios";
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Register from "./components/Register.jsx";
import Login from "./components/Login.jsx";
import Home from "./components/Home.jsx";

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/auth/check", { withCredentials: true })
      .then((res) => {
        setAuthUser(res.data?.user || null);
      })
      .catch(() => {
        setAuthUser(null);
      })
      .finally(() => {
        setIsAuthResolved(true);
      });
  }, []);

  if (!isAuthResolved) return <div>Loading...</div>;

  const isAuthenticated = Boolean(authUser?.userId);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/login" />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/home" /> : <Register setAuthUser={setAuthUser} />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/home" /> : <Login setAuthUser={setAuthUser} />}
        />
        <Route
          path="/home"
          element={isAuthenticated ? <Home user={authUser} setAuthUser={setAuthUser} /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import UploadPage from './pages/UploadPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AppLayout from './components/layout/AppLayout';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    setIsAuthenticated(true);
    localStorage.setItem('authToken', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
  };

  // Check if token is still valid on app load
  useEffect(() => {
    if (token) {
      // In a real app, you'd validate the token with the backend
      // For now, we'll assume it's valid if it exists
      setIsAuthenticated(true);
    }
  }, [token]);

  return (
    <Router>
      <div className="App min-h-screen bg-gray-100">
        {isAuthenticated && token ? (
          <AppLayout onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Dashboard token={token}/>} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        ) : (
          <LoginForm onLogin={handleLogin} />
        )}
      </div>
    </Router>
  );
}

export default App;

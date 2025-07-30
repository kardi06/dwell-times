import React, { useState, useEffect } from 'react';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';

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
    <div className="App min-h-screen bg-gray-100">
      {isAuthenticated && token ? (
        <Dashboard token={token} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;

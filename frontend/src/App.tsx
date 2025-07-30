import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isAuthenticated && token ? (
        <Dashboard token={token} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </ThemeProvider>
  );
}

export default App;

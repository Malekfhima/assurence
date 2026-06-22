import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Adherents from './pages/Adherents';
import Bulletins from './pages/Bulletins';
import Bordereaux from './pages/Bordereaux';
import { isAuthenticated } from './apiService';
import './App.css';

// Composant de protection des routes
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/adherents" element={<Adherents />} />
          <Route path="/bulletins" element={<Bulletins />} />
          <Route path="/bordereaux" element={<Bordereaux />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

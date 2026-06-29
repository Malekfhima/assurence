import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Adherents from './pages/Adherents';
import AdherentDetails from './pages/AdherentDetails';
import Bulletins from './pages/Bulletins';
import Bordereaux from './pages/Bordereaux';
import Parametres from './pages/Parametres';

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/adherents" element={<Adherents />} />
          <Route path="/adherents/:id" element={<AdherentDetails />} />
          <Route path="/bulletins" element={<Bulletins />} />
          <Route path="/bordereaux" element={<Bordereaux />} />
          <Route path="/parametres" element={<Parametres />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

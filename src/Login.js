import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from './apiService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    mot_de_passe: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const { ok, data } = await loginApi(formData);
      
      if (ok && data.success) {
        setMessage('Connexion réussie ! Redirection...');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setMessage(data.message || 'Erreur lors de la connexion.');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ background: '#f0f4f8', padding: 0 }}>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", minHeight: "100vh", width: "100%" }}>
        <div style={{ flex: "0 0 45%", background: "#0F2942", padding: "60px 80px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "64px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#1B4D7E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-shield-check" style={{ fontSize: "20px", color: "#E6F1FB" }} aria-hidden="true"></i>
              </div>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#FFFFFF", letterSpacing: "0.2px" }}>Assurances Group</span>
            </div>
            <p style={{ fontSize: "28px", fontWeight: "500", color: "#FFFFFF", lineHeight: "1.35", margin: "0 0 16px" }}>Espace agent</p>
            <p style={{ fontSize: "14px", color: "#9FB6CC", lineHeight: "1.7", margin: "0", maxWidth: "320px" }}>Gestion des adhérents, bulletins de soin et bordereaux d'envoi.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="ti ti-users" style={{ fontSize: "16px", color: "#5A8FC0" }} aria-hidden="true"></i>
              <span style={{ fontSize: "13px", color: "#B8CCDE" }}>Suivi des adhérents et sous-adhérents</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="ti ti-file-description" style={{ fontSize: "16px", color: "#5A8FC0" }} aria-hidden="true"></i>
              <span style={{ fontSize: "13px", color: "#B8CCDE" }}>Bulletins de soin centralisés</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="ti ti-chart-bar" style={{ fontSize: "16px", color: "#5A8FC0" }} aria-hidden="true"></i>
              <span style={{ fontSize: "13px", color: "#B8CCDE" }}>Statistiques en temps réel</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, background: "#F7F9FB", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
          <form style={{ width: "100%", maxWidth: "340px" }} onSubmit={handleSubmit}>
            <p style={{ fontSize: "20px", fontWeight: "500", color: "#0F2942", margin: "0 0 6px" }}>Connexion</p>
            <p style={{ fontSize: "13px", color: "#5A6B7D", margin: "0 0 32px" }}>Connectez-vous avec votre identifiant agent.</p>
            
            {message && <div style={{color: message.includes('réussie') ? 'green' : 'red', marginBottom: '15px', fontSize: '13px', background: message.includes('réussie') ? '#d1fae5' : '#fee2e2', padding: '10px', borderRadius: '6px'}}>{message}</div>}

            <label style={{ fontSize: "12px", fontWeight: "500", color: "#2C3E50", display: "block", marginBottom: "6px" }}>Identifiant (Email)</label>
            <div style={{ position: "relative", marginBottom: "18px" }}>
              <i className="ti ti-user" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "#8FA3B5" }} aria-hidden="true"></i>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="agent.dupont@stipe.tn" 
                required
                style={{ width: "100%", height: "40px", paddingLeft: "36px", borderRadius: "6px", border: "1px solid #D5DEE6", background: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }} 
              />
            </div>

            <label style={{ fontSize: "12px", fontWeight: "500", color: "#2C3E50", display: "block", marginBottom: "6px" }}>Mot de passe</label>
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <i className="ti ti-lock" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "#8FA3B5" }} aria-hidden="true"></i>
              <input 
                type="password" 
                name="mot_de_passe"
                value={formData.mot_de_passe}
                onChange={handleChange}
                placeholder="••••••••" 
                required
                style={{ width: "100%", height: "40px", paddingLeft: "36px", borderRadius: "6px", border: "1px solid #D5DEE6", background: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }} 
              />
              <i className="ti ti-eye" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "#8FA3B5", cursor: "pointer" }} aria-hidden="true"></i>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
              <span style={{ fontSize: "12px", color: "#1B4D7E", cursor: "pointer" }}>Mot de passe oublié ?</span>
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", height: "42px", background: "#0F2942", color: "#FFFFFF", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "500", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Connexion...' : 'Se connecter'}
              {!loading && <i className="ti ti-arrow-right" style={{ fontSize: "16px" }} aria-hidden="true"></i>}
            </button>

            <p style={{ fontSize: "11px", color: "#8FA3B5", textAlign: "center", marginTop: "28px" }}>Accès réservé aux agents Assurances Group</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

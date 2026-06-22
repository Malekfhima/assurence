import React, { useState, useEffect } from 'react';
import { Users, FileText, Send, Activity, TrendingUp } from 'lucide-react';
import { fetchApi } from '../apiService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_adherents: 0,
    bulletins_traites: 0,
    total_bordereaux: 0,
    montant_total_rembourse: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetchApi('/dashboard/stats');
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      label: 'Total Adhérents',
      value: stats.total_adherents,
      icon: <Users size={26} />,
      colorClass: 'blue',
      suffix: ''
    },
    {
      label: 'Bulletins Traités',
      value: stats.bulletins_traites,
      icon: <FileText size={26} />,
      colorClass: 'green',
      suffix: ''
    },
    {
      label: "Bordereaux d'Envoi",
      value: stats.total_bordereaux,
      icon: <Send size={26} />,
      colorClass: 'orange',
      suffix: ''
    },
    {
      label: 'Montant Remboursé',
      value: Number(stats.montant_total_rembourse).toLocaleString('fr-TN', { minimumFractionDigits: 2 }),
      icon: <Activity size={26} />,
      colorClass: 'purple',
      suffix: ' DT'
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.95rem' }}>
            Vue d'ensemble de votre activité
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px' }}>
          <TrendingUp size={16} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Données en temps réel</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#64748b' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
            <p>Chargement des statistiques...</p>
          </div>
        </div>
      ) : (
        <div className="stats-grid">
          {cards.map((card, i) => (
            <div key={i} className="card stat-card">
              <div className={`stat-icon ${card.colorClass}`}>
                {card.icon}
              </div>
              <div className="stat-info">
                <h3>{card.label}</h3>
                <p>{card.value}{card.suffix}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Activity size={20} style={{ color: '#2563eb' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Activité Récente</h3>
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          {stats.total_adherents > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                  <strong style={{ color: '#0f172a' }}>{stats.total_adherents} adhérents</strong> enregistrés dans la base de données
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                  <strong style={{ color: '#0f172a' }}>{stats.bulletins_traites} bulletins</strong> ont été traités à ce jour
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }}></div>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                  Montant total remboursé : <strong style={{ color: '#0f172a' }}>{Number(stats.montant_total_rembourse).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} DT</strong>
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Aucune activité récente.</p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

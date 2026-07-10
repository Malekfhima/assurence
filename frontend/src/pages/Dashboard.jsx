import { useState, useEffect } from 'react';
import api from '../services/api';

const defaultStats = {
  total_adherents: 0, total_sous_adherents: 0, total_bulletins: 0, total_bordereaux: 0,
  bulletins_en_attente: 0, bulletins_valides: 0, bulletins_rejetes: 0,
  montant_total_rembourse: '0',
};

export default function Dashboard() {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) setStats(res.data.data);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Erreur lors du chargement des statistiques.';
        console.error('Erreur chargement stats:', err);
        showNotif(msg, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Adhérents', value: stats.total_adherents, color: 'bg-blue-500', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Sous-adhérents', value: stats.total_sous_adherents, color: 'bg-emerald-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Bulletins', value: stats.total_bulletins, color: 'bg-violet-500', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Bordereaux', value: stats.total_bordereaux, color: 'bg-amber-500', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: 'Montant remboursé', value: 'montant', color: 'bg-emerald-500', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  ];

  const statusCards = [
    { label: 'En attente', value: stats.bulletins_en_attente, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Validés', value: stats.bulletins_valides, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Rejetés', value: stats.bulletins_rejetes, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { label: 'Sous contrôle', value: stats.bulletins_sous_controle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  ];

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notification.msg}
        </div>
      )}

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.color} bg-opacity-10 flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${card.color.replace('bg-', 'text-')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                </svg>
              </div>
            </div>
            {card.value === 'montant' ? (
              <div className="text-xl font-bold text-emerald-600">
                {Number(stats.montant_total_rembourse).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            )}
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Bulletin status cards */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">État des bulletins de soin</h2>
        <div className="grid grid-cols-4 gap-4">
          {statusCards.map((card) => (
            <div key={card.label} className={`${card.bg} ${card.border} border rounded-lg p-4 text-center`}>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs text-gray-600 mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../services/api';

const defaultStats = {
  total_adherents: 0, total_sous_adherents: 0, total_bulletins: 0, total_bordereaux: 0,
  bulletins_en_attente: 0, bulletins_valides: 0, bulletins_rejetes: 0,
  montant_total_rembourse: '0',
  annees_disponibles: [],
};

const icons = {
  adherents: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  sousAdherents: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  bulletins: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  bordereaux: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  montant: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v9.5m-15 0h.05m6 0h.05',
  enAttente: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  valides: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  rejetes: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  sousControle: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
};

export default function Dashboard() {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee] = useState(() => String(new Date().getFullYear()));
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchStats = async (selectedAnnee) => {
    try {
      const params = {};
      if (selectedAnnee) params.annee = selectedAnnee;
      const res = await api.get('/dashboard/stats', { params });
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors du chargement des statistiques.';
      console.error('Erreur chargement stats:', err);
      showNotif(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(annee);
  }, [annee]);

  const handleAnneeChange = (e) => {
    setAnnee(e.target.value);
  };

  const cards = [
    { label: 'Adhérents', value: stats.total_adherents, gradient: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/20', icon: icons.adherents },
    { label: 'Sous-adhérents', value: stats.total_sous_adherents, gradient: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/20', icon: icons.sousAdherents },
    { label: 'Bulletins', value: stats.total_bulletins, gradient: 'from-violet-400 to-violet-600', shadow: 'shadow-violet-500/20', icon: icons.bulletins },
    { label: 'Bordereaux', value: stats.total_bordereaux, gradient: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/20', icon: icons.bordereaux },
    { label: 'Montant remboursé', value: 'montant', gradient: 'from-teal-400 to-teal-600', shadow: 'shadow-teal-500/20', icon: icons.montant },
  ];

  const statusCards = [
    { label: 'En attente', value: stats.bulletins_en_attente, gradient: 'from-amber-400 to-amber-600', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', accent: 'border-l-amber-500', icon: icons.enAttente },
    { label: 'Validés', value: stats.bulletins_valides, gradient: 'from-emerald-400 to-emerald-600', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'border-l-emerald-500', icon: icons.valides },
    { label: 'Rejetés', value: stats.bulletins_rejetes, gradient: 'from-red-400 to-red-600', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', accent: 'border-l-red-500', icon: icons.rejetes },
    { label: 'Sous contrôle', value: stats.bulletins_sous_controle, gradient: 'from-purple-400 to-purple-600', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', accent: 'border-l-purple-500', icon: icons.sousControle },
  ];

  // Build year options from available years + current year + some history
  const yearOptions = (() => {
    const years = [...(stats.annees_disponibles || [])];
    const currentYear = new Date().getFullYear();
    if (!years.includes(currentYear)) years.push(currentYear);
    // Include some past years if no data
    for (let y = currentYear - 5; y <= currentYear; y++) {
      if (!years.includes(y)) years.push(y);
    }
    return years.sort((a, b) => b - a); // descending
  })();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-200 mb-3"></div>
              <div className="h-7 w-20 bg-gray-200 rounded mb-1"></div>
              <div className="h-4 w-16 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notification.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
        </div>
        {/* Year selector */}
        <div className="relative">
          <select
            value={annee}
            onChange={handleAnneeChange}
            className="px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none cursor-pointer"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="group bg-white rounded-xl border border-gray-200 p-4 lg:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.shadow} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card) => (
            <div
              key={card.label}
              className={`group ${card.bg} ${card.border} border border-l-4 ${card.accent} rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} shadow-sm flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                  <div className="text-xs text-gray-500">{card.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

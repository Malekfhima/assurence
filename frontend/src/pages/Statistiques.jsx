import { useState, useEffect } from 'react';
import api from '../services/api';

const defaultStats = {
  total_adherents: 0, total_sous_adherents: 0, total_bulletins: 0, total_bordereaux: 0,
  bulletins_en_attente: 0, bulletins_valides: 0, bulletins_rejetes: 0,
  montant_total_rembourse: '0',
};

export default function Statistiques() {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) setStats(res.data.data);
      } catch (err) {
        console.error('Erreur chargement stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Adhérents', value: stats.total_adherents, color: 'bg-blue-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Sous-adhérents', value: stats.total_sous_adherents, color: 'bg-emerald-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Bulletins total', value: stats.total_bulletins, color: 'bg-violet-500', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Bordereaux', value: stats.total_bordereaux, color: 'bg-amber-500', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Statistiques</h1>
        <p className="text-sm text-gray-500 mt-1">Indicateurs clés et performance</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Chargement...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${card.color} bg-opacity-10 flex items-center justify-center`}>
                    <svg className={`w-5 h-5 ${card.color.replace('bg-', 'text-')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition des bulletins */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Répartition des bulletins</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-sm text-amber-800">En attente</span>
                  <span className="text-sm font-semibold text-amber-700">{stats.bulletins_en_attente}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-sm text-emerald-800">Validés</span>
                  <span className="text-sm font-semibold text-emerald-700">{stats.bulletins_valides}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-sm text-red-800">Rejetés</span>
                  <span className="text-sm font-semibold text-red-700">{stats.bulletins_rejetes}</span>
                </div>
              </div>
            </div>

            {/* Montant total */}
            <div className="bg-gradient-to-br from-[#0F2942] to-blue-800 rounded-xl p-5 text-white flex flex-col justify-center">
              <div className="text-sm text-blue-200/70 mb-2">Montant total remboursé</div>
              <div className="text-3xl font-bold">
                {Number(stats.montant_total_rembourse).toLocaleString('fr-TN', { style: 'currency', currency: 'TND' })}
              </div>
              <div className="text-xs text-blue-200/50 mt-2">Cumul des bulletins validés</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

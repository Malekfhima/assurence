import { useState, useEffect } from 'react';
import api from '../services/api';

const ACTION_LABELS = {
  'création': { label: 'Création', icon: '➕', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  'envoi': { label: 'Envoi', icon: '✈️', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  'vérification': { label: 'Vérification PDF', icon: '📄', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  'suppression': { label: 'Suppression', icon: '🗑️', color: 'text-red-600 bg-red-50 border-red-200' },
};

function ActionBadge({ action }) {
  const config = ACTION_LABELS[action] || { label: action, icon: '📋', color: 'text-gray-600 bg-gray-50 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 font-medium min-w-[90px]">{label} :</span>
      <span className="text-gray-700">{Array.isArray(value) ? value.join(', ') || '-' : String(value)}</span>
    </div>
  );
}

function LogDetails({ details, action }) {
  if (!details) return null;

  if (action === 'vérification') {
    return (
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-3 text-xs">
          {details.valides > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">
              ✅ {details.valides} validé(s)
            </span>
          )}
          {details.rejetes > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
              ❌ {details.rejetes} rejeté(s)
            </span>
          )}
          {details.sous_controle > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
              🔍 {details.sous_controle} sous contrôle
            </span>
          )}
        </div>
        {details.montant_valide > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Montant validé : <strong>{Number(details.montant_valide).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</strong>
          </p>
        )}
        {details.non_trouves && details.non_trouves.length > 0 && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ {details.non_trouves.length} bulletin(s) non trouvé(s) : {details.non_trouves.join(', ')}
          </p>
        )}
      </div>
    );
  }

  if (action === 'création') {
    return (
      <div className="mt-2 space-y-1">
        <DetailRow label="N° Bordereau" value={details.numero_bordereau} />
        <DetailRow label="Bulletins" value={details.nb_bulletins} />
        {details.montant_total > 0 && (
          <p className="text-xs text-gray-500">
            Montant total : <strong>{Number(details.montant_total).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</strong>
          </p>
        )}
      </div>
    );
  }

  if (action === 'envoi') {
    return (
      <div className="mt-2">
        <DetailRow label="Date envoi" value={details.date_envoi} />
      </div>
    );
  }

  return null;
}

export default function LogHistory({ bordereauId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bordereauId) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/bordereaux/${bordereauId}/logs`);
        if (res.data.success) {
          setLogs(res.data.data);
        }
      } catch (err) {
        setError('Impossible de charger l\'historique.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [bordereauId]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <svg className="animate-spin w-6 h-6 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-xs text-gray-400 mt-2">Chargement de l'historique...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-xs text-red-500">{error}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-400">Aucun historique pour ce bordereau.</p>
        <p className="text-xs text-gray-300 mt-1">Les actions seront enregistrées ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log, index) => (
        <div
          key={log.id}
          className="relative pl-6 pb-3"
        >
          {/* Timeline line */}
          {index < logs.length - 1 && (
            <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-gray-200"></div>
          )}
          {/* Timeline dot */}
          <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 border-white shadow-sm bg-gray-200"></div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition">
            <div className="flex items-center justify-between">
              <ActionBadge action={log.action} />
              <div className="flex items-center gap-2">
                {log.user && (
                  <span className="text-xs text-gray-400">{log.user.email}</span>
                )}
                <span className="text-xs text-gray-400">{log.created_at}</span>
              </div>
            </div>
            <LogDetails details={log.details} action={log.action} />
          </div>
        </div>
      ))}
    </div>
  );
}

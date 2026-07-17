import { useState, useEffect } from 'react';
import api from '../services/api';

const ACTION_LABELS = {
  'création': { label: 'Création', icon: '➕', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  'envoi': { label: 'Envoi', icon: '✈️', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  'vérification': { label: 'Vérification PDF', icon: '📄', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  'suppression': { label: 'Suppression', icon: '🗑️', color: 'text-red-600 bg-red-50 border-red-200' },
  'réinitialisation': { label: 'Réinitialisation', icon: '🔄', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'correction_montant_rembourse': { label: 'Correction montants', icon: '🔧', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  'incoherence_details': { label: 'Incohérence détails', icon: '⚠️', color: 'text-red-600 bg-red-50 border-red-200' },
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

function VerificationStep({ step }) {
  const [open, setOpen] = useState(true);
  const stepNum = step.étape || step.etape || 0;
  const stepTitle = step.titre || step.title || `Étape ${stepNum}`;
  const details = step.détails || step.details || {};

  const isFirst = stepNum === 1;

  // Couleurs par étape
  const stepColors = [
    { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', text: 'text-blue-800' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-800' },
    { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-800' },
    { bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500', text: 'text-purple-800' },
  ];
  const colors = stepColors[(stepNum - 1) % stepColors.length];

  return (
    <div className={`border ${colors.border} ${colors.bg} rounded-lg overflow-hidden transition-all duration-200`}>
      {/* Header cliquable */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left ${colors.text} hover:opacity-80 transition`}
      >
        <span className={`w-6 h-6 rounded-full ${colors.dot} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
          {stepNum}
        </span>
        <span className="text-xs font-semibold flex-1">{stepTitle}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Contenu */}
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-1.5 text-xs text-gray-700 border-t border-inherit">
          {/* Détails génériques */}
          {Object.entries(details).filter(([k]) => !['bulletins_trouvés', 'bulletins_en_base', 'correspondances', 'lignes_pdf', 'détails_soins'].includes(k)).map(([key, val]) => (
            <DetailRow key={key} label={key.replace(/_/g, ' ')} value={val} />
          ))}

          {/* Bulletins trouvés dans le PDF (Étape 1) */}
          {details.bulletins_trouvés && details.bulletins_trouvés.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Bulletins extraits du PDF :
              </p>
              <div className="space-y-1">
                {details.bulletins_trouvés.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/70 rounded px-2 py-1 border border-gray-100">
                    <span className="font-medium text-gray-800">N°{b.numero}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      b.statut === 'Validé' ? 'bg-emerald-100 text-emerald-700' :
                      b.statut === 'Rejeté' ? 'bg-red-100 text-red-700' :
                      b.statut === 'Sous contrôle' ? 'bg-purple-100 text-purple-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {b.statut}
                    </span>
                    {b.montant !== null && b.montant !== undefined && (
                      <span className="ml-auto text-gray-600 font-medium">
                        {Number(b.montant).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bulletins en base (Étape 2) */}
          {details.bulletins_en_base && details.bulletins_en_base.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Bulletins en base de données :
              </p>
              <div className="space-y-1">
                {details.bulletins_en_base.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/70 rounded px-2 py-1 border border-gray-100">
                    <span className="font-medium text-gray-800">N°{b.numero}</span>
                    <span className="text-gray-500 text-[10px]">{b.adherent}</span>
                    <span className="ml-auto text-gray-600 font-medium">
                      {Number(b.montant_depense).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correspondances (Étape 2) */}
          {details.correspondances && details.correspondances.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Correspondances PDF ⇔ Base :
              </p>
              <div className="space-y-1.5">
                {details.correspondances.map((c, i) => (
                  <div key={i} className="bg-white/80 rounded-lg px-2.5 py-2 border border-gray-100 space-y-1">
                    {/* En-tête de correspondance */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{c.correspondance?.startsWith('✅') ? '✅' : c.correspondance?.startsWith('❌') ? '❌' : '•'}</span>
                      <span className="font-medium text-gray-800">N°{c.numero_pdf}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        c.statut_pdf === 'Validé' ? 'bg-emerald-100 text-emerald-700' :
                        c.statut_pdf === 'Rejeté' ? 'bg-red-100 text-red-700' :
                        c.statut_pdf === 'Sous contrôle' ? 'bg-purple-100 text-purple-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {c.statut_pdf}
                      </span>
                      {c.montant_rembourse_pdf !== null && c.montant_rembourse_pdf !== undefined && (
                        <span className="ml-auto text-emerald-600 font-medium">
                          {Number(c.montant_rembourse_pdf).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                        </span>
                      )}
                    </div>

                    {/* Détails adhérent et changement d'état */}
                    {c.adherent && (
                      <p className="text-[10px] text-gray-500 pl-6">
                        {c.adherent}
                        {c.ancien_etat && c.nouvel_etat && (
                          <span> · <span className={c.ancien_etat === c.nouvel_etat ? 'text-gray-400' : ''}>
                            {c.ancien_etat} → {c.nouvel_etat}
                          </span></span>
                        )}
                      </p>
                    )}

                    {/* Non trouvé */}
                    {c.correspondance?.includes('Non trouvé') && (
                      <p className="text-[10px] text-red-500 pl-6">
                        ⚠️ Ce bulletin n'existe pas dans le bordereau en base de données.
                      </p>
                    )}

                    {/* Détails des soins (Étape 2 - sous-bulletins) */}
                    {c.détails_soins && (
                      <div className="ml-4 mt-1.5 pt-1.5 border-t border-gray-100">
                        <p className="text-[10px] font-medium text-gray-500 mb-1">
                          Détails des soins extraits du PDF :
                        </p>

                        {/* Lignes PDF */}
                        {c.détails_soins.lignes_pdf && c.détails_soins.lignes_pdf.length > 0 && (
                          <div className="space-y-0.5">
                            {c.détails_soins.lignes_pdf.map((l, j) => (
                              <div key={j} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1 text-[10px]">
                                <span className="font-medium text-gray-700 w-10">{l.rubrique}</span>
                                <span className="text-gray-500">Frais:</span>
                                <span className="font-medium text-gray-800">{Number(l.frais).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</span>
                                <span className="text-gray-400">→</span>
                                <span className="text-gray-500">Remb.:</span>
                                <span className="font-medium text-emerald-600">{Number(l.rembourse).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Totaux */}
                        <div className="flex items-center gap-4 mt-1 text-[10px] text-gray-600">
                          {c.détails_soins.total_frais_pdf !== null && (
                            <span>Total frais: <strong>{Number(c.détails_soins.total_frais_pdf).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</strong></span>
                          )}
                          {c.détails_soins.total_rembourse_pdf !== null && (
                            <span>Total remb.: <strong className="text-emerald-600">{Number(c.détails_soins.total_rembourse_pdf).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</strong></span>
                          )}
                          <span className="text-gray-400">|</span>
                          <span>Mis à jour: <strong>{c.détails_soins.details_updated ?? 0}</strong></span>
                          <span>Créés: <strong>{c.détails_soins.details_created ?? 0}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LogDetails({ details, action }) {
  if (!details) return null;

  // AFFICHAGE DÉTAILLÉ : Vérification PDF avec étapes
  if (action === 'vérification' && details.étapes && details.étapes.length > 0) {
    return (
      <div className="mt-3 space-y-2">
        {/* Résumé en badges */}
        <div className="flex items-center flex-wrap gap-2 text-xs mb-2">
          {details.valides > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium border border-emerald-200">
              ✅ {details.valides} validé(s)
            </span>
          )}
          {details.rejetes > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium border border-red-200">
              ❌ {details.rejetes} rejeté(s)
            </span>
          )}
          {details.sous_controle > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium border border-purple-200">
              🔍 {details.sous_controle} sous contrôle
            </span>
          )}
          {details.montant_valide > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200">
              💰 {Number(details.montant_valide).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
            </span>
          )}
          {details.non_trouves && details.non_trouves.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-200">
              ⚠️ {details.non_trouves.length} non trouvé(s)
            </span>
          )}
        </div>

        {/* Étapes détaillées */}
        <div className="space-y-2">
          {details.étapes.map((step, i) => (
            <VerificationStep key={i} step={step} />
          ))}
        </div>
      </div>
    );
  }

  // AFFICHAGE CLASSIQUE : Vérification (sans étapes détaillées, fallback)
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

  if (action === 'réinitialisation') {
    return (
      <div className="mt-2 space-y-1">
        <DetailRow label="Bulletins réinitialisés" value={details.nb_bulletins} />
        {details.ancien_statut && details.nouveau_statut && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 font-medium min-w-[90px]">Changement :</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium border border-red-200">{details.ancien_statut}</span>
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200">{details.nouveau_statut}</span>
          </div>
        )}
        {details.montant_rembourse_effacé && (
          <p className="text-xs text-amber-600 mt-1">
            💰 Montants remboursés effacés (bulletins + détails)
          </p>
        )}
      </div>
    );
  }

  if (action === 'correction_montant_rembourse') {
    return (
      <div className="mt-2 space-y-1">
        <DetailRow label="Bulletins mis à jour" value={details.nb_bulletins} />
        <DetailRow label="Non trouvés" value={details.nb_non_trouves} />
        {details.montant_rembourse > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Montant remboursé : <strong>{Number(details.montant_rembourse).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</strong>
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

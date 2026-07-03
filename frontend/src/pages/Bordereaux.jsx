import { useState, useEffect } from 'react';
import api from '../services/api';

const statutBordereauBadge = (statut) => {
  const styles = {
    'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
    'Envoyé': 'bg-blue-50 text-blue-700 border-blue-200',
    'Traité': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return `inline-flex px-2 py-1 rounded-full text-xs font-medium border ${styles[statut] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

const etatBulletinBadge = (etat) => {
  const styles = {
    'Validé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Rejeté': 'bg-red-50 text-red-700 border-red-200',
    'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return `inline-flex px-2 py-1 rounded-full text-xs font-medium border ${styles[etat] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

function ConfirmModal({ open, onClose, onConfirm, message, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Confirmation</h3>
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50">Annuler</button>
            <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2">
              {loading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BordereauCreateModal({ bulletinsDisponibles, form, setForm, selectedBulletinIds, setSelectedBulletinIds, onSubmit, onClose, loading }) {
  const totalMontant = bulletinsDisponibles
    .filter(b => selectedBulletinIds.includes(b.id_bulletin))
    .reduce((sum, b) => sum + Number(b.montant_depense || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Créer un bordereau</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {/* Sélection des bulletins disponibles */}
        <div className="px-5 py-4 border-b border-gray-100">
          <label className="block text-xs font-medium text-gray-700 mb-2">Sélectionner les bulletins à regrouper</label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {bulletinsDisponibles.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">Tous les bulletins sont déjà rattachés à un bordereau.</p>
            ) : (
              bulletinsDisponibles.map(b => (
                <label key={b.id_bulletin} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedBulletinIds.includes(b.id_bulletin)}
                    onChange={() => {
                      setSelectedBulletinIds(prev =>
                        prev.includes(b.id_bulletin)
                          ? prev.filter(id => id !== b.id_bulletin)
                          : [...prev, b.id_bulletin]
                      );
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-800">N°{b.numero_bulletin}</span>
                  <span className="text-gray-500">{b.adherent?.nom} {b.adherent?.prenom}</span>
                  <span className="ml-auto text-gray-700 font-medium">{Number(b.montant_depense || 0).toLocaleString('fr-TN')} DT</span>
                </label>
              ))
            )}
          </div>
          {selectedBulletinIds.length > 0 && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">{selectedBulletinIds.length} bulletin(s) sélectionné(s)</p>
              <p className="text-xs font-semibold text-gray-700">Total : {totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT</p>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Numéro bordereau <span className="text-red-500">*</span></label>
              <input type="text" value={form.numero_bordereau} onChange={(e) => setForm({...form, numero_bordereau: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: BR-2024-001" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date envoi</label>
              <input type="date" value={form.date_envoi} onChange={(e) => setForm({...form, date_envoi: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
            <select value={form.statut} onChange={(e) => setForm({...form, statut: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="En attente">En attente</option>
              <option value="Envoyé">Envoyé</option>
              <option value="Traité">Traité</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Commentaire</label>
            <textarea value={form.commentaire} onChange={(e) => setForm({...form, commentaire: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optionnel" />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50">Annuler</button>
            <button type="submit" disabled={loading || selectedBulletinIds.length === 0} className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition disabled:opacity-50 flex items-center gap-2">
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Créer le bordereau
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulletinDetailView({ bulletin, onBack }) {
  const totalMontant = (bulletin.details || []).reduce((sum, d) => sum + Number(d.montant || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {/* Bouton retour */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour à la liste des bulletins
      </button>

      {/* En-tête bulletin */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              bulletin.etat === 'Validé' ? 'bg-emerald-500' :
              bulletin.etat === 'Rejeté' ? 'bg-red-500' : 'bg-amber-500'
            }`}></div>
            <h4 className="text-base font-semibold text-gray-900">Bulletin N°{bulletin.numero_bulletin}</h4>
            <span className={etatBulletinBadge(bulletin.etat)}>{bulletin.etat || 'En attente'}</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{Number(bulletin.montant_depense || 0).toLocaleString('fr-TN')} DT</p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Adhérent</p>
            <p className="text-gray-800 font-medium mt-0.5">{bulletin.adherent?.nom} {bulletin.adherent?.prenom}</p>
            {bulletin.adherent?.matricule && <p className="text-xs text-gray-400">Mat: {bulletin.adherent.matricule}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Bénéficiaire</p>
            <p className="text-gray-800 mt-0.5">
              {bulletin.sous_adherent ? `${bulletin.sous_adherent.prenom} ${bulletin.sous_adherent.nom}` : "L'adhérent"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date du soin</p>
            <p className="text-gray-800 mt-0.5">{bulletin.date_soin || bulletin.details?.[0]?.date || '-'}</p>
          </div>
        </div>

        {bulletin.description && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-700">{bulletin.description}</p>
          </div>
        )}
      </div>

      {/* Tableau des détails */}
      <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Détails des soins</h5>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Date</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Type de soin</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(bulletin.details || []).length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-400 text-xs">Aucun détail de soin.</td>
              </tr>
            ) : (
              bulletin.details.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-700">{d.date || '-'}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{d.type_soin || '-'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{Number(d.montant || 0).toLocaleString('fr-TN')} DT</td>
                </tr>
              ))
            )}
          </tbody>
          {(bulletin.details || []).length > 0 && (
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 text-right text-xs font-semibold text-gray-700">Total</td>
                <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-900">{totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function BordereauDetailModal({ bordereau, onClose }) {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBulletin, setSelectedBulletin] = useState(null);

  useEffect(() => {
    if (!bordereau) return;

    // Try to use loaded bulletins from the bordereau object, otherwise fetch
    const loadedBulletins = bordereau.bulletinSoins || bordereau.bulletin_soins;
    if (loadedBulletins && loadedBulletins.length > 0) {
      setBulletins(loadedBulletins);
      setLoading(false);
    } else {
      api.get(`/bordereaux/${bordereau.id_bordereau}`)
        .then(res => {
          if (res.data.success) {
            const bs = res.data.data.bulletinSoins || res.data.data.bulletin_soins || [];
            setBulletins(bs);
          }
        })
        .catch(err => {
          console.error(err);
          // Notification discrète via l'état local si besoin
        })
        .finally(() => setLoading(false));
    }
  }, [bordereau]);

  const stats = bordereau.stats_bulletins || { en_attente: 0, valide: 0, rejete: 0, total: 0 };

  // Si un bulletin est sélectionné, afficher ses détails
  if (selectedBulletin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0F2942]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#0F2942]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Détail du bulletin N°{selectedBulletin.numero_bulletin}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Bordereau N°{bordereau.numero_bordereau}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">&times;</button>
          </div>

          <BulletinDetailView bulletin={selectedBulletin} onBack={() => setSelectedBulletin(null)} />

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex justify-end flex-shrink-0 bg-gray-50/50">
            <button onClick={() => setSelectedBulletin(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition">
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F2942]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#0F2942]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Bordereau N°{bordereau.numero_bordereau}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={statutBordereauBadge(bordereau.statut)}>{bordereau.statut || 'En attente'}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{stats.total} bulletin(s)</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500 font-medium">{Number(bordereau.montant_total || 0).toLocaleString('fr-TN')} DT</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">&times;</button>
        </div>

        {/* Stats récapitulatives */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">État des bulletins :</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-gray-700">Validés</span>
              <span className="font-semibold text-emerald-700">{stats.valide}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-700">Rejetés</span>
              <span className="font-semibold text-red-700">{stats.rejete}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-gray-700">En attente</span>
              <span className="font-semibold text-amber-700">{stats.en_attente}</span>
            </span>
          </div>
        </div>

        {/* Liste des bulletins */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : bulletins.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-400">Aucun bulletin associé à ce bordereau.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bulletins.map((bs) => (
                <div
                  key={bs.id_bulletin}
                  onClick={() => setSelectedBulletin(bs)}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/30 transition bg-white cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      bs.etat === 'Validé' ? 'bg-emerald-500' :
                      bs.etat === 'Rejeté' ? 'bg-red-500' : 'bg-amber-500'
                    }`}></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">N°{bs.numero_bulletin}</span>
                        <span className={etatBulletinBadge(bs.etat)}>{bs.etat || 'En attente'}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {bs.adherent?.nom} {bs.adherent?.prenom}
                        {bs.adherent?.matricule && <span> · Mat: {bs.adherent.matricule}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{Number(bs.montant_depense || 0).toLocaleString('fr-TN')} DT</p>
                      {bs.details && bs.details.length > 0 && (
                        <p className="text-xs text-gray-400">{bs.details.length} détail(s)</p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end flex-shrink-0 bg-gray-50/50">
          {bordereau.commentaire && (
            <div className="flex-1 mr-4">
              <p className="text-xs text-gray-500 mb-1">Commentaire :</p>
              <p className="text-sm text-gray-700">{bordereau.commentaire}</p>
            </div>
          )}
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition">Fermer</button>
        </div>
      </div>
    </div>
  );
}

export default function Bordereaux() {
  const [bordereaux, setBordereaux] = useState([]);
  const [bulletinsDisponibles, setBulletinsDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBulletinIds, setSelectedBulletinIds] = useState([]);
  const [bordereauForm, setBordereauForm] = useState({ numero_bordereau: '', date_envoi: '', statut: 'En attente', commentaire: '' });
  const [bordereauLoading, setBordereauLoading] = useState(false);

  // Detail modal state
  const [detailTarget, setDetailTarget] = useState(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bordereauxRes, bulletinsRes] = await Promise.all([
        api.get('/bordereaux', { params: { per_page: 100 } }),
        api.get('/bulletins', { params: { per_page: 500 } }),
      ]);
      if (bordereauxRes.data.success) setBordereaux(bordereauxRes.data.data);
      if (bulletinsRes.data.success) {
        // Only keep bulletins not yet linked to a bordereau
        setBulletinsDisponibles(bulletinsRes.data.data.filter(b => !b.id_bordereau));
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors du chargement des données.';
      console.error(err);
      showNotif(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateModal = () => {
    setBordereauForm({ numero_bordereau: '', date_envoi: '', statut: 'En attente', commentaire: '' });
    setSelectedBulletinIds([]);
    setShowCreateModal(true);
  };

  const handleCreateBordereau = async (e) => {
    e.preventDefault();
    if (selectedBulletinIds.length === 0) {
      showNotif('Veuillez sélectionner au moins un bulletin.', 'error');
      return;
    }

    setBordereauLoading(true);
    try {
      await api.post('/bordereaux', {
        ...bordereauForm,
        id_bulletins: selectedBulletinIds,
      });
      showNotif(`Bordereau créé avec succès (${selectedBulletinIds.length} bulletin(s) associé(s)).`);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      showNotif(err.response?.data?.message || 'Erreur lors de la création du bordereau.', 'error');
    } finally {
      setBordereauLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/bordereaux/${deleteTarget.id_bordereau}`);
      showNotif('Bordereau supprimé avec succès.');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showNotif('Erreur lors de la suppression.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>{notification.msg}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Bordereaux</h1>
          <p className="text-sm text-gray-500 mt-1">{bordereaux.length} bordereaux · {bulletinsDisponibles.length} bulletin(s) disponible(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#0F2942] text-white rounded-lg text-sm font-medium hover:bg-[#1A3A5C] transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nouveau bordereau
          </button>
        </div>
      </div>

      {/* Liste des bordereaux */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">N° Bordereau</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Bulletins liés</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Validés</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Rejetés</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">En attente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Montant total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date envoi</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bordereaux.map((b) => {
                const stats = b.stats_bulletins || { en_attente: 0, valide: 0, rejete: 0, total: 0 };
                return (
                  <tr
                    key={b.id_bordereau}
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setDetailTarget(b)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{b.numero_bordereau}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(b.bulletinSoins || b.bulletin_soins || []).slice(0, 3).map(bs => (
                          <span key={bs.id_bulletin} className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            N°{bs.numero_bulletin}
                          </span>
                        ))}
                        {(b.bulletinSoins || b.bulletin_soins || []).length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                            +{(b.bulletinSoins || b.bulletin_soins || []).length - 3}
                          </span>
                        )}
                        {(b.bulletinSoins || b.bulletin_soins || []).length === 0 && <span className="text-gray-400 text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                        {stats.valide}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                        {stats.rejete}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                        {stats.en_attente}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">{Number(b.montant_total || 0).toLocaleString('fr-TN')} DT</td>
                    <td className="px-4 py-3 text-gray-500">{b.date_envoi || '-'}</td>
                    <td className="px-4 py-3"><span className={statutBordereauBadge(b.statut)}>{b.statut || 'En attente'}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDetailTarget(b); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Voir détails"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(b); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && bordereaux.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">Aucun bordereau créé pour le moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      {bordereaux.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">En attente</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{bordereaux.filter(b => b.statut === 'En attente' || !b.statut).length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Envoyés</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{bordereaux.filter(b => b.statut === 'Envoyé').length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Traités</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{bordereaux.filter(b => b.statut === 'Traité').length}</p>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <BordereauCreateModal
          bulletinsDisponibles={bulletinsDisponibles}
          form={bordereauForm}
          setForm={setBordereauForm}
          selectedBulletinIds={selectedBulletinIds}
          setSelectedBulletinIds={setSelectedBulletinIds}
          onSubmit={handleCreateBordereau}
          onClose={() => setShowCreateModal(false)}
          loading={bordereauLoading}
        />
      )}

      {/* Detail modal */}
      {detailTarget && (
        <BordereauDetailModal
          bordereau={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Supprimer le bordereau N°${deleteTarget?.numero_bordereau} ? Les bulletins liés seront dissociés mais conservés.`}
        loading={deleteLoading}
      />
    </div>
  );
}

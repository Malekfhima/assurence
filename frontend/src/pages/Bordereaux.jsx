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

const TYPE_SOIN_OPTIONS = [
  'C1', 'C2', 'C3', 'V1', 'V2', 'V3', 'PH', 'PRO', 'B', 'KC', 'MS',
  'R', 'KE', 'AM', 'OPM', 'OPV', 'D1', 'D2', 'HH', 'HC', 'S.DENT',
  'LABO', 'RADIO', 'Naissance',
];

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

function BordereauCreateModal({ bulletinsDisponibles, form, setForm, selectedBulletinIds, setSelectedBulletinIds, onSubmit, onClose, loading, editMode, allBulletins }) {
  const displayItems = editMode ? (allBulletins || []) : bulletinsDisponibles;
  const totalMontant = displayItems
    .filter(b => selectedBulletinIds.includes(b.id_bulletin))
    .reduce((sum, b) => sum + Number(b.montant_depense || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{editMode ? 'Modifier le bordereau' : 'Créer un bordereau'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {/* Sélection des bulletins */}
        <div className="px-5 py-4 border-b border-gray-100">
          <label className="block text-xs font-medium text-gray-700 mb-2">Sélectionner les bulletins à regrouper</label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {(() => {
              const items = editMode ? (allBulletins || []) : bulletinsDisponibles;
              if (items.length === 0) {
                return <p className="text-center py-6 text-gray-400 text-sm">0 bulletin disponible</p>;
              }
              return items.map(b => (
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
                  <span className="ml-auto text-gray-700 font-medium">{Number(b.montant_depense || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</span>
                </label>
              ));
            })()}
          </div>
          {selectedBulletinIds.length > 0 && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">{selectedBulletinIds.length} bulletin(s) sélectionné(s)</p>
              <p className="text-xs font-semibold text-gray-700">Total : {totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</p>
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
            <button type="submit" disabled={loading || (!editMode && selectedBulletinIds.length === 0)} className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition disabled:opacity-50 flex items-center gap-2">
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {editMode ? 'Enregistrer les modifications' : 'Créer le bordereau'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PdfPreviewModal({ bulletin, onClose }) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bulletin?.id_bulletin) return;
    let blobUrl = null;
    setLoading(true);
    setError('');

    const fetchPdf = async () => {
      try {
        const response = await api.get(`/bulletins/${bulletin.id_bulletin}/pdf`, {
          responseType: 'blob',
        });
        blobUrl = URL.createObjectURL(response.data);
        setPdfUrl(blobUrl);
      } catch (err) {
        setError('Impossible de charger le PDF.');
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [bulletin?.id_bulletin]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-900">
              Bulletin n°{bulletin?.numero_bulletin}
            </h3>
            <span className="text-xs text-gray-400">— {bulletin?.adherent?.nom} {bulletin?.adherent?.prenom}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const response = await api.get(`/bulletins/${bulletin.id_bulletin}/pdf`, {
                    params: { download: '1' },
                    responseType: 'blob',
                  });
                  const blob = response.data;
                  const blobUrl = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = `bulletin_${bulletin.numero_bulletin}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                } catch (err) {
                  console.error('Erreur téléchargement PDF:', err);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0F2942] hover:bg-[#1A3A5C] rounded-lg transition"
              title="Télécharger le PDF"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        {/* PDF Viewer */}
        <div className="flex-1 min-h-0 bg-gray-100 flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">Chargement du PDF...</span>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center gap-2 text-red-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full min-h-[65vh]"
              title={`Bulletin n°${bulletin.numero_bulletin}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function BulletinDetailView({ bulletin, onBack, onPreviewPdf, onEditBulletin }) {
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
          <div className="flex items-center gap-3">
            {bulletin.pdf_path && (
              <button
                onClick={(e) => { e.stopPropagation(); onPreviewPdf?.(bulletin); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                title="Aperçu du PDF"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Aperçu
              </button>
            )}
            {onEditBulletin && (
              <button
                onClick={(e) => { e.stopPropagation(); onEditBulletin(bulletin); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition border border-amber-200"
                title="Modifier le bulletin"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </button>
            )}
            <p className="text-lg font-bold text-gray-900">{Number(bulletin.montant_depense || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</p>
          </div>
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
                  <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{Number(d.montant || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
                </tr>
              ))
            )}
          </tbody>
          {(bulletin.details || []).length > 0 && (
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 text-right text-xs font-semibold text-gray-700">Total</td>
                <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-900">{totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function BordereauReponseModal({ bordereau, onClose, onSubmitReponse, loading }) {
  const [fichierDonnees, setFichierDonnees] = useState(null);
  const [fichierReponse, setFichierReponse] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFichierDonnees(file);
    setErrors('');
    setPreview(null);

    // Essayer de prévisualiser le CSV
    if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const lines = ev.target.result.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          const header = lines[0].split(',').map(h => h.trim());
          const dataRows = lines.slice(1, 6).map(row => row.split(',').map(c => c.trim()));
          setPreview({ header, rows: dataRows, total: lines.length - 1 });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fichierDonnees) {
      setErrors('Veuillez sélectionner un fichier CSV.');
      return;
    }
    onSubmitReponse(fichierDonnees, fichierReponse);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Réponse du bordereau</h3>
              <p className="text-xs text-gray-500 mt-0.5">Bordereau N°{bordereau.numero_bordereau}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Format indication */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-medium mb-1">📄 Format du fichier CSV attendu :</p>
            <code className="block bg-blue-100/50 px-2 py-1 rounded text-xs">
              numero_bulletin,etat[,montant]<br />
              BR-001,Validé,150.000<br />
              BR-002,Rejeté<br />
              BR-003,Validé,200.000
            </code>
            <p className="mt-1 text-blue-600">État accepté : Validé ou Rejeté</p>
          </div>

          {/* Fichier données */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Fichier CSV des résultats <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#0F2942] file:text-white hover:file:bg-[#1A3A5C] file:cursor-pointer file:transition cursor-pointer"
              />
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Aperçu ({preview.total} ligne(s)) :</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      {preview.header.map((h, i) => (
                        <th key={i} className="px-2 py-1 text-left font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1 text-gray-700">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.total > 5 && (
                <p className="text-xs text-gray-400 mt-1">... et {preview.total - 5} ligne(s) supplémentaire(s)</p>
              )}
            </div>
          )}

          {/* Fichier réponse PDF (optionnel) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Document réponse PDF <span className="text-gray-400">(optionnel)</span>
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFichierReponse(e.target.files[0])}
              className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-600 file:text-white hover:file:bg-gray-700 file:cursor-pointer file:transition cursor-pointer"
            />
          </div>

          {errors && <p className="text-xs text-red-500">{errors}</p>}

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50">Annuler</button>
            <button type="submit" disabled={loading || !fichierDonnees} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2">
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Traiter la réponse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BordereauDetailModal({ bordereau, onClose, onEdit, onEnvoyer, onReponse, envoyerLoading }) {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [recherche, setRecherche] = useState('');

  // Edit bulletin state
  const [editBulletin, setEditBulletin] = useState(null);
  const [editForm, setEditForm] = useState({ numero_bulletin: '', etat: 'En attente' });
  const [editDetails, setEditDetails] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const startEditBulletin = (bulletin) => {
    setEditForm({
      numero_bulletin: bulletin.numero_bulletin || '',
      etat: bulletin.etat || 'En attente',
    });
    setEditDetails((bulletin.details || []).map(d => ({
      ...d,
      montant: d.montant !== null && d.montant !== undefined ? String(d.montant) : '',
    })));
    setEditBulletin(bulletin);
  };

  const cancelEditBulletin = () => {
    setEditBulletin(null);
    setEditForm({ numero_bulletin: '', etat: 'En attente' });
    setEditDetails([]);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEditDetailChange = (index, field, value) => {
    setEditDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleEditAddDetail = () => {
    setEditDetails(prev => [...prev, { date: '', montant: '', type_soin: '' }]);
  };

  const handleEditRemoveDetail = (index) => {
    setEditDetails(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditSaveBulletin = async (e) => {
    e.preventDefault();

    const validDetails = editDetails
      .filter(d => parseFloat(d.montant) > 0)
      .map(d => ({
        ...d,
        montant: d.montant === '' || d.montant === undefined || d.montant === null ? '0' : d.montant,
      }));

    if (validDetails.length === 0) return;

    const firstDetail = validDetails[0] || {};
    const dateSoin = firstDetail.date || '';
    const typeSoin = firstDetail.type_soin || '';

    setEditLoading(true);
    setEditError('');
    try {
      const payload = {
        id_adherent: editBulletin.id_adherent,
        id_sous_adherent: editBulletin.id_sous_adherent || '',
        numero_bulletin: editForm.numero_bulletin,
        date_soin: dateSoin,
        type_soin: typeSoin,
        etat: editForm.etat,
        details: validDetails,
      };

      await api.post(`/bulletins/${editBulletin.id_bulletin}`, payload);

      // Rafraîchir les bulletins du bordereau
      const res = await api.get(`/bordereaux/${bordereau.id_bordereau}`);
      if (res.data.success) {
        const bs = res.data.data.bulletinSoins || res.data.data.bulletin_soins || [];
        setBulletins(bs);
      }

      cancelEditBulletin();
      setSelectedBulletin(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la modification du bulletin.';
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };



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

  // Filtrer les bulletins côté client selon la recherche
  const bulletinsFiltres = bulletins.filter(bs => {
    if (!recherche.trim()) return true;
    const q = recherche.trim().toLowerCase();
    const mat = (bs.adherent?.matricule || '').toLowerCase();
    const num = (bs.numero_bulletin || '').toLowerCase();
    const nom = (bs.adherent?.nom || '').toLowerCase();
    const prenom = (bs.adherent?.prenom || '').toLowerCase();
    return mat.includes(q) || num.includes(q) || nom.includes(q) || prenom.includes(q);
  });

  // Stats filtrées
  const statsFiltres = (() => {
    const grouped = bulletinsFiltres.reduce((acc, bs) => {
      const etat = bs.etat || 'En attente';
      acc[etat] = (acc[etat] || 0) + 1;
      return acc;
    }, {});
    return {
      en_attente: grouped['En attente'] || 0,
      valide: grouped['Validé'] || 0,
      rejete: grouped['Rejeté'] || 0,
      total: bulletinsFiltres.length,
    };
  })();

  // Utiliser les stats filtrées si recherche active, sinon celles du bordereau
  const stats = recherche.trim() ? statsFiltres : (bordereau.stats_bulletins || { en_attente: 0, valide: 0, rejete: 0, total: 0 });

  // Si un bulletin est sélectionné, afficher ses détails (mode édition ou vue)
  if (selectedBulletin) {
    if (editBulletin) {
      const totalMontant = editDetails.reduce((sum, d) => sum + (parseFloat(d.montant) || 0), 0);
      const hasError = editDetails.filter(d => parseFloat(d.montant) > 0).length === 0;

      return (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Modifier le bulletin N°{editBulletin.numero_bulletin}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Bordereau N°{bordereau.numero_bordereau}</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">&times;</button>
              </div>

              <form onSubmit={handleEditSaveBulletin} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Numéro bulletin <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editForm.numero_bulletin}
                      onChange={(e) => handleEditFormChange('numero_bulletin', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">État</label>
                    <select
                      value={editForm.etat}
                      onChange={(e) => handleEditFormChange('etat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="En attente">En attente</option>
                      <option value="Validé">Validé</option>
                      <option value="Rejeté">Rejeté</option>
                    </select>
                  </div>
                </div>

                {/* Tableau des détails */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-700">Détails des soins <span className="text-red-500">*</span></label>
                    <button type="button" onClick={handleEditAddDetail} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Ajouter une ligne
                    </button>
                  </div>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase w-28">Date</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">Montant</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase w-36">Type de soin</th>
                          <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs uppercase w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {editDetails.map((d, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5">
                              <input type="date" value={d.date} onChange={(e) => handleEditDetailChange(i, 'date', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                            </td>
                            <td className="px-3 py-1.5">
                              <input type="text" inputMode="decimal" value={d.montant} onChange={(e) => { let val = e.target.value.replace(/[^0-9.,]/g, ''); val = val.replace(',', '.'); handleEditDetailChange(i, 'montant', val); }} placeholder="Montant" className="w-full max-w-[120px] px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none text-right" />
                            </td>
                            <td className="px-3 py-1.5">
                              <select value={d.type_soin} onChange={(e) => handleEditDetailChange(i, 'type_soin', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Sélectionner</option>
                                {TYPE_SOIN_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-1.5 text-center">
                              <button type="button" onClick={() => handleEditRemoveDetail(i)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Supprimer">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {editDetails.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-gray-400 text-xs">Aucune ligne. Cliquez sur "Ajouter une ligne" pour commencer.</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Montant total</td>
                          <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">{totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {hasError && <p className="text-xs text-red-500 mt-2">Ajoutez au moins un détail de soin avec un montant supérieur à 0.</p>}
                  {editError && <p className="text-xs text-red-500 mt-2">{editError}</p>}
                </div>

                {/* Boutons */}
                <div className="pt-2 flex justify-end gap-3 border-t border-gray-200">
                  <button type="button" onClick={cancelEditBulletin} disabled={editLoading} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50">Annuler</button>
                  <button type="submit" disabled={editLoading || hasError} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-2">
                    {editLoading && (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
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

            <BulletinDetailView bulletin={selectedBulletin} onBack={() => setSelectedBulletin(null)} onPreviewPdf={setPdfPreview} onEditBulletin={startEditBulletin} />

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end flex-shrink-0 bg-gray-50/50">
              <button onClick={() => setSelectedBulletin(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition">
                Retour
              </button>
            </div>
          </div>
        </div>

        {pdfPreview && (
          <PdfPreviewModal
            bulletin={pdfPreview}
            onClose={() => setPdfPreview(null)}
          />
        )}
      </>
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
                <span className="text-xs text-gray-500 font-medium">{Number(bordereau.montant_total || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Bouton Envoyer (quand le bordereau est en attente) */}
            {bordereau.statut === 'En attente' && (
              <button
                onClick={(e) => { e.stopPropagation(); onEnvoyer?.(bordereau); }}
                disabled={envoyerLoading}
                className="px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition flex items-center gap-1 disabled:opacity-50"
                title="Envoyer le bordereau"
              >
                {envoyerLoading ? (
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                Envoyer
              </button>
            )}
            {/* Bouton Réponse (quand le bordereau est envoyé) */}
            {bordereau.statut === 'Envoyé' && (
              <button
                onClick={(e) => { e.stopPropagation(); onReponse?.(bordereau); }}
                className="px-3 py-1.5 text-xs text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition flex items-center gap-1"
                title="Réceptionner la réponse"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Réponse
              </button>
            )}
            {/* Voir le fichier réponse (quand traité) */}
            {bordereau.statut === 'Traité' && bordereau.fichier_reponse && (
              <a
                href={`/storage/${bordereau.fichier_reponse}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-1"
                title="Voir le fichier réponse"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Fichier réponse
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(bordereau); }}
              className="px-3 py-1.5 text-xs text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition flex items-center gap-1"
              title="Modifier"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">&times;</button>
          </div>
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
            {recherche.trim() && (
              <span className="ml-auto text-xs text-gray-400 italic">
                {bulletinsFiltres.length} résultat(s) sur {bulletins.length}
              </span>
            )}
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="px-5 py-2.5 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par matricule adhérent, numéro bulletin, nom ou prénom…"
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {recherche && (
              <button
                onClick={() => setRecherche('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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
          ) : bulletinsFiltres.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-500">Aucun bulletin ne correspond à votre recherche.</p>
              <p className="text-xs text-gray-400 mt-1">Essayez un matricule ou un numéro de bulletin différent.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bulletinsFiltres.map((bs) => (
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
                  <div className="flex items-center gap-2">
                    {bs.pdf_path && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPdfPreview(bs); }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        title="Aperçu du PDF"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Aperçu
                      </button>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{Number(bs.montant_depense || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</p>
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

      {pdfPreview && (
        <PdfPreviewModal
          bulletin={pdfPreview}
          onClose={() => setPdfPreview(null)}
        />
      )}
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

  // Envoyer
  const [envoyerLoading, setEnvoyerLoading] = useState(false);

  // Réponse modal state
  const [reponseTarget, setReponseTarget] = useState(null);
  const [reponseLoading, setReponseLoading] = useState(false);

  // Filter state
  const [filterAnnee, setFilterAnnee] = useState('');
  const [filterMois, setFilterMois] = useState('');

  // Edit modal state
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ numero_bordereau: '', date_envoi: '', statut: 'En attente', commentaire: '' });
  const [editBulletinIds, setEditBulletinIds] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

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
      const params = { per_page: 100 };
      if (filterAnnee) params.annee = filterAnnee;
      if (filterMois) params.mois = filterMois;

      const [bordereauxRes, bulletinsRes] = await Promise.all([
        api.get('/bordereaux', { params }),
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

  useEffect(() => { fetchData(); }, [filterAnnee, filterMois]);

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

  const openEditModal = (bordereau) => {
    const bulletinIds = (bordereau.bulletinSoins || bordereau.bulletin_soins || []).map(bs => bs.id_bulletin);
    setEditForm({
      numero_bordereau: bordereau.numero_bordereau || '',
      date_envoi: bordereau.date_envoi || '',
      statut: bordereau.statut || 'En attente',
      commentaire: bordereau.commentaire || '',
    });
    setEditBulletinIds(bulletinIds);
    setEditTarget(bordereau);
    setDetailTarget(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await api.put(`/bordereaux/${editTarget.id_bordereau}`, {
        ...editForm,
        id_bulletins: editBulletinIds,
      });
      showNotif('Bordereau modifié avec succès.');
      setEditTarget(null);
      fetchData();
    } catch (err) {
      showNotif(err.response?.data?.message || 'Erreur lors de la modification.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEnvoyer = async (bordereau) => {
    setEnvoyerLoading(true);
    try {
      await api.post(`/bordereaux/${bordereau.id_bordereau}/envoyer`);
      showNotif('Bordereau envoyé avec succès.');
      setDetailTarget(null);
      fetchData();
    } catch (err) {
      showNotif(err.response?.data?.message || 'Erreur lors de l\'envoi.', 'error');
    } finally {
      setEnvoyerLoading(false);
    }
  };

  const openReponseModal = (bordereau) => {
    setReponseTarget(bordereau);
    setDetailTarget(null);
  };

  const handleReponse = async (fichierDonnees, fichierReponse) => {
    if (!reponseTarget) return;
    setReponseLoading(true);
    try {
      const formData = new FormData();
      formData.append('fichier_donnees', fichierDonnees);
      if (fichierReponse) {
        formData.append('fichier_reponse', fichierReponse);
      }

      const res = await api.post(`/bordereaux/${reponseTarget.id_bordereau}/reponse`, formData);

      const msg = res.data.message || 'Réponse traitée avec succès.';
      const warnings = res.data.warnings;
      if (warnings && warnings.length > 0) {
        showNotif(msg + ' (' + warnings.length + ' avertissement(s))', 'success');
      } else {
        showNotif(msg, 'success');
      }
      setReponseTarget(null);
      fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Erreur lors du traitement de la réponse.';
      showNotif(errMsg, 'error');
    } finally {
      setReponseLoading(false);
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

      {/* Header with filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Bordereaux</h1>
          <p className="text-sm text-gray-500 mt-1">
            {bordereaux.length} bordereaux ·{' '}
            {bordereaux.reduce((sum, b) => sum + ((b.bulletinSoins || b.bulletin_soins || []).length), 0)} bulletin(s) dans les bordereaux
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtre année */}
          <select
            value={filterAnnee}
            onChange={(e) => setFilterAnnee(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Toutes années</option>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {/* Filtre mois */}
          <select
            value={filterMois}
            onChange={(e) => setFilterMois(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Tous mois</option>
            {Object.entries({ 1: 'Janvier', 2: 'Février', 3: 'Mars', 4: 'Avril', 5: 'Mai', 6: 'Juin', 7: 'Juillet', 8: 'Août', 9: 'Septembre', 10: 'Octobre', 11: 'Novembre', 12: 'Décembre' }).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          {(filterAnnee || filterMois) && (
            <button
              onClick={() => { setFilterAnnee(''); setFilterMois(''); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Réinitialiser les filtres"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
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
                    <td className="px-4 py-3 text-gray-900 font-semibold">{Number(b.montant_total || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
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
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">0 bordereau</td></tr>
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

      {/* Edit modal */}
      {editTarget && (
        <BordereauCreateModal
          editMode
          allBulletins={bulletinsDisponibles.concat(editTarget.bulletinSoins || editTarget.bulletin_soins || [])}
          bulletinsDisponibles={bulletinsDisponibles}
          form={editForm}
          setForm={setEditForm}
          selectedBulletinIds={editBulletinIds}
          setSelectedBulletinIds={setEditBulletinIds}
          onSubmit={handleEditSubmit}
          onClose={() => setEditTarget(null)}
          loading={editLoading}
        />
      )}

      {/* Detail modal */}
      {detailTarget && (
        <BordereauDetailModal
          bordereau={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={openEditModal}
          onEnvoyer={handleEnvoyer}
          onReponse={openReponseModal}
          envoyerLoading={envoyerLoading}
        />
      )}

      {/* Réponse modal */}
      {reponseTarget && (
        <BordereauReponseModal
          bordereau={reponseTarget}
          onClose={() => setReponseTarget(null)}
          onSubmitReponse={handleReponse}
          loading={reponseLoading}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Supprimer le bordereau N°${deleteTarget?.numero_bordereau} ? Les bulletins liés seront également supprimés.`}
        loading={deleteLoading}
      />
    </div>
  );
}

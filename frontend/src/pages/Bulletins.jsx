import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const TYPE_SOIN_OPTIONS = [
  'C1',
  'C2',
  'C3',
  'V1',
  'V2',
  'V3',
  'PH',
  'PRO',
  'B',
  'KC',
  'MS','R','KE','AM','OPM','OPV','D1','D2','HH','HC','S.DENT',
];

function emptyDetail() {
  return {
    date: '',
    montant: '',
    type_soin: '',
  };
}

function PdfPreviewModal({ bulletin, onClose }) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, [bulletin.id_bulletin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-900">
              Bulletin n°{bulletin.numero_bulletin}
            </h3>
            <span className="text-xs text-gray-400">— {bulletin.adherent?.nom} {bulletin.adherent?.prenom}</span>
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

function FormModal({ modal, form, details, adherents, matchedAdherent, sousAdherents, errors, pdfFile, existingPdf, onSubmit, onChange, onMatriculeChange, onDetailChange, onAddDetail, onRemoveDetail, onPdfChange, onRemovePdf, onClose, onPreviewPdf }) {
  const selectedAdherent = matchedAdherent || adherents.find((a) => a.id_adherent === Number(form.id_adherent));
  const totalMontant = details.reduce((sum, d) => sum + (parseFloat(d.montant) || 0), 0);
  const pdfInputRef = useRef(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{modal === 'add' ? 'Nouveau bulletin' : 'Modifier bulletin'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {/* En-tête bulletin */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Matricule <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.matricule_saisi || ''}
                onChange={(e) => onMatriculeChange(e.target.value)}
                placeholder="Tapez le matricule"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.id_adherent ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.id_adherent && <p className="text-xs text-red-500 mt-1">{errors.id_adherent}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom de l'adhérent</label>
              <input
                type="text"
                value={selectedAdherent ? `${selectedAdherent.nom} ${selectedAdherent.prenom}` : ''}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600"
                placeholder="Automatique"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Numéro bulletin <span className="text-red-500">*</span></label>
              <input type="text" value={form.numero_bulletin} onChange={(e) => onChange('numero_bulletin', e.target.value)} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.numero_bulletin ? 'border-red-400' : 'border-gray-300'}`} placeholder="Ex : BUL-2024-001" />
              {errors.numero_bulletin && <p className="text-xs text-red-500 mt-1">{errors.numero_bulletin}</p>}
            </div>
          </div>
          {/* Bénéficiaire */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bénéficiaire</label>
            <select
              value={form.id_sous_adherent || ''}
              onChange={(e) => onChange('id_sous_adherent', e.target.value)}
              className={`w-full max-w-sm px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.id_sous_adherent ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">— L'Adhérent —</option>
              {sousAdherents.map((sa) => (
                <option key={sa.id_sous_adherent} value={sa.id_sous_adherent}>
                  {sa.nom} {sa.prenom} ({sa.lien_parente || 'Sous-adhérent'})
                </option>
              ))}
            </select>
            {errors.id_sous_adherent && <p className="text-xs text-red-500 mt-1">{errors.id_sous_adherent}</p>}
          </div>

          {/* Tableau des détails de soin */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">Détails des soins <span className="text-red-500">*</span></label>
              <button type="button" onClick={onAddDetail} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center gap-1">
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
                  {details.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5">
                        <input type="date" value={d.date} onChange={(e) => onDetailChange(i, 'date', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="text" inputMode="decimal" value={d.montant} onChange={(e) => { let val = e.target.value.replace(/[^0-9.,]/g, ''); val = val.replace(',', '.'); onDetailChange(i, 'montant', val); }} placeholder="Montant" className="w-full max-w-[120px] px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none text-right" />
                      </td>
                      <td className="px-3 py-1.5">
                        <select value={d.type_soin} onChange={(e) => onDetailChange(i, 'type_soin', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="">Sélectionner</option>
                          {TYPE_SOIN_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <button type="button" onClick={() => onRemoveDetail(i)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Supprimer">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {details.length === 0 && (
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
            {errors.details && <p className="text-xs text-red-500 mt-2">{errors.details}</p>}
          </div>

          {/* Upload PDF - Bulletin scanné */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-2">Bulletin scanné (PDF)</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {pdfFile ? pdfFile.name : existingPdf ? 'Remplacer le PDF' : 'Choisir un fichier PDF'}
              </button>
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={onPdfChange}
                className="hidden"
              />
              {pdfFile && (
                <div className="flex items-center gap-2 text-xs">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 truncate max-w-[200px]">{pdfFile.name}</span>
                  <span className="text-gray-400">({(pdfFile.size / 1024).toFixed(0)} Ko)</span>
                  <button type="button" onClick={onRemovePdf} className="p-1 text-gray-400 hover:text-red-600 rounded" title="Retirer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
              {!pdfFile && existingPdf && (
                <button
                  type="button"
                  onClick={onPreviewPdf}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Voir le PDF actuel
                </button>
              )}
            </div>
            {errors.pdf && <p className="text-xs text-red-500 mt-1">{errors.pdf}</p>}
          </div>

          {/* Boutons */}
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de création de bordereau
function BordereauModal({ selectedBulletins, form, setForm, onSubmit, onClose, loading }) {
  const totalMontant = selectedBulletins.reduce((sum, b) => sum + Number(b.montant_depense || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Nouveau bordereau</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <p className="text-xs font-medium text-gray-600 mb-2">Bulletins sélectionnés ({selectedBulletins.length}) :</p>
          <div className="max-h-36 overflow-y-auto space-y-1.5">
            {selectedBulletins.map(b => (
              <div key={b.id_bulletin} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="font-medium text-gray-800">N°{b.numero_bulletin}</span>
                  <span className="text-gray-500">{b.adherent?.nom} {b.adherent?.prenom}</span>
                </div>
                <span className="text-gray-700 font-medium">{Number(b.montant_depense || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-sm font-bold text-gray-900">{totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</span>
          </div>
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
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition disabled:opacity-50 flex items-center gap-2">
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

export default function Bulletins() {
  const [bulletins, setBulletins] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [etatFilter, setEtatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [adherents, setAdherents] = useState([]);
  const [matchedAdherent, setMatchedAdherent] = useState(null);
  const [sousAdherents, setSousAdherents] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [form, setForm] = useState({ id_adherent: '', id_sous_adherent: '', numero_bulletin: '', etat: 'En attente', matricule_saisi: '' });
  const [details, setDetails] = useState([]);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const matriculeTimeoutRef = useRef(null);

  // Bordereau state
  const [selectedBulletinIds, setSelectedBulletinIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBordereauModal, setShowBordereauModal] = useState(false);
  const [bordereauForm, setBordereauForm] = useState({ numero_bordereau: '', date_envoi: '', statut: 'En attente', commentaire: '' });
  const [bordereauLoading, setBordereauLoading] = useState(false);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchBulletins = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, per_page: 15 };
      if (search) params.search = search;
      if (etatFilter) params.etat = etatFilter;
      const res = await api.get('/bulletins', { params });
      if (res.data.success) {
        setBulletins(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors du chargement des bulletins.';
      console.error(err);
      showNotif(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdherents = async () => {
    try {
      const res = await api.get('/adherents', { params: { per_page: 500 } });
      if (res.data.success) setAdherents(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors du chargement des adhérents.';
      console.error(err);
      showNotif(msg, 'error');
    }
  };

  const fetchAdherentByMatricule = async (matricule) => {
    try {
      const res = await api.get(`/adherents/by-matricule/${encodeURIComponent(matricule)}`);
      if (res.data.success) {
        const adherent = res.data.data;
        setMatchedAdherent(adherent);
        setSousAdherents(adherent.sous_adherents || []);
        return adherent;
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setMatchedAdherent(null);
        setSousAdherents([]);
      }
    }
    return null;
  };

  useEffect(() => { fetchBulletins(); fetchAdherents(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchBulletins(), 300);
    return () => clearTimeout(timer);
  }, [search, etatFilter]);

  // Reset selection when page changes
  useEffect(() => {
    setSelectedBulletinIds([]);
    setSelectAll(false);
  }, [meta.current_page]);

  // Mettre à jour les sous-adhérents quand l'adhérent change (mode édition)
  useEffect(() => {
    if (!form.id_adherent) {
      return;
    }
    // Si on a déjà les sous-adhérents via l'API matricule, ne pas écraser
    if (matchedAdherent && Number(matchedAdherent.id_adherent) === Number(form.id_adherent)) {
      return;
    }
    const adherent = adherents.find((a) => a.id_adherent === Number(form.id_adherent));
    if (adherent?.sous_adherents) {
      setSousAdherents(adherent.sous_adherents);
    }
  }, [form.id_adherent, adherents, matchedAdherent]);

  const openModal = (type, bulletin = null) => {
    if (type === 'edit' && bulletin) {
      setSelected(bulletin);
      setMatchedAdherent(null);
      setPdfFile(null);
      const editAdherent = adherents.find((a) => a.id_adherent === Number(bulletin.id_adherent));
      setForm({
        id_adherent: bulletin.id_adherent,
        id_sous_adherent: bulletin.id_sous_adherent || '',
        numero_bulletin: bulletin.numero_bulletin,
        etat: bulletin.etat || 'En attente',
        matricule_saisi: editAdherent?.matricule || '',
        id_bulletin: bulletin.id_bulletin,
      });
      setDetails((bulletin.details || []).map((d) => ({
        ...d,
        montant: d.montant !== null && d.montant !== undefined ? String(d.montant) : '',
      })));
      // Charger les sous-adhérents depuis l'API (la liste ne les inclut pas)
      const loadSousAdherents = async () => {
        try {
          const res = await api.get(`/adherents/${bulletin.id_adherent}`);
          if (res.data.success) {
            setSousAdherents(res.data.data.sous_adherents || []);
          }
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Erreur lors du chargement des sous-adhérents.';
          console.error('Erreur chargement sous-adhérents:', err);
          showNotif(msg, 'error');
        }
      };
      loadSousAdherents();
    } else {
      setSelected(null);
      setMatchedAdherent(null);
      setPdfFile(null);
      setForm({ id_adherent: '', id_sous_adherent: '', numero_bulletin: '', etat: 'En attente', matricule_saisi: '' });
      setSousAdherents([]);
      setDetails([emptyDetail()]);
    }
    setErrors({});
    setModal(type);
  };

  const closeModal = () => setModal(null);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleMatriculeChange = (value) => {
    setForm((prev) => ({ ...prev, matricule_saisi: value }));
    setErrors((prev) => ({ ...prev, id_adherent: '' }));

    if (!value) {
      setForm((prev) => ({ ...prev, id_adherent: '', id_sous_adherent: '' }));
      setMatchedAdherent(null);
      setSousAdherents([]);
      return;
    }

    // Debounce : attendre 300ms avant de lancer la recherche
    if (matriculeTimeoutRef.current) {
      clearTimeout(matriculeTimeoutRef.current);
    }

    matriculeTimeoutRef.current = setTimeout(async () => {
      const adherent = await fetchAdherentByMatricule(value);
      if (adherent) {
        setForm((prev) => ({
          ...prev,
          id_adherent: adherent.id_adherent,
          id_sous_adherent: '',
        }));
      } else {
        setForm((prev) => ({ ...prev, id_adherent: '', id_sous_adherent: '' }));
      }
    }, 300);
  };

  const handleDetailChange = (index, field, value) => {
    setDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddDetail = () => {
    setDetails((prev) => [...prev, emptyDetail()]);
  };

  const handleRemoveDetail = (index) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrors((prev) => ({ ...prev, pdf: 'Seuls les fichiers PDF sont acceptés.' }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, pdf: 'Le fichier ne doit pas dépasser 10 Mo.' }));
        return;
      }
      setPdfFile(file);
      setErrors((prev) => ({ ...prev, pdf: '' }));
    }
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation frontend : au moins un détail avec un montant valide
    const validDetails = details
      .filter((d) => parseFloat(d.montant) > 0)
      .map((d) => ({
        ...d,
        montant: d.montant === '' || d.montant === undefined || d.montant === null ? '0' : d.montant,
      }));

    if (validDetails.length === 0) {
      setErrors({ details: 'Ajoutez au moins un détail de soin avec un montant supérieur à 0.' });
      return;
    }

    // Extraire la date et le type du premier détail pour le bulletin
    const firstDetail = validDetails[0] || {};
    const dateSoin = firstDetail.date || '';
    const typeSoin = firstDetail.type_soin || '';

    try {
      let payload;

      if (pdfFile) {
        // Utiliser FormData quand il y a un fichier PDF
        const formData = new FormData();
        formData.append('id_adherent', form.id_adherent);
        formData.append('id_sous_adherent', form.id_sous_adherent || '');
        formData.append('numero_bulletin', form.numero_bulletin);
        formData.append('date_soin', dateSoin);
        formData.append('type_soin', typeSoin);
        formData.append('etat', form.etat || 'En attente');
        formData.append('pdf', pdfFile);

        validDetails.forEach((detail, index) => {
          formData.append(`details[${index}][date]`, detail.date || '');
          formData.append(`details[${index}][montant]`, detail.montant);
          formData.append(`details[${index}][type_soin]`, detail.type_soin || '');
        });

        payload = formData;
      } else {
        // Envoyer en JSON si pas de fichier
        payload = { ...form, date_soin: dateSoin, type_soin: typeSoin, details: validDetails };
      }

      if (modal === 'add') {
        await api.post('/bulletins', payload);
        showNotif('Bulletin créé avec succès.');
      } else {
        await api.post(`/bulletins/${selected.id_bulletin}`, payload);
        showNotif('Bulletin modifié avec succès.');
      }
      setModal(null);
      setPdfFile(null);
      fetchBulletins(meta.current_page);
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const fieldErrors = {};
        Object.keys(serverErrors).forEach((field) => {
          fieldErrors[field] = serverErrors[field][0];
        });
        setErrors(fieldErrors);
      } else {
        showNotif(err.response?.data?.message || 'Erreur lors de la sauvegarde.', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(`/bulletins/${id}`);
      showNotif('Bulletin supprimé avec succès.');
      fetchBulletins();
    } catch (err) {
      showNotif('Erreur lors de la suppression.', 'error');
    }
  };

  const etatBadge = (etat) => {
    const styles = {
      'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
      'Validé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Rejeté': 'bg-red-50 text-red-700 border-red-200',
    };
    return `inline-flex px-2 py-1 rounded-full text-xs font-medium border ${styles[etat] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
  };

  // Filtrer les bulletins déjà liés à un bordereau (ne pas les afficher)
  const bulletinsDisponibles = bulletins.filter(b => !b.id_bordereau);

  // --- Bordereau handlers ---

  const selectableBulletins = bulletinsDisponibles;

  const handleToggleSelect = (id) => {
    setSelectedBulletinIds(prev =>
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedBulletinIds([]);
    } else {
      setSelectedBulletinIds(selectableBulletins.map(b => b.id_bulletin));
    }
    setSelectAll(!selectAll);
  };

  const openBordereauModal = () => {
    setBordereauForm({ numero_bordereau: '', date_envoi: '', statut: 'En attente', commentaire: '' });
    setShowBordereauModal(true);
  };

  const handleCreateBordereau = async (e) => {
    e.preventDefault();
    if (selectedBulletinIds.length === 0) return;

    setBordereauLoading(true);
    try {
      await api.post('/bordereaux', {
        ...bordereauForm,
        id_bulletins: selectedBulletinIds,
      });
      showNotif(`Bordereau créé avec succès (${selectedBulletinIds.length} bulletin(s) associé(s)).`);
      setShowBordereauModal(false);
      setSelectedBulletinIds([]);
      setSelectAll(false);
      setBordereauForm({ numero_bordereau: '', date_envoi: '', statut: 'En attente', commentaire: '' });
      fetchBulletins(meta.current_page);
    } catch (err) {
      showNotif(err.response?.data?.message || 'Erreur lors de la création du bordereau.', 'error');
    } finally {
      setBordereauLoading(false);
    }
  };

  // ---

  return (
    <div className="space-y-4">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>{notification.msg}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Bulletins de soin</h1>
          <p className="text-sm text-gray-500 mt-1">{bulletinsDisponibles.length} bulletin(s) disponible(s){bulletins.length > bulletinsDisponibles.length && <span className="text-gray-400"> ({bulletins.length - bulletinsDisponibles.length} dans un bordereau)</span>}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openBordereauModal}
            disabled={selectedBulletinIds.length === 0}
            title={selectedBulletinIds.length === 0 ? 'Sélectionnez au moins un bulletin' : `Créer un bordereau (${selectedBulletinIds.length} bulletin${selectedBulletinIds.length > 1 ? 's' : ''})`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${selectedBulletinIds.length > 0
              ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            Nouveau bordereau
            {selectedBulletinIds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">{selectedBulletinIds.length}</span>
            )}
          </button>
          <button onClick={() => openModal('add')} className="px-4 py-2 bg-[#0F2942] text-white rounded-lg text-sm font-medium hover:bg-[#1A3A5C] transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nouveau bulletin
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Rechercher par matricule ou n° bulletin..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={etatFilter} onChange={(e) => setEtatFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">Tous les états</option>
          <option value="En attente">En attente</option>
          <option value="Validé">Validé</option>
          <option value="Rejeté">Rejeté</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-2 py-3">
                  <label className="flex items-center justify-center cursor-pointer" title="Sélectionner tout">
                    <input
                      type="checkbox"
                      checked={selectAll && selectableBulletins.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">N° Bulletin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Adhérent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Bénéficiaire</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Montant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">État</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs uppercase w-16">PDF</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bulletinsDisponibles.map((b) => {
                const isChecked = selectedBulletinIds.includes(b.id_bulletin);
                return (
                  <tr key={b.id_bulletin} className={`hover:bg-gray-50 transition ${isChecked ? 'bg-blue-50/50' : ''}`}>
                    <td className="w-10 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(b.id_bulletin)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        title="Sélectionner"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.numero_bulletin}</td>
                    <td className="px-4 py-3 text-gray-700">{b.adherent?.nom} {b.adherent?.prenom}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {b.sous_adherent ? `${b.sous_adherent.nom} ${b.sous_adherent.prenom}` : 'L\'adhérent'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{Number(b.montant_depense || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
                    <td className="px-4 py-3"><span className={etatBadge(b.etat)}>{b.etat}</span></td>
                    <td className="px-4 py-3 text-center">
                      {b.pdf_path ? (
                        <button
                          onClick={() => setPdfPreview(b)}
                          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                          title="Aperçu du PDF"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Aperçu
                        </button>
                      ) : (
                        <span className="text-gray-300">
                          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openModal('edit', b)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Modifier">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(b.id_bulletin)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && bulletinsDisponibles.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">
                  {bulletins.length > 0
                    ? 'Tous les bulletins sont rattachés à un bordereau.'
                    : 'Aucun bulletin trouvé'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">Page {meta.current_page} sur {meta.last_page}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={meta.current_page <= 1}
                onClick={() => fetchBulletins(meta.current_page - 1)}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              {(() => {
                const pages = [];
                const total = meta.last_page;
                const current = meta.current_page;
                const addPage = (p) => { if (!pages.includes(p) && p >= 1 && p <= total) pages.push(p); };
                addPage(1);
                if (current > 3) pages.push('...');
                addPage(current - 1);
                addPage(current);
                addPage(current + 1);
                if (current < total - 2) pages.push('...');
                addPage(total);
                return pages.map((p, i) =>
                  p === '...' ? (
                    <span key={`e-${i}`} className="px-1 text-xs text-gray-400 select-none">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => fetchBulletins(p)}
                      className={`min-w-[28px] px-2 py-1.5 text-xs font-medium rounded-lg transition ${
                        p === current
                          ? 'bg-[#0F2942] text-white shadow-sm'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
              <button
                disabled={meta.current_page >= meta.last_page}
                onClick={() => fetchBulletins(meta.current_page + 1)}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bordereau creation modal */}
      {showBordereauModal && (
        <BordereauModal
          selectedBulletins={bulletinsDisponibles.filter(b => selectedBulletinIds.includes(b.id_bulletin))}
          form={bordereauForm}
          setForm={setBordereauForm}
          onSubmit={handleCreateBordereau}
          onClose={() => setShowBordereauModal(false)}
          loading={bordereauLoading}
        />
      )}

      {(modal === 'add' || modal === 'edit') && (
        <FormModal
          modal={modal}
          form={form}
          details={details}
          adherents={adherents}
          matchedAdherent={matchedAdherent}
          sousAdherents={sousAdherents}
          errors={errors}
          pdfFile={pdfFile}
          existingPdf={selected?.pdf_path || null}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          onMatriculeChange={handleMatriculeChange}
          onDetailChange={handleDetailChange}
          onAddDetail={handleAddDetail}
          onRemoveDetail={handleRemoveDetail}
          onPdfChange={handlePdfChange}
          onRemovePdf={handleRemovePdf}
          onClose={closeModal}
          onPreviewPdf={() => selected && setPdfPreview(selected)}
        />
      )}

      {pdfPreview && (
        <PdfPreviewModal
          bulletin={pdfPreview}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </div>
  );
}

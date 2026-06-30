import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const TYPE_SOIN_OPTIONS = [
  'Consultation',
  'Soins infirmiers',
  'Radiologie',
  'Analyses',
  'Hospitalisation',
  'Médicaments',
  'Kinésithérapie',
  'Dentaire',
  'Ophtalmologie',
  'Autre',
];

function emptyDetail() {
  return {
    date: '',
    montant: '',
    ordonnance: false,
    type_soin: '',
  };
}

function FormModal({ modal, form, details, adherents, matchedAdherent, sousAdherents, errors, onSubmit, onChange, onMatriculeChange, onDetailChange, onAddDetail, onRemoveDetail, onClose }) {
  const selectedAdherent = matchedAdherent || adherents.find((a) => a.id_adherent === Number(form.id_adherent));
  const totalMontant = details.reduce((sum, d) => sum + (parseFloat(d.montant) || 0), 0);

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
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.numero_bulletin} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); onChange('numero_bulletin', val); }} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
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
              <label className="text-xs font-semibold text-gray-700">Détails des soins</label>
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
                    <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs uppercase w-24">Ordonnance</th>
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
                      <td className="px-3 py-1.5 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={d.ordonnance} onChange={(e) => onDetailChange(i, 'ordonnance', e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                          <span className="text-xs text-gray-600">{d.ordonnance ? 'Oui' : 'Non'}</span>
                        </label>
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
                      <td colSpan={5} className="text-center py-6 text-gray-400 text-xs">Aucune ligne. Cliquez sur "Ajouter une ligne" pour commencer.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Montant total</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">{totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT</td>
                  </tr>
                </tfoot>
              </table>
            </div>
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
                <span className="text-gray-700 font-medium">{Number(b.montant_depense || 0).toLocaleString('fr-TN')} DT</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-sm font-bold text-gray-900">{totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Numéro bordereau <span className="text-red-500">*</span></label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.numero_bordereau} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setForm({...form, numero_bordereau: val}); }} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 2024001" autoFocus />
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdherents = async () => {
    try {
      const res = await api.get('/adherents', { params: { per_page: 500 } });
      if (res.data.success) setAdherents(res.data.data);
    } catch (err) { console.error(err); }
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
      const editAdherent = adherents.find((a) => a.id_adherent === Number(bulletin.id_adherent));
      setForm({
        id_adherent: bulletin.id_adherent,
        id_sous_adherent: bulletin.id_sous_adherent || '',
        numero_bulletin: bulletin.numero_bulletin,
        etat: bulletin.etat || 'En attente',
        matricule_saisi: editAdherent?.matricule || '',

      });
      setDetails((bulletin.details || []).map((d) => ({
        ...d,
        montant: d.montant !== null && d.montant !== undefined ? String(d.montant) : '',
        ordonnance: Boolean(d.ordonnance),
      })));
      const adherent = adherents.find((a) => a.id_adherent === Number(bulletin.id_adherent));
      setSousAdherents(adherent?.sous_adherents || []);
    } else {
      setSelected(null);
      setMatchedAdherent(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Filtrer les lignes vides et normaliser les montants
    const validDetails = details
      .filter((d) => parseFloat(d.montant) > 0)
      .map((d) => ({
        ...d,
        montant: d.montant === '' || d.montant === undefined || d.montant === null ? '0' : d.montant,
        ordonnance: d.ordonnance ? 1 : 0,
      }));
    const payload = { ...form, details: validDetails };
    try {
      if (modal === 'add') {
        await api.post('/bulletins', payload);
        showNotif('Bulletin créé avec succès.');
      } else {
        await api.put(`/bulletins/${selected.id_bulletin}`, payload);
        showNotif('Bulletin modifié avec succès.');
      }
      setModal(null);
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
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
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
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date soin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Montant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">État</th>
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
                    <td className="px-4 py-3 text-gray-500">{b.details?.[0]?.date || b.date_soin || '-'}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{Number(b.montant_depense || 0).toLocaleString('fr-TN')} DT</td>
                    <td className="px-4 py-3 text-gray-500">{b.type_soin || b.details?.[0]?.type_soin || '-'}</td>
                    <td className="px-4 py-3"><span className={etatBadge(b.etat)}>{b.etat}</span></td>
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
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">
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
            <div className="flex gap-2">
              <button disabled={meta.current_page <= 1} onClick={() => fetchBulletins(meta.current_page - 1)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50">Précédent</button>
              <button disabled={meta.current_page >= meta.last_page} onClick={() => fetchBulletins(meta.current_page + 1)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50">Suivant</button>
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
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          onMatriculeChange={handleMatriculeChange}
          onDetailChange={handleDetailChange}
          onAddDetail={handleAddDetail}
          onRemoveDetail={handleRemoveDetail}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

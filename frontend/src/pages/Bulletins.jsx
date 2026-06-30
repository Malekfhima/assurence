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
    type_soin: '',
  };
}

function FormModal({ modal, form, details, adherents, matchedAdherent, sousAdherents, errors, pdfFile, existingPdf, onSubmit, onChange, onMatriculeChange, onDetailChange, onAddDetail, onRemoveDetail, onPdfChange, onRemovePdf, onClose }) {
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
                    <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">{totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT</td>
                  </tr>
                </tfoot>
              </table>
            </div>
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
                <a
                  href={`/api/bulletins/${form.id_bulletin}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Voir le PDF actuel
                </a>
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
  const [pdfFile, setPdfFile] = useState(null);
  const [form, setForm] = useState({ id_adherent: '', id_sous_adherent: '', numero_bulletin: '', etat: 'En attente', matricule_saisi: '' });
  const [details, setDetails] = useState([]);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const matriculeTimeoutRef = useRef(null);

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
      const adherent = adherents.find((a) => a.id_adherent === Number(bulletin.id_adherent));
      setSousAdherents(adherent?.sous_adherents || []);
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
    // Filtrer les lignes vides et normaliser les montants
    const validDetails = details
      .filter((d) => parseFloat(d.montant) > 0)
      .map((d) => ({
        ...d,
        montant: d.montant === '' || d.montant === undefined || d.montant === null ? '0' : d.montant,
      }));

    try {
      let payload;

      if (pdfFile) {
        // Utiliser FormData quand il y a un fichier PDF
        const formData = new FormData();
        formData.append('id_adherent', form.id_adherent);
        formData.append('id_sous_adherent', form.id_sous_adherent || '');
        formData.append('numero_bulletin', form.numero_bulletin);
        formData.append('etat', form.etat || 'En attente');
        formData.append('pdf', pdfFile);

        validDetails.forEach((detail, index) => {
          formData.append(`details[${index}][date]`, detail.date || '');
          formData.append(`details[${index}][montant]`, detail.montant);
          formData.append(`details[${index}][type_soin]`, detail.type_soin || '');
        });

        if (modal === 'edit' && selected) {
          formData.append('_method', 'PUT');
        }

        payload = formData;
      } else {
        // Envoyer en JSON si pas de fichier
        payload = { ...form, details: validDetails };
      }

      if (modal === 'add') {
        await api.post('/bulletins', payload);
        showNotif('Bulletin créé avec succès.');
      } else {
        if (!pdfFile) {
          await api.put(`/bulletins/${selected.id_bulletin}`, payload);
        } else {
          // POST avec _method: PUT pour les uploads de fichiers
          await api.post(`/bulletins/${selected.id_bulletin}`, payload);
        }
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

  return (
    <div className="space-y-4">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>{notification.msg}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Bulletins de soin</h1>
          <p className="text-sm text-gray-500 mt-1">{meta.total} bulletins</p>
        </div>
        <button onClick={() => openModal('add')} className="px-4 py-2 bg-[#0F2942] text-white rounded-lg text-sm font-medium hover:bg-[#1A3A5C] transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nouveau bulletin
        </button>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">N° Bulletin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Adhérent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Bénéficiaire</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date soin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Montant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">État</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs uppercase w-16">PDF</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bulletins.map((b) => (
                <tr key={b.id_bulletin} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.numero_bulletin}</td>
                  <td className="px-4 py-3 text-gray-700">{b.adherent?.nom} {b.adherent?.prenom}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {b.sous_adherent ? `${b.sous_adherent.nom} ${b.sous_adherent.prenom}` : 'L\'adhérent'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{b.details?.[0]?.date || b.date_soin || '-'}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{Number(b.montant_depense || 0).toLocaleString('fr-TN')} DT</td>
                  <td className="px-4 py-3 text-gray-500">{b.type_soin || '-'}</td>
                  <td className="px-4 py-3"><span className={etatBadge(b.etat)}>{b.etat}</span></td>
                  <td className="px-4 py-3 text-center">
                    {b.pdf_path ? (
                      <a
                        href={`/api/bulletins/${b.id_bulletin}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Télécharger le PDF"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </a>
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
              ))}
              {!loading && bulletins.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">Aucun bulletin trouvé</td></tr>
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
        />
      )}
    </div>
  );
}

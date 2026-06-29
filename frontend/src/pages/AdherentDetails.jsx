import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const tabs = [
  { key: 'info', label: 'Informations', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { key: 'sous', label: 'Sous-adhérents', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'bulletins', label: 'Bulletins de soins', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'bordereaux', label: 'Bordereaux', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
];

const etatCivilLabel = { 'C': 'Célibataire', 'M': 'Marié(e)', 'D': 'Divorcé(e)', 'V': 'Veuf(ve)' };
const etatBadge = (etat) => {
  const styles = {
    'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
    'Validé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Rejeté': 'bg-red-50 text-red-700 border-red-200',
  };
  return `inline-flex px-2 py-1 rounded-full text-xs font-medium border ${styles[etat] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

const statutBordereauBadge = (statut) => {
  const styles = {
    'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
    'Envoyé': 'bg-blue-50 text-blue-700 border-blue-200',
    'Traité': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return `inline-flex px-2 py-1 rounded-full text-xs font-medium border ${styles[statut] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

// Modal wrapper
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Info field component
function InfoField({ label, value }) {
  return (
    <div>
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value || '-'}</p>
    </div>
  );
}

export default function AdherentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [adherent, setAdherent] = useState(null);
  const [sousAdherents, setSousAdherents] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [bordereaux, setBordereaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modals state
  const [editInfoModal, setEditInfoModal] = useState(false);
  const [sousModal, setSousModal] = useState(null); // 'add' | 'edit'
  const [sousSelected, setSousSelected] = useState(null);
  const [bulletinModal, setBulletinModal] = useState(null);
  const [bulletinSelected, setBulletinSelected] = useState(null);
  const [bordereauModal, setBordereauModal] = useState(null);
  const [bordereauSelected, setBordereauSelected] = useState(null);

  // Forms
  const [infoForm, setInfoForm] = useState({});
  const [infoErrors, setInfoErrors] = useState({});
  const [sousForm, setSousForm] = useState({ nom: '', prenom: '', date_naissance: '', sexe: '', lien_parente: '' });
  const [sousErrors, setSousErrors] = useState({});
  const [bulletinForm, setBulletinForm] = useState({ numero_bulletin: '', date_soin: '', montant_depense: '', type_soin: '', description: '', etat: 'En attente' });
  const [bordereauForm, setBordereauForm] = useState({ id_bulletin: '', numero_bordereau: '', date_envoi: '', statut: 'En attente', commentaire: '' });
  const [viewBulletin, setViewBulletin] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch all data
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [adherentRes, sousRes, bulletinsRes, bordereauxRes] = await Promise.all([
        api.get(`/adherents/${id}`),
        api.get('/sous-adherents', { params: { id_adherent: id, per_page: 100 } }),
        api.get('/bulletins', { params: { id_adherent: id, per_page: 100 } }),
        api.get('/bordereaux', { params: { id_adherent: id, per_page: 100 } }),
      ]);

      if (adherentRes.data.success) setAdherent(adherentRes.data.data);
      if (sousRes.data.success) setSousAdherents(sousRes.data.data);
      if (bulletinsRes.data.success) setBulletins(bulletinsRes.data.data);
      if (bordereauxRes.data.success) setBordereaux(bordereauxRes.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        showNotif('Adhérent introuvable.', 'error');
        navigate('/adherents');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const validateInfoForm = () => {
    const newErrors = {};
    const required = ['matricule', 'nom', 'prenom', 'etat_civil', 'sexe', 'date_naissance', 'date_adhesion', 'adresse', 'cin', 'telephone', 'statut'];
    required.forEach(field => {
      const val = infoForm[field];
      if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
        newErrors[field] = 'Ce champ est obligatoire.';
      }
    });
    setInfoErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Edit Adherent Info ---
  const openEditInfo = () => {
    setInfoForm({ ...adherent });
    setInfoErrors({});
    setEditInfoModal(true);
  };

  const handleEditInfo = async (e) => {
    e.preventDefault();
    if (!validateInfoForm()) return;
    try {
      const res = await api.put(`/adherents/${id}`, infoForm);
      if (res.data.success) {
        setAdherent(res.data.data);
        showNotif('Adhérent modifié avec succès.');
        setEditInfoModal(false);
      }
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const fieldErrors = {};
        Object.keys(serverErrors).forEach(field => {
          fieldErrors[field] = serverErrors[field][0];
        });
        setInfoErrors(fieldErrors);
      } else {
        showNotif(err.response?.data?.message || 'Erreur lors de la modification.', 'error');
      }
    }
  };

  const handleDeleteAdherent = async () => {
    if (!window.confirm('Confirmer la suppression de cet adhérent ?')) return;
    try {
      await api.delete(`/adherents/${id}`);
      showNotif('Adhérent supprimé avec succès.');
      navigate('/adherents');
    } catch (err) {
      showNotif('Erreur lors de la suppression.', 'error');
    }
  };

  // --- Sous-adhérents CRUD ---
  const validateSousForm = () => {
    const newErrors = {};
    const required = ['nom', 'prenom', 'date_naissance', 'sexe', 'lien_parente'];
    required.forEach(field => {
      const val = sousForm[field];
      if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
        newErrors[field] = 'Ce champ est obligatoire.';
      }
    });
    setSousErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openSousModal = (type, sous = null) => {
    if (type === 'edit' && sous) {
      setSousSelected(sous);
      setSousForm({ ...sous });
    } else {
      setSousSelected(null);
      setSousForm({ nom: '', prenom: '', date_naissance: '', sexe: '', lien_parente: '' });
    }
    setSousErrors({});
    setSousModal(type);
  };

  const handleSousSubmit = async (e) => {
    e.preventDefault();
    if (!validateSousForm()) return;
    try {
      const data = { ...sousForm, id_adherent: parseInt(id) };
      if (sousModal === 'add') {
        await api.post('/sous-adherents', data);
        showNotif('Sous-adhérent créé avec succès.');
      } else {
        await api.put(`/sous-adherents/${sousSelected.id_sous_adherent}`, data);
        showNotif('Sous-adhérent modifié avec succès.');
      }
      setSousModal(null);
      fetchAll();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const fieldErrors = {};
        Object.keys(serverErrors).forEach(field => {
          fieldErrors[field] = serverErrors[field][0];
        });
        setSousErrors(fieldErrors);
      } else {
        showNotif(err.response?.data?.message || 'Erreur.', 'error');
      }
    }
  };

  const handleDeleteSous = async (idSous) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(`/sous-adherents/${idSous}`);
      showNotif('Sous-adhérent supprimé.');
      fetchAll();
    } catch (err) {
      showNotif('Erreur lors de la suppression.', 'error');
    }
  };

  // --- Bulletins CRUD ---
  const openBulletinModal = (type, bulletin = null) => {
    if (type === 'edit' && bulletin) {
      setBulletinSelected(bulletin);
      setBulletinForm({ ...bulletin });
    } else {
      setBulletinSelected(null);
      setBulletinForm({ numero_bulletin: '', date_soin: '', montant_depense: '', type_soin: '', description: '', etat: 'En attente' });
    }
    setBulletinModal(type);
  };

  const handleBulletinSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...bulletinForm, id_adherent: parseInt(id) };
      if (bulletinModal === 'add') {
        await api.post('/bulletins', data);
        showNotif('Bulletin créé avec succès.');
      } else {
        await api.put(`/bulletins/${bulletinSelected.id_bulletin}`, data);
        showNotif('Bulletin modifié avec succès.');
      }
      setBulletinModal(null);
      fetchAll();
    } catch (err) {
      showNotif(err.response?.data?.message || 'Erreur.', 'error');
    }
  };

  const handleDeleteBulletin = async (idBulletin) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(`/bulletins/${idBulletin}`);
      showNotif('Bulletin supprimé.');
      fetchAll();
    } catch (err) {
      showNotif('Erreur lors de la suppression.', 'error');
    }
  };



  // --- Bordereaux CRUD ---
  const openBordereauModal = (type, bordereau = null) => {
    if (type === 'edit' && bordereau) {
      setBordereauSelected(bordereau);
      setBordereauForm({ ...bordereau });
    } else {
      setBordereauSelected(null);
      setBordereauForm({ id_bulletin: '', numero_bordereau: '', date_envoi: '', statut: 'En attente', commentaire: '' });
    }
    setBordereauModal(type);
  };

  const handleBordereauSubmit = async (e) => {
    e.preventDefault();
    try {
      if (bordereauModal === 'add') {
        await api.post('/bordereaux', bordereauForm);
        showNotif('Bordereau créé avec succès.');
      } else {
        await api.put(`/bordereaux/${bordereauSelected.id_bordereau}`, bordereauForm);
        showNotif('Bordereau modifié avec succès.');
      }
      setBordereauModal(null);
      fetchAll();
    } catch (err) {
      showNotif(err.response?.data?.message || 'Erreur.', 'error');
    }
  };

  const handleDeleteBordereau = async (idBordereau) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(`/bordereaux/${idBordereau}`);
      showNotif('Bordereau supprimé.');
      fetchAll();
    } catch (err) {
      showNotif('Erreur lors de la suppression.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Chargement...</div>
      </div>
    );
  }

  if (!adherent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Adhérent introuvable.</p>
        <button onClick={() => navigate('/adherents')} className="mt-3 text-sm text-blue-600 hover:underline">Retour à la liste</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm text-white ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/adherents')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Retour">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Dossier : {adherent.nom} {adherent.prenom}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Matricule {adherent.matricule} · {adherent.cin ? `CIN ${adherent.cin}` : ''} ·{' '}
              <span className={adherent.statut === 'Actif' ? 'text-emerald-600' : 'text-gray-400'}>
                {adherent.statut}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tab.key === 'sous' ? sousAdherents.length
              : tab.key === 'bulletins' ? bulletins.length
              : tab.key === 'bordereaux' ? bordereaux.length
              : null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-[#0F2942] text-[#0F2942]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                </svg>
                {tab.label}
                {count !== null && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    isActive ? 'bg-[#0F2942]/10 text-[#0F2942]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* === TAB: Informations === */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Informations personnelles</h2>
            <div className="flex gap-2">
              <button onClick={openEditInfo} className="px-3 py-1.5 text-xs bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </button>
              <button onClick={handleDeleteAdherent} className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer
              </button>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoField label="Matricule" value={adherent.matricule} />
            <InfoField label="Nom" value={adherent.nom} />
            <InfoField label="Prénom" value={adherent.prenom} />
            <InfoField label="État civil" value={etatCivilLabel[adherent.etat_civil] || adherent.etat_civil} />
            <InfoField label="Sexe" value={adherent.sexe === 'H' ? 'Homme' : adherent.sexe === 'F' ? 'Femme' : adherent.sexe} />
            <InfoField label="Date de naissance" value={adherent.date_naissance} />
            <InfoField label="Date d'adhésion" value={adherent.date_adhesion} />
            <InfoField label="Adresse" value={adherent.adresse} />
            <InfoField label="CIN" value={adherent.cin} />
            <InfoField label="Téléphone" value={adherent.telephone} />
            <InfoField label="Statut" value={adherent.statut} />
          </div>
        </div>
      )}

      {/* === TAB: Sous-adhérents === */}
      {activeTab === 'sous' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Sous-adhérents ({sousAdherents.length})</h2>
            <button onClick={() => openSousModal('add')} className="px-3 py-1.5 text-xs bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Nom</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Prénom</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date naissance</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Sexe</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Lien parenté</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sousAdherents.map((s) => (
                  <tr key={s.id_sous_adherent} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.nom}</td>
                    <td className="px-4 py-3 text-gray-700">{s.prenom}</td>
                    <td className="px-4 py-3 text-gray-500">{s.date_naissance || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.sexe === 'H' ? 'Homme' : s.sexe === 'F' ? 'Femme' : s.sexe || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.lien_parente || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openSousModal('edit', s)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Modifier">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteSous(s.id_sous_adherent)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sousAdherents.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">Aucun sous-adhérent</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === TAB: Bulletins de soins === */}
      {activeTab === 'bulletins' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Bulletins de soins ({bulletins.length})</h2>
            <button onClick={() => openBulletinModal('add')} className="px-3 py-1.5 text-xs bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">N° Bulletin</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">N° Bordereau</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date soin</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Montant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">État</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bulletins.map((b) => (
                  <tr key={b.id_bulletin} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.numero_bulletin}</td>
                    <td className="px-4 py-3 text-gray-500">{b.numero_bordereau || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{b.date_soin || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{b.type_soin || '-'}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{Number(b.montant_depense || 0).toLocaleString('fr-TN')} DT</td>
                    <td className="px-4 py-3"><span className={etatBadge(b.etat)}>{b.etat}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewBulletin(b)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Voir détails">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => openBulletinModal('edit', b)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Modifier">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteBulletin(b.id_bulletin)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {bulletins.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">Aucun bulletin de soin</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === TAB: Bordereaux === */}
      {activeTab === 'bordereaux' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Bordereaux ({bordereaux.length})</h2>
            <button onClick={() => openBordereauModal('add')} className="px-3 py-1.5 text-xs bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">N° Bordereau</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Bulletin lié</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date envoi</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Commentaire</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bordereaux.map((b) => (
                  <tr key={b.id_bordereau} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.numero_bordereau}</td>
                    <td className="px-4 py-3 text-gray-500">N°{b.bulletin_soin?.numero_bulletin || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{b.date_envoi || '-'}</td>
                    <td className="px-4 py-3"><span className={statutBordereauBadge(b.statut)}>{b.statut || 'En attente'}</span></td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{b.commentaire || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openBordereauModal('edit', b)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Modifier">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteBordereau(b.id_bordereau)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {bordereaux.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">Aucun bordereau</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== MODALS ========== */}

      {/* Edit Adherent Info Modal */}
      <Modal open={editInfoModal} onClose={() => setEditInfoModal(false)} title="Modifier l'adhérent">
        <form onSubmit={handleEditInfo} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Matricule <span className="text-red-500">*</span></label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={infoForm.matricule || ''} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setInfoForm({...infoForm, matricule: val}); setInfoErrors({...infoErrors, matricule: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${infoErrors.matricule ? 'border-red-400' : 'border-gray-300'}`} />
              {infoErrors.matricule && <p className="text-xs text-red-500 mt-1">{infoErrors.matricule}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CIN <span className="text-red-500">*</span></label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={infoForm.cin || ''} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setInfoForm({...infoForm, cin: val}); setInfoErrors({...infoErrors, cin: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${infoErrors.cin ? 'border-red-400' : 'border-gray-300'}`} />
              {infoErrors.cin && <p className="text-xs text-red-500 mt-1">{infoErrors.cin}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
              <input type="text" value={infoForm.nom || ''} onChange={(e) => { setInfoForm({...infoForm, nom: e.target.value}); setInfoErrors({...infoErrors, nom: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${infoErrors.nom ? 'border-red-400' : 'border-gray-300'}`} />
              {infoErrors.nom && <p className="text-xs text-red-500 mt-1">{infoErrors.nom}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prénom <span className="text-red-500">*</span></label>
              <input type="text" value={infoForm.prenom || ''} onChange={(e) => { setInfoForm({...infoForm, prenom: e.target.value}); setInfoErrors({...infoErrors, prenom: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${infoErrors.prenom ? 'border-red-400' : 'border-gray-300'}`} />
              {infoErrors.prenom && <p className="text-xs text-red-500 mt-1">{infoErrors.prenom}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">État civil <span className="text-red-500">*</span></label>
              <select value={infoForm.etat_civil || ''} onChange={(e) => { setInfoForm({...infoForm, etat_civil: e.target.value}); setInfoErrors({...infoErrors, etat_civil: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${infoErrors.etat_civil ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">Sélectionner</option>
                <option value="C">Célibataire</option>
                <option value="M">Marié(e)</option>
                <option value="D">Divorcé(e)</option>
                <option value="V">Veuf(ve)</option>
              </select>
              {infoErrors.etat_civil && <p className="text-xs text-red-500 mt-1">{infoErrors.etat_civil}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sexe <span className="text-red-500">*</span></label>
              <select value={infoForm.sexe || ''} onChange={(e) => { setInfoForm({...infoForm, sexe: e.target.value}); setInfoErrors({...infoErrors, sexe: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${infoErrors.sexe ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">Sélectionner</option>
                <option value="H">Homme</option>
                <option value="F">Femme</option>
              </select>
              {infoErrors.sexe && <p className="text-xs text-red-500 mt-1">{infoErrors.sexe}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date naissance <span className="text-red-500">*</span></label>
              <input type="date" value={infoForm.date_naissance || ''} onChange={(e) => { setInfoForm({...infoForm, date_naissance: e.target.value}); setInfoErrors({...infoErrors, date_naissance: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${infoErrors.date_naissance ? 'border-red-400' : 'border-gray-300'}`} />
              {infoErrors.date_naissance && <p className="text-xs text-red-500 mt-1">{infoErrors.date_naissance}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date adhésion <span className="text-red-500">*</span></label>
              <input type="date" value={infoForm.date_adhesion || ''} onChange={(e) => { setInfoForm({...infoForm, date_adhesion: e.target.value}); setInfoErrors({...infoErrors, date_adhesion: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${infoErrors.date_adhesion ? 'border-red-400' : 'border-gray-300'}`} />
              {infoErrors.date_adhesion && <p className="text-xs text-red-500 mt-1">{infoErrors.date_adhesion}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Adresse <span className="text-red-500">*</span></label>
            <input type="text" value={infoForm.adresse || ''} onChange={(e) => { setInfoForm({...infoForm, adresse: e.target.value}); setInfoErrors({...infoErrors, adresse: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${infoErrors.adresse ? 'border-red-400' : 'border-gray-300'}`} />
            {infoErrors.adresse && <p className="text-xs text-red-500 mt-1">{infoErrors.adresse}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone <span className="text-red-500">*</span></label>
              <input type="text" value={infoForm.telephone || ''} onChange={(e) => { setInfoForm({...infoForm, telephone: e.target.value}); setInfoErrors({...infoErrors, telephone: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${infoErrors.telephone ? 'border-red-400' : 'border-gray-300'}`} />
              {infoErrors.telephone && <p className="text-xs text-red-500 mt-1">{infoErrors.telephone}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Statut <span className="text-red-500">*</span></label>
              <select value={infoForm.statut || 'Actif'} onChange={(e) => { setInfoForm({...infoForm, statut: e.target.value}); setInfoErrors({...infoErrors, statut: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${infoErrors.statut ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
              {infoErrors.statut && <p className="text-xs text-red-500 mt-1">{infoErrors.statut}</p>}
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setEditInfoModal(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* Sous-adhérent Form Modal */}
      <Modal open={sousModal === 'add' || sousModal === 'edit'} onClose={() => setSousModal(null)} title={sousModal === 'add' ? 'Ajouter un sous-adhérent' : 'Modifier le sous-adhérent'}>
        <form onSubmit={handleSousSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
              <input type="text" value={sousForm.nom || ''} onChange={(e) => { setSousForm({...sousForm, nom: e.target.value}); setSousErrors({...sousErrors, nom: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${sousErrors.nom ? 'border-red-400' : 'border-gray-300'}`} />
              {sousErrors.nom && <p className="text-xs text-red-500 mt-1">{sousErrors.nom}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prénom <span className="text-red-500">*</span></label>
              <input type="text" value={sousForm.prenom || ''} onChange={(e) => { setSousForm({...sousForm, prenom: e.target.value}); setSousErrors({...sousErrors, prenom: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${sousErrors.prenom ? 'border-red-400' : 'border-gray-300'}`} />
              {sousErrors.prenom && <p className="text-xs text-red-500 mt-1">{sousErrors.prenom}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date naissance <span className="text-red-500">*</span></label>
              <input type="date" value={sousForm.date_naissance || ''} onChange={(e) => { setSousForm({...sousForm, date_naissance: e.target.value}); setSousErrors({...sousErrors, date_naissance: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${sousErrors.date_naissance ? 'border-red-400' : 'border-gray-300'}`} />
              {sousErrors.date_naissance && <p className="text-xs text-red-500 mt-1">{sousErrors.date_naissance}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sexe <span className="text-red-500">*</span></label>
              <select value={sousForm.sexe || ''} onChange={(e) => { setSousForm({...sousForm, sexe: e.target.value}); setSousErrors({...sousErrors, sexe: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${sousErrors.sexe ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">Sélectionner</option>
                <option value="H">Homme</option>
                <option value="F">Femme</option>
              </select>
              {sousErrors.sexe && <p className="text-xs text-red-500 mt-1">{sousErrors.sexe}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Lien de parenté <span className="text-red-500">*</span></label>
              <select value={sousForm.lien_parente || ''} onChange={(e) => { setSousForm({...sousForm, lien_parente: e.target.value}); setSousErrors({...sousErrors, lien_parente: ''}); }} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${sousErrors.lien_parente ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">Sélectionner...</option>
                <option value="Conjoint">Conjoint</option>
                <option value="Enfant">Enfant</option>
              </select>
              {sousErrors.lien_parente && <p className="text-xs text-red-500 mt-1">{sousErrors.lien_parente}</p>}
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setSousModal(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* Bulletin Form Modal */}
      <Modal open={bulletinModal === 'add' || bulletinModal === 'edit'} onClose={() => setBulletinModal(null)} title={bulletinModal === 'add' ? 'Ajouter un bulletin de soin' : 'Modifier le bulletin de soin'}>
        <form onSubmit={handleBulletinSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Numéro bulletin</label>               <input type="text" inputMode="numeric" pattern="[0-9]*" value={bulletinForm.numero_bulletin || ''} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setBulletinForm({...bulletinForm, numero_bulletin: val}); }} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date soin</label>
              <input type="date" value={bulletinForm.date_soin || ''} onChange={(e) => setBulletinForm({...bulletinForm, date_soin: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Montant (DT)</label>               <input type="text" inputMode="decimal" value={bulletinForm.montant_depense || ''} onChange={(e) => { let val = e.target.value.replace(/[^0-9.,]/g, ''); val = val.replace(',', '.'); setBulletinForm({...bulletinForm, montant_depense: val}); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type de soin</label>
              <input type="text" value={bulletinForm.type_soin || ''} onChange={(e) => setBulletinForm({...bulletinForm, type_soin: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={bulletinForm.description || ''} onChange={(e) => setBulletinForm({...bulletinForm, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setBulletinModal(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* Bordereau Form Modal */}
      <Modal open={bordereauModal === 'add' || bordereauModal === 'edit'} onClose={() => setBordereauModal(null)} title={bordereauModal === 'add' ? 'Créer un bordereau' : 'Modifier le bordereau'}>
        <form onSubmit={handleBordereauSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bulletin de soin lié</label>
            <select value={bordereauForm.id_bulletin || ''} onChange={(e) => setBordereauForm({...bordereauForm, id_bulletin: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Sélectionner un bulletin</option>
              {bulletins.map((b) => (
                <option key={b.id_bulletin} value={b.id_bulletin}>N°{b.numero_bulletin} - {b.type_soin || 'Soin'} ({Number(b.montant_depense || 0).toLocaleString('fr-TN')} DT)</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Numéro bordereau</label>               <input type="text" inputMode="numeric" pattern="[0-9]*" value={bordereauForm.numero_bordereau || ''} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setBordereauForm({...bordereauForm, numero_bordereau: val}); }} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date envoi</label>
              <input type="date" value={bordereauForm.date_envoi || ''} onChange={(e) => setBordereauForm({...bordereauForm, date_envoi: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
            <select value={bordereauForm.statut || 'En attente'} onChange={(e) => setBordereauForm({...bordereauForm, statut: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="En attente">En attente</option>
              <option value="Envoyé">Envoyé</option>
              <option value="Traité">Traité</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Commentaire</label>
            <textarea value={bordereauForm.commentaire || ''} onChange={(e) => setBordereauForm({...bordereauForm, commentaire: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setBordereauModal(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* View Bulletin Details Modal */}
      <Modal open={!!viewBulletin} onClose={() => setViewBulletin(null)} title="Détails du bulletin de soin">
        {viewBulletin && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Numéro bulletin" value={viewBulletin.numero_bulletin} />
              <InfoField label="Numéro bordereau" value={viewBulletin.numero_bordereau} />
              <InfoField label="Date soin" value={viewBulletin.date_soin} />
              <InfoField label="Type de soin" value={viewBulletin.type_soin} />
              <InfoField label="Montant dépense" value={Number(viewBulletin.montant_depense || 0).toLocaleString('fr-TN') + ' DT'} />
              <InfoField label="État" value={viewBulletin.etat} />
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Description</span>
              <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{viewBulletin.description || 'Aucune description'}</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setViewBulletin(null)} className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition">Fermer</button>
            </div>
          </div>
        )}
      </Modal>


    </div>
  );
}

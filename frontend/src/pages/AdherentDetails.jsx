import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const etatCivilOptions = { C: 'Célibataire', M: 'Marié(e)', D: 'Divorcé(e)', V: 'Veuf(ve)' };
const lienParenteOptions = ['Conjoint', 'Enfant'];

const etatBadge = (etat) => {
  const styles = {
    'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
    'Validé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Rejeté': 'bg-red-50 text-red-700 border-red-200',
  };
  return `inline-flex px-2 py-1 rounded-full text-xs font-medium border ${styles[etat] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

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

function InfoField({ label, value }) {
  return (
    <div>
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value || '-'}</p>
    </div>
  );
}

function SectionHeader({ title, count, onAdd, addLabel }) {
  return (
    <div className="p-5 border-b border-gray-200 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-900">{title} {count !== undefined && <span className="text-gray-400 font-normal">({count})</span>}</h2>
      {onAdd && (
        <button onClick={onAdd} className="px-3 py-1.5 text-xs bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {addLabel || 'Ajouter'}
        </button>
      )}
    </div>
  );
}

function FormInput({ label, name, type = 'text', value, onChange, error, required, placeholder, options, inputMode }) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select id={id} value={value} onChange={(e) => onChange(name, e.target.value)} required={required}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${error ? 'border-red-400' : 'border-gray-300'}`}>
          <option value="">Sélectionner</option>
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input id={id} type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(name, e.target.value)}
          required={required} placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${error ? 'border-red-400' : 'border-gray-300'}`} />
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function AdherentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [adherent, setAdherent] = useState(null);
  const [sousAdherents, setSousAdherents] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [viewBulletin, setViewBulletin] = useState(null);

  // Edit adherent modal state
  const [editAdherentModal, setEditAdherentModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Sous-adherent modal state
  const [saModal, setSaModal] = useState(null); // null | 'add' | 'edit'
  const [selectedSa, setSelectedSa] = useState(null);
  const [saForm, setSaForm] = useState({ nom: '', prenom: '', date_naissance: '', sexe: '', lien_parente: '' });
  const [saErrors, setSaErrors] = useState({});
  const [saLoading, setSaLoading] = useState(false);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/adherents/${id}/full`);
      if (res.data.success) {
        const { adherent, sous_adherents, bulletins } = res.data.data;
        setAdherent(adherent);
        setSousAdherents(sous_adherents || []);
        setBulletins(bulletins || []);
      }
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

  // --- Edit Adherent handlers ---

  const openEditAdherent = () => {
    setEditForm({ ...adherent, etat_civil: adherent.etat_civil || '', sexe: adherent.sexe || '' });
    setEditErrors({});
    setEditAdherentModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setEditErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.put(`/adherents/${id}`, editForm);
      showNotif('Adhérent modifié avec succès.');
      setEditAdherentModal(false);
      fetchAll();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const fieldErrors = {};
        Object.keys(serverErrors).forEach((field) => { fieldErrors[field] = serverErrors[field][0]; });
        setEditErrors(fieldErrors);
      } else {
        showNotif(err.response?.data?.message || 'Erreur lors de la modification.', 'error');
      }
    } finally {
      setEditLoading(false);
    }
  };

  // --- Sous-adherent handlers ---

  const openAddSa = () => {
    setSaForm({ nom: '', prenom: '', date_naissance: '', sexe: '', lien_parente: '' });
    setSaErrors({});
    setSelectedSa(null);
    setSaModal('add');
  };

  const openEditSa = (sa) => {
    setSaForm({ ...sa });
    setSaErrors({});
    setSelectedSa(sa);
    setSaModal('edit');
  };

  const handleSaChange = (field, value) => {
    setSaForm((prev) => ({ ...prev, [field]: value }));
    setSaErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSaSubmit = async (e) => {
    e.preventDefault();
    setSaLoading(true);
    try {
      if (saModal === 'add') {
        await api.post('/sous-adherents', { ...saForm, id_adherent: Number(id) });
        showNotif('Sous-adhérent ajouté avec succès.');
      } else {
        await api.put(`/sous-adherents/${selectedSa.id_sous_adherent}`, saForm);
        showNotif('Sous-adhérent modifié avec succès.');
      }
      setSaModal(null);
      fetchAll();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const fieldErrors = {};
        Object.keys(serverErrors).forEach((field) => { fieldErrors[field] = serverErrors[field][0]; });
        setSaErrors(fieldErrors);
      } else {
        showNotif(err.response?.data?.message || 'Erreur lors de la sauvegarde.', 'error');
      }
    } finally {
      setSaLoading(false);
    }
  };

  const handleDeleteSa = async (sa) => {
    if (!window.confirm(`Confirmer la suppression de ${sa.prenom} ${sa.nom} ?`)) return;
    try {
      await api.delete(`/sous-adherents/${sa.id_sous_adherent}`);
      showNotif('Sous-adhérent supprimé avec succès.');
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

      {/* === SUMMARY STATS === */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{sousAdherents.length}</p>
            <p className="text-xs text-gray-500">Sous-adhérents</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{bulletins.length}</p>
            <p className="text-xs text-gray-500">Bulletins de soins</p>
          </div>
        </div>
      </div>

      {/* === SECTION: Informations personnelles === */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Informations personnelles</h2>
          <div className="flex gap-2">
            <button onClick={openEditAdherent} className="px-3 py-1.5 text-xs text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </button>
            <button onClick={async () => {
              if (!window.confirm('Confirmer la suppression de cet adhérent ?')) return;
              try {
                await api.delete(`/adherents/${id}`);
                showNotif('Adhérent supprimé avec succès.');
                navigate('/adherents');
              } catch {
                showNotif('Erreur lors de la suppression.', 'error');
              }
            }} className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center gap-1">
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
          <InfoField label="État civil" value={etatCivilOptions[adherent.etat_civil] || adherent.etat_civil} />
          <InfoField label="Sexe" value={adherent.sexe === 'H' ? 'Homme' : adherent.sexe === 'F' ? 'Femme' : adherent.sexe} />
          <InfoField label="Date de naissance" value={adherent.date_naissance} />
          <InfoField label="Date d'adhésion" value={adherent.date_adhesion} />
          <InfoField label="Adresse" value={adherent.adresse} />
          <InfoField label="CIN" value={adherent.cin} />
          <InfoField label="Téléphone" value={adherent.telephone} />
          <InfoField label="Statut" value={adherent.statut} />
        </div>
      </div>

      {/* === SECTION: Sous-adhérents === */}
      <div id="sous-adherents" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SectionHeader title="Sous-adhérents" count={sousAdherents.length} onAdd={openAddSa} addLabel="Ajouter" />
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
                      <button onClick={() => openEditSa(s)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Modifier">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteSa(s)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
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

      {/* === SECTION: Bulletins de soins === */}
      <div id="bulletins" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SectionHeader title="Bulletins de soins" count={bulletins.length} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">N° Bulletin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">N° Bordereau</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Sous-adhérent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date soin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Montant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">État</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bulletins.map((b) => (
                <tr key={b.id_bulletin} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.numero_bulletin}</td>
                  <td className="px-4 py-3">
                    {b.bordereau?.numero_bordereau ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                        N°{b.bordereau.numero_bordereau}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium border border-gray-200">Non affecté</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {b.sous_adherent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
                        {b.sous_adherent.prenom} {b.sous_adherent.nom}
                      </span>
                    ) : <span className="text-gray-400 text-xs">-</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{b.date_soin || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{b.type_soin || '-'}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{Number(b.montant_depense || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
                  <td className="px-4 py-3"><span className={etatBadge(b.etat)}>{b.etat}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setViewBulletin(b)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Voir détails">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {bulletins.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Aucun bulletin de soin</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== MODALS ========== */}

      {/* Modal: Modifier Adhérent */}
      <Modal open={editAdherentModal} onClose={() => setEditAdherentModal(false)} title="Modifier l'adhérent">
        <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Matricule" name="matricule" value={editForm.matricule || ''} onChange={handleEditChange} error={editErrors.matricule} required inputMode="numeric" />
            <FormInput label="CIN" name="cin" value={editForm.cin || ''} onChange={handleEditChange} error={editErrors.cin} required inputMode="numeric" />
            <FormInput label="Nom" name="nom" value={editForm.nom || ''} onChange={handleEditChange} error={editErrors.nom} required />
            <FormInput label="Prénom" name="prenom" value={editForm.prenom || ''} onChange={handleEditChange} error={editErrors.prenom} required />
            <FormInput label="État civil" name="etat_civil" value={editForm.etat_civil || ''} onChange={handleEditChange} error={editErrors.etat_civil} required options={['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)']} />
            <FormInput label="Sexe" name="sexe" value={editForm.sexe || ''} onChange={handleEditChange} error={editErrors.sexe} required options={['Homme', 'Femme']} />
            <FormInput label="Date naissance" name="date_naissance" type="date" value={editForm.date_naissance || ''} onChange={handleEditChange} error={editErrors.date_naissance} required />
            <FormInput label="Date adhésion" name="date_adhesion" type="date" value={editForm.date_adhesion || ''} onChange={handleEditChange} error={editErrors.date_adhesion} required />
            <FormInput label="Téléphone" name="telephone" type="tel" value={editForm.telephone || ''} onChange={handleEditChange} error={editErrors.telephone} required />
            <FormInput label="Statut" name="statut" value={editForm.statut || 'Actif'} onChange={handleEditChange} error={editErrors.statut} required options={['Actif', 'Inactif']} />
          </div>
          <FormInput label="Adresse" name="adresse" value={editForm.adresse || ''} onChange={handleEditChange} error={editErrors.adresse} required />
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setEditAdherentModal(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Annuler</button>
            <button type="submit" disabled={editLoading} className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition disabled:opacity-50 flex items-center gap-2">
              {editLoading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ajouter / Modifier Sous-adhérent */}
      <Modal open={saModal !== null} onClose={() => setSaModal(null)} title={saModal === 'add' ? 'Ajouter un sous-adhérent' : 'Modifier le sous-adhérent'}>
        <form onSubmit={handleSaSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Nom" name="nom" value={saForm.nom || ''} onChange={handleSaChange} error={saErrors.nom} required />
            <FormInput label="Prénom" name="prenom" value={saForm.prenom || ''} onChange={handleSaChange} error={saErrors.prenom} required />
            <FormInput label="Date naissance" name="date_naissance" type="date" value={saForm.date_naissance || ''} onChange={handleSaChange} error={saErrors.date_naissance} required />
            <FormInput label="Sexe" name="sexe" value={saForm.sexe || ''} onChange={handleSaChange} error={saErrors.sexe} required options={['Homme', 'Femme']} />
            <FormInput label="Lien de parenté" name="lien_parente" value={saForm.lien_parente || ''} onChange={handleSaChange} error={saErrors.lien_parente} required options={lienParenteOptions} />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setSaModal(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Annuler</button>
            <button type="submit" disabled={saLoading} className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition disabled:opacity-50 flex items-center gap-2">
              {saLoading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {saModal === 'add' ? 'Ajouter' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Bulletin Details */}
      <Modal open={!!viewBulletin} onClose={() => setViewBulletin(null)} title="Détails du bulletin de soin">
        {viewBulletin && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Numéro bulletin" value={viewBulletin.numero_bulletin} />
              <InfoField label="Date soin" value={viewBulletin.date_soin} />
              <InfoField label="Type de soin" value={viewBulletin.type_soin} />
              <InfoField label="Sous-adhérent" value={viewBulletin.sous_adherent ? `${viewBulletin.sous_adherent.prenom} ${viewBulletin.sous_adherent.nom}` : '-'} />
              <InfoField label="Montant dépense" value={Number(viewBulletin.montant_depense || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT'} />
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

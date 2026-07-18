import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function FormModal({ modal, form, errors, onSubmit, onChange, onClose }) {
  const handleChange = (field) => (e) => {
    let val = e.target.value;
    if (field === 'matricule' || field === 'cin') {
      val = val.replace(/\D/g, '');
    }
    onChange(field, val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{modal === 'add' ? 'Nouvel adhérent' : 'Modifier adhérent'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Matricule <span className="text-red-500">*</span></label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.matricule} onChange={handleChange('matricule')} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.matricule ? 'border-red-400' : 'border-gray-300'}`} placeholder="Ex : 12345" />
              {errors.matricule && <p className="text-xs text-red-500 mt-1">{errors.matricule}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CIN <span className="text-red-500">*</span></label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.cin} onChange={handleChange('cin')} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.cin ? 'border-red-400' : 'border-gray-300'}`} placeholder="Ex : 12345678" />
              {errors.cin && <p className="text-xs text-red-500 mt-1">{errors.cin}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
              <input type="text" value={form.nom} onChange={handleChange('nom')} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.nom ? 'border-red-400' : 'border-gray-300'}`} placeholder="Ex : Dupont" />
              {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prénom <span className="text-red-500">*</span></label>
              <input type="text" value={form.prenom} onChange={handleChange('prenom')} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.prenom ? 'border-red-400' : 'border-gray-300'}`} placeholder="Ex : Jean" />
              {errors.prenom && <p className="text-xs text-red-500 mt-1">{errors.prenom}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">État civil <span className="text-red-500">*</span></label>
              <select value={form.etat_civil} onChange={handleChange('etat_civil')} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.etat_civil ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">Sélectionner</option>
                <option value="Célibataire">Célibataire</option>
                <option value="Marié(e)">Marié(e)</option>
                <option value="Divorcé(e)">Divorcé(e)</option>
                <option value="Veuf(ve)">Veuf(ve)</option>
              </select>
              {errors.etat_civil && <p className="text-xs text-red-500 mt-1">{errors.etat_civil}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sexe <span className="text-red-500">*</span></label>
              <select value={form.sexe} onChange={handleChange('sexe')} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.sexe ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">Sélectionner</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
              {errors.sexe && <p className="text-xs text-red-500 mt-1">{errors.sexe}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date naissance <span className="text-red-500">*</span></label>
              <input type="date" value={form.date_naissance} onChange={handleChange('date_naissance')} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.date_naissance ? 'border-red-400' : 'border-gray-300'}`} />
              {errors.date_naissance && <p className="text-xs text-red-500 mt-1">{errors.date_naissance}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date adhésion <span className="text-red-500">*</span></label>
              <input type="date" value={form.date_adhesion} onChange={handleChange('date_adhesion')} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.date_adhesion ? 'border-red-400' : 'border-gray-300'}`} />
              {errors.date_adhesion && <p className="text-xs text-red-500 mt-1">{errors.date_adhesion}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Adresse <span className="text-red-500">*</span></label>
            <input type="text" value={form.adresse} onChange={handleChange('adresse')} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.adresse ? 'border-red-400' : 'border-gray-300'}`} placeholder="Ex : 123 Rue de la Liberté" />
            {errors.adresse && <p className="text-xs text-red-500 mt-1">{errors.adresse}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone <span className="text-red-500">*</span></label>
              <input type="tel" value={form.telephone} onChange={handleChange('telephone')} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.telephone ? 'border-red-400' : 'border-gray-300'}`} placeholder="Ex : 98765432" />
              {errors.telephone && <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Identifiant (autre app)</label>
              <input type="text" value={form.identifiant} onChange={handleChange('identifiant')} className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.identifiant ? 'border-red-400' : 'border-gray-300'}`} placeholder="Identifiant" />
              {errors.identifiant && <p className="text-xs text-red-500 mt-1">{errors.identifiant}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Statut <span className="text-red-500">*</span></label>
              <select value={form.statut} onChange={handleChange('statut')} required className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.statut ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
              {errors.statut && <p className="text-xs text-red-500 mt-1">{errors.statut}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe (autre app)</label>
              <input type="text" value={form.mot_de_passe} onChange={handleChange('mot_de_passe')} className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.mot_de_passe ? 'border-red-400' : 'border-gray-300'}`} placeholder="Mot de passe" />
              {errors.mot_de_passe && <p className="text-xs text-red-500 mt-1">{errors.mot_de_passe}</p>}
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Adherents() {
  const navigate = useNavigate();
  const [adherents, setAdherents] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'view'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ matricule: '', nom: '', prenom: '', etat_civil: '', sexe: '', date_naissance: '', date_adhesion: '', adresse: '', cin: '', telephone: '', identifiant: '', mot_de_passe: '', statut: 'Actif' });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchAdherents = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, per_page: 15 };
      if (search) params.search = search;
      const res = await api.get('/adherents', { params });
      if (res.data.success) {
        setAdherents(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors du chargement des adhérents.';
      console.error(err);
      showNotif(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdherents(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchAdherents(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openModal = async (type, adherent = null) => {
    if (type === 'edit' && adherent) {
      setSelected(adherent);
      setForm({ ...adherent, date_naissance: adherent.date_naissance || '', date_adhesion: adherent.date_adhesion || '', etat_civil: adherent.etat_civil || '', sexe: adherent.sexe || '' });
    } else if (type === 'view' && adherent) {
      setSelected(adherent);
    } else {
      setSelected(null);
      setForm({ matricule: '', nom: '', prenom: '', etat_civil: '', sexe: '', date_naissance: '', date_adhesion: '', adresse: '', cin: '', telephone: '', identifiant: '', mot_de_passe: '', statut: 'Actif' });
    }
    setErrors({});
    setModal(type);
  };

  const closeModal = () => setModal(null);

  const validateForm = () => {
    const newErrors = {};
    const required = ['matricule', 'nom', 'prenom', 'etat_civil', 'sexe', 'date_naissance', 'date_adhesion', 'adresse', 'cin', 'telephone', 'statut'];
    required.forEach(field => {
      if (!form[field] || (typeof form[field] === 'string' && !form[field].trim())) {
        newErrors[field] = 'Ce champ est obligatoire.';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (modal === 'add') {
        await api.post('/adherents', form);
        showNotif('Adhérent créé avec succès.');
      } else if (modal === 'edit') {
        await api.put(`/adherents/${selected.id_adherent}`, form);
        showNotif('Adhérent modifié avec succès.');
      }
      setModal(null);
      fetchAdherents(meta.current_page);
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const fieldErrors = {};
        Object.keys(serverErrors).forEach(field => {
          fieldErrors[field] = serverErrors[field][0];
        });
        setErrors(fieldErrors);
      } else {
        showNotif(err.response?.data?.message || 'Erreur lors de la sauvegarde.', 'error');
      }
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(`/adherents/${id}`);
      showNotif('Adhérent supprimé avec succès.');
      fetchAdherents();
    } catch (err) {
      showNotif('Erreur lors de la suppression.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notification.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Adhérents</h1>
          <p className="text-sm text-gray-500 mt-1">{meta.total} adhérents</p>
        </div>
        <button onClick={() => openModal('add')} className="px-4 py-2 bg-[#0F2942] text-white rounded-lg text-sm font-medium hover:bg-[#1A3A5C] transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Ajouter
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Rechercher par matricule..." value={search} onChange={(e) => setSearch(e.target.value.replace(/\D/g, ''))} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Matricule</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Prénom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">CIN</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Téléphone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Statut</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs uppercase">Sous-adhérents</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adherents.map((a) => (
                <tr key={a.id_adherent} onClick={() => navigate(`/adherents/${a.id_adherent}`)} className="cursor-pointer hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.matricule}</td>
                  <td className="px-4 py-3 text-gray-700">{a.nom}</td>
                  <td className="px-4 py-3 text-gray-700">{a.prenom}</td>
                  <td className="px-4 py-3 text-gray-500">{a.cin || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.telephone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${a.statut?.toLowerCase() === 'actif' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>{a.statut?.toLowerCase() === 'actif' ? 'Actif' : a.statut}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">{a.sous_adherents_count ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openModal('edit', a); }} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Modifier">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(a.id_adherent); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && adherents.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Aucun adhérent trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">Page {meta.current_page} sur {meta.last_page}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={meta.current_page <= 1}
                onClick={() => fetchAdherents(meta.current_page - 1)}
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
                      onClick={() => fetchAdherents(p)}
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
                onClick={() => fetchAdherents(meta.current_page + 1)}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(modal === 'add' || modal === 'edit') && (
        <FormModal
          modal={modal}
          form={form}
          errors={errors}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Adherents() {
  const navigate = useNavigate();
  const [adherents, setAdherents] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'view'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ matricule: '', nom: '', prenom: '', etat_civil: '', sexe: '', date_naissance: '', date_adhesion: '', adresse: '', cin: '', telephone: '', statut: 'Actif' });
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
      console.error(err);
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
      setForm({ ...adherent, date_naissance: adherent.date_naissance || '', date_adhesion: adherent.date_adhesion || '' });
    } else if (type === 'view' && adherent) {
      setSelected(adherent);
    } else {
      setSelected(null);
      setForm({ matricule: '', nom: '', prenom: '', etat_civil: '', sexe: '', date_naissance: '', date_adhesion: '', adresse: '', cin: '', telephone: '', statut: 'Actif' });
    }
    setModal(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      showNotif(err.response?.data?.message || 'Erreur lors de la sauvegarde.', 'error');
    }
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

  const FormModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{modal === 'add' ? 'Nouvel adhérent' : 'Modifier adhérent'}</h3>
          <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Matricule</label>
              <input type="number" value={form.matricule} onChange={(e) => setForm({...form, matricule: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CIN</label>
              <input type="number" value={form.cin} onChange={(e) => setForm({...form, cin: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
              <input type="text" value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
              <input type="text" value={form.prenom} onChange={(e) => setForm({...form, prenom: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">État civil</label>
              <select value={form.etat_civil} onChange={(e) => setForm({...form, etat_civil: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Sélectionner</option>
                <option value="C">Célibataire</option>
                <option value="M">Marié(e)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sexe</label>
              <select value={form.sexe} onChange={(e) => setForm({...form, sexe: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Sélectionner</option>
                <option value="H">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date naissance</label>
              <input type="date" value={form.date_naissance} onChange={(e) => setForm({...form, date_naissance: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date adhésion</label>
              <input type="date" value={form.date_adhesion} onChange={(e) => setForm({...form, date_adhesion: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
            <input type="text" value={form.adresse} onChange={(e) => setForm({...form, adresse: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="text" value={form.telephone} onChange={(e) => setForm({...form, telephone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
              <select value={form.statut} onChange={(e) => setForm({...form, statut: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );

  const ViewModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Détails adhérent</h3>
          <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div className="p-5 space-y-3">
          {[
            ['Matricule', selected?.matricule], ['Nom', selected?.nom], ['Prénom', selected?.prenom],
            ['État civil', selected?.etat_civil], ['Sexe', selected?.sexe],
            ['Date naissance', selected?.date_naissance], ['Date adhésion', selected?.date_adhesion],
            ['Adresse', selected?.adresse], ['CIN', selected?.cin], ['Téléphone', selected?.telephone],
            ['Statut', selected?.statut],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="text-gray-900 font-medium">{value || '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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
        <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
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
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adherents.map((a) => (
                <tr key={a.id_adherent} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.matricule}</td>
                  <td className="px-4 py-3 text-gray-700">{a.nom}</td>
                  <td className="px-4 py-3 text-gray-700">{a.prenom}</td>
                  <td className="px-4 py-3 text-gray-500">{a.cin || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.telephone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${a.statut === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{a.statut}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal('view', a)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Voir">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button onClick={() => navigate(`/adherents/${a.id_adherent}`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Dossier">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </button>
                      <button onClick={() => openModal('edit', a)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Modifier">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(a.id_adherent)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && adherents.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Aucun adhérent trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">Page {meta.current_page} sur {meta.last_page}</span>
            <div className="flex gap-2">
              <button disabled={meta.current_page <= 1} onClick={() => fetchAdherents(meta.current_page - 1)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition">Précédent</button>
              <button disabled={meta.current_page >= meta.last_page} onClick={() => fetchAdherents(meta.current_page + 1)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition">Suivant</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'view' && <ViewModal />}
      {(modal === 'add' || modal === 'edit') && <FormModal />}
    </div>
  );
}

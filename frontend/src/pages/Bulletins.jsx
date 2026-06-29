import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Bulletins() {
  const [bulletins, setBulletins] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [etatFilter, setEtatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [adherents, setAdherents] = useState([]);
  const [form, setForm] = useState({ id_adherent: '', numero_bulletin: '', date_soin: '', montant_depense: '', type_soin: '', description: '', etat: 'En attente' });
  const [notification, setNotification] = useState(null);

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

  useEffect(() => { fetchBulletins(); fetchAdherents(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchBulletins(), 300);
    return () => clearTimeout(timer);
  }, [search, etatFilter]);

  const openModal = (type, bulletin = null) => {
    if (type === 'edit' && bulletin) {
      setSelected(bulletin);
      setForm({ ...bulletin, date_soin: bulletin.date_soin || '' });
    } else {
      setSelected(null);
      setForm({ id_adherent: '', numero_bulletin: '', date_soin: '', montant_depense: '', type_soin: '', description: '', etat: 'En attente' });
    }
    setModal(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await api.post('/bulletins', form);
        showNotif('Bulletin créé avec succès.');
      } else {
        await api.put(`/bulletins/${selected.id_bulletin}`, form);
        showNotif('Bulletin modifié avec succès.');
      }
      setModal(null);
      fetchBulletins(meta.current_page);
    } catch (err) {
      showNotif(err.response?.data?.message || 'Erreur lors de la sauvegarde.', 'error');
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

  const handleValider = async (id) => {
    try {
      await api.post(`/bulletins/${id}/valider`);
      showNotif('Bulletin validé.');
      fetchBulletins(meta.current_page);
    } catch (err) {
      showNotif('Erreur lors de la validation.', 'error');
    }
  };

  const handleRejeter = async (id) => {
    const motif = window.prompt('Motif du rejet :');
    if (motif === null) return;
    try {
      await api.post(`/bulletins/${id}/rejeter`, { motif });
      showNotif('Bulletin rejeté.');
      fetchBulletins(meta.current_page);
    } catch (err) {
      showNotif('Erreur lors du rejet.', 'error');
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

  const FormModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{modal === 'add' ? 'Nouveau bulletin' : 'Modifier bulletin'}</h3>
          <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Adhérent</label>
            <select value={form.id_adherent} onChange={(e) => setForm({...form, id_adherent: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Sélectionner un adhérent</option>
              {adherents.map((a) => (
                <option key={a.id_adherent} value={a.id_adherent}>{a.nom} {a.prenom} ({a.matricule})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Numéro bulletin</label>
              <input type="number" value={form.numero_bulletin} onChange={(e) => setForm({...form, numero_bulletin: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date soin</label>
              <input type="date" value={form.date_soin} onChange={(e) => setForm({...form, date_soin: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Montant</label>
              <input type="number" step="0.01" value={form.montant_depense} onChange={(e) => setForm({...form, montant_depense: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type de soin</label>
              <input type="text" value={form.type_soin} onChange={(e) => setForm({...form, type_soin: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );

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
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date soin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Montant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">État</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bulletins.map((b) => (
                <tr key={b.id_bulletin} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.numero_bulletin}</td>
                  <td className="px-4 py-3 text-gray-700">{b.adherent?.nom} {b.adherent?.prenom}</td>
                  <td className="px-4 py-3 text-gray-500">{b.date_soin || '-'}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{Number(b.montant_depense || 0).toLocaleString('fr-TN')} DT</td>
                  <td className="px-4 py-3 text-gray-500">{b.type_soin || '-'}</td>
                  <td className="px-4 py-3"><span className={etatBadge(b.etat)}>{b.etat}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openModal('edit', b)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Modifier">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      {b.etat === 'En attente' && (
                        <>
                          <button onClick={() => handleValider(b.id_bulletin)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Valider">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button onClick={() => handleRejeter(b.id_bulletin)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Rejeter">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDelete(b.id_bulletin)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && bulletins.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Aucun bulletin trouvé</td></tr>
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

      {(modal === 'add' || modal === 'edit') && <FormModal />}
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Bordereaux() {
  const [bordereaux, setBordereaux] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [bulletins, setBulletins] = useState([]);
  const [form, setForm] = useState({ id_bulletin: '', numero_bordereau: '', date_envoi: '', statut: 'En attente', commentaire: '' });
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchBordereaux = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/bordereaux', { params: { page, per_page: 15 } });
      if (res.data.success) {
        setBordereaux(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBulletins = async () => {
    try {
      const res = await api.get('/bulletins', { params: { per_page: 500 } });
      if (res.data.success) setBulletins(res.data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchBordereaux(); fetchBulletins(); }, []);

  const openModal = (type, bordereau = null) => {
    if (type === 'edit' && bordereau) {
      setSelected(bordereau);
      setForm({ ...bordereau, date_envoi: bordereau.date_envoi || '' });
    } else {
      setSelected(null);
      setForm({ id_bulletin: '', numero_bordereau: '', date_envoi: '', statut: 'En attente', commentaire: '' });
    }
    setModal(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await api.post('/bordereaux', form);
        showNotif('Bordereau créé avec succès.');
      } else {
        await api.put(`/bordereaux/${selected.id_bordereau}`, form);
        showNotif('Bordereau modifié avec succès.');
      }
      setModal(null);
      fetchBordereaux(meta.current_page);
    } catch (err) {
      showNotif(err.response?.data?.message || 'Erreur lors de la sauvegarde.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(`/bordereaux/${id}`);
      showNotif('Bordereau supprimé avec succès.');
      fetchBordereaux();
    } catch (err) {
      showNotif('Erreur lors de la suppression.', 'error');
    }
  };

  const FormModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{modal === 'add' ? 'Nouveau bordereau' : 'Modifier bordereau'}</h3>
          <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bulletin de soin</label>
            <select value={form.id_bulletin} onChange={(e) => setForm({...form, id_bulletin: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Sélectionner un bulletin</option>
              {bulletins.filter(b => !bordereaux.find(br => br.id_bulletin === b.id_bulletin) || b.id_bulletin === selected?.id_bulletin).map((b) => (
                <option key={b.id_bulletin} value={b.id_bulletin}>N°{b.numero_bulletin} - {b.adherent?.nom} {b.adherent?.prenom}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Numéro bordereau</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.numero_bordereau} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setForm({...form, numero_bordereau: val}); }} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex : 12345" />
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
            <textarea value={form.commentaire} onChange={(e) => setForm({...form, commentaire: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Votre commentaire..." />
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
          <h1 className="text-xl font-semibold text-gray-900">Bordereaux</h1>
          <p className="text-sm text-gray-500 mt-1">{meta.total} bordereaux</p>
        </div>
        <button onClick={() => openModal('add')} className="px-4 py-2 bg-[#0F2942] text-white rounded-lg text-sm font-medium hover:bg-[#1A3A5C] transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nouveau bordereau
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">N° Bordereau</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Bulletin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Adhérent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date envoi</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bordereaux.map((b) => (
                <tr key={b.id_bordereau} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.numero_bordereau}</td>
                  <td className="px-4 py-3 text-gray-700">N°{b.bulletin_soin?.numero_bulletin || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{b.bulletin_soin?.adherent?.nom} {b.bulletin_soin?.adherent?.prenom}</td>
                  <td className="px-4 py-3 text-gray-500">{b.date_envoi || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      b.statut === 'Traité' ? 'bg-emerald-50 text-emerald-700' :
                      b.statut === 'Envoyé' ? 'bg-blue-50 text-blue-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>{b.statut || 'En attente'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal('edit', b)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Modifier">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(b.id_bordereau)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && bordereaux.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Aucun bordereau trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">Page {meta.current_page} sur {meta.last_page}</span>
            <div className="flex gap-2">
              <button disabled={meta.current_page <= 1} onClick={() => fetchBordereaux(meta.current_page - 1)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50">Précédent</button>
              <button disabled={meta.current_page >= meta.last_page} onClick={() => fetchBordereaux(meta.current_page + 1)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50">Suivant</button>
            </div>
          </div>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && <FormModal />}
    </div>
  );
}

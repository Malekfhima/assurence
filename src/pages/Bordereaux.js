import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { fetchApi, postApi, putApi, deleteApi } from '../apiService';
import Modal from '../components/Modal';

const emptyBordereau = () => ({
  id_bulletin: '',
  numero_bordereau: '',
  date_envoi: '',
  statut: 'En attente',
  commentaire: '',
});

const Bordereaux = () => {
  const [bordereaux, setBordereaux] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyBordereau());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bordereauxRes, bulletinsRes] = await Promise.all([
        fetchApi('/bordereaux'),
        fetchApi('/bulletins'),
      ]);
      if (bordereauxRes && bordereauxRes.success) {
        setBordereaux(bordereauxRes.data);
      }
      if (bulletinsRes && bulletinsRes.success) {
        setBulletins(bulletinsRes.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = bordereaux.filter(b => {
    const q = search.toLowerCase();
    const adherentName = b.bulletin?.adherent
      ? `${b.bulletin.adherent.nom} ${b.bulletin.adherent.prenom}`.toLowerCase()
      : '';
    return (
      String(b.numero_bordereau).includes(q) ||
      adherentName.includes(q) ||
      (b.statut || '').toLowerCase().includes(q) ||
      String(b.bulletin?.numero_bulletin || '').includes(q)
    );
  });

  const usedBulletinIds = new Set(
    bordereaux
      .filter(b => b.id_bordereau !== editingId)
      .map(b => b.id_bulletin)
  );

  const availableBulletins = bulletins.filter(
    b => !usedBulletinIds.has(b.id_bulletin) || (editingId && form.id_bulletin === String(b.id_bulletin))
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyBordereau());
    setError('');
    setModalOpen(true);
  };

  const openEdit = (bordereau) => {
    setEditingId(bordereau.id_bordereau);
    setForm({
      id_bulletin: bordereau.id_bulletin || '',
      numero_bordereau: bordereau.numero_bordereau || '',
      date_envoi: bordereau.date_envoi || '',
      statut: bordereau.statut || 'En attente',
      commentaire: bordereau.commentaire || '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (bordereau) => {
    if (!window.confirm(`Supprimer le bordereau #${bordereau.numero_bordereau} ?`)) return;
    const response = await deleteApi(`/bordereaux/${bordereau.id_bordereau}`);
    if (response && response.success) {
      loadData();
    } else {
      alert(response?.message || 'Erreur lors de la suppression.');
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      ...form,
      id_bulletin: Number(form.id_bulletin),
      numero_bordereau: Number(form.numero_bordereau),
    };

    const response = editingId
      ? await putApi(`/bordereaux/${editingId}`, payload)
      : await postApi('/bordereaux', payload);

    setSaving(false);

    if (response && response.success) {
      setModalOpen(false);
      loadData();
    } else {
      setError(response?.message || 'Erreur lors de l\'enregistrement.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bordereaux d'Envoi</h1>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={20} />
          Créer un Bordereau
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Rechercher un bordereau..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Chargement...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>N° Bordereau</th>
                  <th>Bulletin</th>
                  <th>Adhérent</th>
                  <th>Date d'Envoi</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Aucun bordereau trouvé.</td></tr>
                ) : filtered.map((b) => (
                  <tr key={b.id_bordereau}>
                    <td><strong>#{b.numero_bordereau}</strong></td>
                    <td>#{b.bulletin?.numero_bulletin || '—'}</td>
                    <td>
                      {b.bulletin?.adherent
                        ? `${b.bulletin.adherent.nom} ${b.bulletin.adherent.prenom} (#${b.bulletin.adherent.matricule})`
                        : '—'}
                    </td>
                    <td>{b.date_envoi || '—'}</td>
                    <td>
                      <span className={`status-badge ${
                        b.statut === 'Envoyé' ? 'success' : 'warning'
                      }`}>
                        {b.statut}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn" title="Modifier" onClick={() => openEdit(b)}>
                        <Edit2 size={18} />
                      </button>
                      <button className="action-btn" title="Supprimer" style={{ color: '#ef4444' }} onClick={() => handleDelete(b)}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <Modal title={editingId ? 'Modifier le bordereau' : 'Nouveau bordereau d\'envoi'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Bulletin de soin *</label>
                <select value={form.id_bulletin} onChange={(e) => handleChange('id_bulletin', e.target.value)} required>
                  <option value="">Sélectionner un bulletin</option>
                  {availableBulletins.map(b => (
                    <option key={b.id_bulletin} value={b.id_bulletin}>
                      Bulletin #{b.numero_bulletin} — {b.adherent ? `${b.adherent.nom} ${b.adherent.prenom}` : 'Inconnu'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>N° Bordereau *</label>
                <input type="number" value={form.numero_bordereau} onChange={(e) => handleChange('numero_bordereau', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Date d'envoi</label>
                <input type="date" value={form.date_envoi} onChange={(e) => handleChange('date_envoi', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select value={form.statut} onChange={(e) => handleChange('statut', e.target.value)}>
                  <option value="En attente">En attente</option>
                  <option value="Envoyé">Envoyé</option>
                  <option value="Reçu">Reçu</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Commentaire</label>
                <textarea rows="3" value={form.commentaire} onChange={(e) => handleChange('commentaire', e.target.value)} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Enregistrement...' : (editingId ? 'Modifier' : 'Créer')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Bordereaux;

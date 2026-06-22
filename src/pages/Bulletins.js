import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { fetchApi, postApi, putApi, deleteApi } from '../apiService';
import Modal from '../components/Modal';

const emptyBulletin = () => ({
  id_adherent: '',
  numero_bulletin: '',
  numero_bordereau: '',
  date_soin: '',
  montant_depense: '',
  type_soin: '',
  description: '',
  etat: 'En attente',
});

const Bulletins = () => {
  const [bulletins, setBulletins] = useState([]);
  const [adherents, setAdherents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyBulletin());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bulletinsRes, adherentsRes] = await Promise.all([
        fetchApi('/bulletins'),
        fetchApi('/adherents'),
      ]);
      if (bulletinsRes && bulletinsRes.success) {
        setBulletins(bulletinsRes.data);
      }
      if (adherentsRes && adherentsRes.success) {
        setAdherents(adherentsRes.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = bulletins.filter(b => {
    const q = search.toLowerCase();
    const adherentName = b.adherent ? `${b.adherent.nom} ${b.adherent.prenom}`.toLowerCase() : '';
    return (
      String(b.numero_bulletin).includes(q) ||
      adherentName.includes(q) ||
      String(b.adherent?.matricule || '').includes(q) ||
      (b.etat || '').toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyBulletin());
    setError('');
    setModalOpen(true);
  };

  const openEdit = (bulletin) => {
    setEditingId(bulletin.id_bulletin);
    setForm({
      id_adherent: bulletin.id_adherent || '',
      numero_bulletin: bulletin.numero_bulletin || '',
      numero_bordereau: bulletin.numero_bordereau || '',
      date_soin: bulletin.date_soin || '',
      montant_depense: bulletin.montant_depense || '',
      type_soin: bulletin.type_soin || '',
      description: bulletin.description || '',
      etat: bulletin.etat || 'En attente',
    });
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (bulletin) => {
    if (!window.confirm(`Supprimer le bulletin #${bulletin.numero_bulletin} ?`)) return;
    const response = await deleteApi(`/bulletins/${bulletin.id_bulletin}`);
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
      id_adherent: Number(form.id_adherent),
      numero_bulletin: Number(form.numero_bulletin),
      numero_bordereau: form.numero_bordereau ? Number(form.numero_bordereau) : 0,
      montant_depense: form.montant_depense ? Number(form.montant_depense) : null,
    };

    const response = editingId
      ? await putApi(`/bulletins/${editingId}`, payload)
      : await postApi('/bulletins', payload);

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
        <h1 className="page-title">Bulletins de Soins</h1>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={20} />
          Nouveau Bulletin
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Rechercher un bulletin..."
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
                  <th>N° Bulletin</th>
                  <th>Adhérent (Matricule)</th>
                  <th>Date Soin</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th>État</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Aucun bulletin trouvé.</td></tr>
                ) : filtered.map((b) => (
                  <tr key={b.id_bulletin}>
                    <td><strong>#{b.numero_bulletin}</strong></td>
                    <td>
                      {b.adherent ? `${b.adherent.nom} ${b.adherent.prenom}` : 'Inconnu'}
                      {' '}({b.adherent ? b.adherent.matricule : 'N/A'})
                    </td>
                    <td>{b.date_soin || '—'}</td>
                    <td>{b.type_soin || '—'}</td>
                    <td>{b.montant_depense ? `${b.montant_depense} DT` : '—'}</td>
                    <td>
                      <span className={`status-badge ${
                        b.etat === 'Traité' ? 'success' :
                        b.etat === 'En attente' ? 'warning' : 'danger'
                      }`}>
                        {b.etat}
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
        <Modal title={editingId ? 'Modifier le bulletin' : 'Nouveau bulletin de soin'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Adhérent *</label>
                <select value={form.id_adherent} onChange={(e) => handleChange('id_adherent', e.target.value)} required>
                  <option value="">Sélectionner un adhérent</option>
                  {adherents.map(a => (
                    <option key={a.id_adherent} value={a.id_adherent}>
                      #{a.matricule} — {a.nom} {a.prenom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>N° Bulletin *</label>
                <input type="number" value={form.numero_bulletin} onChange={(e) => handleChange('numero_bulletin', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>N° Bordereau</label>
                <input type="number" value={form.numero_bordereau} onChange={(e) => handleChange('numero_bordereau', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Date de soin</label>
                <input type="date" value={form.date_soin} onChange={(e) => handleChange('date_soin', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Montant (DT)</label>
                <input type="number" step="0.01" value={form.montant_depense} onChange={(e) => handleChange('montant_depense', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Type de soin</label>
                <input type="text" value={form.type_soin} onChange={(e) => handleChange('type_soin', e.target.value)} placeholder="Consultation, Pharmacie..." />
              </div>
              <div className="form-group">
                <label>État</label>
                <select value={form.etat} onChange={(e) => handleChange('etat', e.target.value)}>
                  <option value="En attente">En attente</option>
                  <option value="Traité">Traité</option>
                  <option value="Rejeté">Rejeté</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea rows="3" value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
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

export default Bulletins;

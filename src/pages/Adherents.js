import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, User, Users } from 'lucide-react';
import { fetchApi, postApi, putApi, deleteApi } from '../apiService';
import Modal from '../components/Modal';

const ITEMS_PER_PAGE = 15;

const today = () => new Date().toISOString().split('T')[0];

const LIENS_PARENTE = ['Conjoint', 'Enfant'];

const emptyAdherent = () => ({
  matricule: '',
  nom: '',
  prenom: '',
  etat_civil: '',
  sexe: '',
  date_naissance: '',
  date_adhesion: today(),
  adresse: '',
  cin: '',
  telephone: '',
  statut: 'Actif',
  sous_adherents: [],
});

const emptySousAdherent = () => ({
  nom: '',
  prenom: '',
  date_naissance: '',
  sexe: '',
  lien_parente: '',
});

const isEtatCivilCelibataire = (etatCivil) => {
  if (!etatCivil) return false;
  const v = String(etatCivil).trim();
  return v === 'C' || /^c[eé]libataire$/i.test(v);
};

const Adherents = () => {
  const [adherents, setAdherents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyAdherent());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [sousAdherentsMap, setSousAdherentsMap] = useState({});

  useEffect(() => {
    loadAdherents();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const results = adherents.filter(a =>
      String(a.matricule).includes(q) ||
      (a.nom || '').toLowerCase().includes(q) ||
      (a.prenom || '').toLowerCase().includes(q) ||
      String(a.cin || '').includes(q) ||
      (a.telephone || '').includes(q)
    );
    setFiltered(results);
    setPage(1);
  }, [search, adherents]);

  const loadAdherents = async () => {
    try {
      setLoading(true);
      const response = await fetchApi('/adherents');
      if (response && response.success) {
        setAdherents(response.data);
        setFiltered(response.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des adhérents', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSousAdherents = async (id) => {
    if (sousAdherentsMap[id]) {
      setExpandedId(expandedId === id ? null : id);
      return;
    }
    const response = await fetchApi(`/adherents/${id}`);
    if (response && response.success) {
      setSousAdherentsMap(prev => ({ ...prev, [id]: response.data.sous_adherents || [] }));
      setExpandedId(id);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyAdherent());
    setError('');
    setModalOpen(true);
  };

  const openEdit = async (adherent) => {
    setError('');
    setSaving(true);
    const response = await fetchApi(`/adherents/${adherent.id_adherent}`);
    setSaving(false);
    if (response && response.success) {
      const data = response.data;
      setEditingId(data.id_adherent);
      const sousAdherents = isEtatCivilCelibataire(data.etat_civil)
        ? []
        : (data.sous_adherents || []).map(s => ({
            nom: s.nom || '',
            prenom: s.prenom || '',
            date_naissance: s.date_naissance || '',
            sexe: s.sexe || '',
            lien_parente: s.lien_parente || '',
          }));
      setForm({
        matricule: data.matricule || '',
        nom: data.nom || '',
        prenom: data.prenom || '',
        etat_civil: data.etat_civil || '',
        sexe: data.sexe || '',
        date_naissance: data.date_naissance || '',
        date_adhesion: data.date_adhesion || '',
        adresse: data.adresse || '',
        cin: data.cin || '',
        telephone: data.telephone || '',
        statut: data.statut || 'Actif',
        sous_adherents: sousAdherents,
      });
      setModalOpen(true);
    }
  };

  const handleDelete = async (adherent) => {
    if (!window.confirm(`Supprimer l'adhérent ${adherent.nom} ${adherent.prenom} ?`)) return;
    const response = await deleteApi(`/adherents/${adherent.id_adherent}`);
    if (response && response.success) {
      loadAdherents();
    } else {
      alert(response?.message || 'Erreur lors de la suppression.');
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'etat_civil' && isEtatCivilCelibataire(value)) {
        next.sous_adherents = [];
      }
      return next;
    });
  };

  const sousAdherentsDisabled = isEtatCivilCelibataire(form.etat_civil);

  const addSousAdherent = () => {
    setForm(prev => ({
      ...prev,
      sous_adherents: [...prev.sous_adherents, emptySousAdherent()],
    }));
  };

  const updateSousAdherent = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.sous_adherents];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, sous_adherents: updated };
    });
  };

  const removeSousAdherent = (index) => {
    setForm(prev => ({
      ...prev,
      sous_adherents: prev.sous_adherents.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isEtatCivilCelibataire(form.etat_civil) && form.sous_adherents.length > 0) {
      for (let i = 0; i < form.sous_adherents.length; i++) {
        const s = form.sous_adherents[i];
        if (!s.nom?.trim() || !s.prenom?.trim() || !s.date_naissance || !s.sexe || !s.lien_parente) {
          setError(`Sous-adhérent ${i + 1} : nom, prénom, date de naissance, sexe et lien de parenté sont obligatoires.`);
          return;
        }
      }
    }

    setSaving(true);

    const payload = {
      ...form,
      matricule: Number(form.matricule),
      cin: Number(form.cin),
      date_adhesion: editingId ? form.date_adhesion : today(),
      sous_adherents: isEtatCivilCelibataire(form.etat_civil) ? [] : form.sous_adherents,
    };

    const response = editingId
      ? await putApi(`/adherents/${editingId}`, payload)
      : await postApi('/adherents', payload);

    setSaving(false);

    if (response && response.success) {
      setModalOpen(false);
      loadAdherents();
      if (editingId) {
        setSousAdherentsMap(prev => {
          const copy = { ...prev };
          delete copy[editingId];
          return copy;
        });
      }
    } else {
      setError(response?.message || 'Erreur lors de l\'enregistrement.');
    }
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getStatutClass = (statut) => {
    if (!statut || statut.trim() === '') return 'warning';
    return statut.toLowerCase() === 'actif' ? 'success' : 'danger';
  };

  const getStatutLabel = (statut) => {
    if (!statut || statut.trim() === '') return 'Non défini';
    return statut;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Adhérents</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.95rem' }}>
            {filtered.length} adhérent(s) trouvé(s)
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Ajouter un Adhérent
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', minWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, CIN, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            Page {page} / {totalPages || 1}
          </span>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
              Chargement des adhérents...
            </div>
          ) : paginated.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <User size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p>Aucun adhérent trouvé.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom &amp; Prénom</th>
                  <th>CIN</th>
                  <th>Téléphone</th>
                  <th>État Civil</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((adherent) => (
                  <React.Fragment key={adherent.id_adherent}>
                    <tr>
                      <td><strong style={{ color: '#2563eb' }}>#{adherent.matricule}</strong></td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{adherent.nom} {adherent.prenom}</div>
                        {adherent.adresse && (
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {adherent.adresse}
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{adherent.cin || '—'}</td>
                      <td>{adherent.telephone || '—'}</td>
                      <td>{adherent.etat_civil || '—'}</td>
                      <td>
                        <span className={`status-badge ${getStatutClass(adherent.statut)}`}>
                          {getStatutLabel(adherent.statut)}
                        </span>
                      </td>
                      <td>
                        <button className="action-btn" title="Sous-adhérents" onClick={() => loadSousAdherents(adherent.id_adherent)}>
                          <Users size={16} />
                        </button>
                        <button className="action-btn" title="Modifier" onClick={() => openEdit(adherent)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn" title="Supprimer" style={{ color: '#ef4444' }} onClick={() => handleDelete(adherent)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {expandedId === adherent.id_adherent && (
                      <tr>
                        <td colSpan="7" style={{ background: '#f8fafc', padding: '12px 16px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                            Sous-adhérents ({(sousAdherentsMap[adherent.id_adherent] || []).length})
                          </div>
                          {(sousAdherentsMap[adherent.id_adherent] || []).length === 0 ? (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Aucun sous-adhérent enregistré.</span>
                          ) : (
                            <table style={{ width: '100%', fontSize: '0.85rem' }}>
                              <thead>
                                <tr>
                                  <th>Nom</th>
                                  <th>Prénom</th>
                                  <th>Date naissance</th>
                                  <th>Sexe</th>
                                  <th>Lien parenté</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sousAdherentsMap[adherent.id_adherent].map(s => (
                                  <tr key={s.id_sous_adherent}>
                                    <td>{s.nom}</td>
                                    <td>{s.prenom}</td>
                                    <td>{s.date_naissance || '—'}</td>
                                    <td>{s.sexe || '—'}</td>
                                    <td>{s.lien_parente || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: page === 1 ? '#f8fafc' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  style={{ width: '36px', height: '36px', borderRadius: '6px', border: '1px solid', borderColor: page === pageNum ? '#2563eb' : '#e2e8f0', background: page === pageNum ? '#2563eb' : 'white', color: page === pageNum ? 'white' : '#475569', cursor: 'pointer', fontWeight: page === pageNum ? '600' : '400' }}>
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: page === totalPages ? '#f8fafc' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editingId ? 'Modifier l\'adhérent' : 'Nouvel adhérent'}
          onClose={() => setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label>Matricule *</label>
                <input type="number" value={form.matricule} onChange={(e) => handleChange('matricule', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Statut *</label>
                <select value={form.statut} onChange={(e) => handleChange('statut', e.target.value)} required>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input type="text" value={form.nom} onChange={(e) => handleChange('nom', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Prénom *</label>
                <input type="text" value={form.prenom} onChange={(e) => handleChange('prenom', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>CIN *</label>
                <input type="number" value={form.cin} onChange={(e) => handleChange('cin', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Téléphone *</label>
                <input type="text" value={form.telephone} onChange={(e) => handleChange('telephone', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>État civil *</label>
                <select value={form.etat_civil} onChange={(e) => handleChange('etat_civil', e.target.value)} required>
                  <option value="" disabled>Sélectionner...</option>
                  <option value="C">Célibataire (C)</option>
                  <option value="M">Marié(e) (M)</option>
                  <option value="D">Divorcé(e) (D)</option>
                  <option value="V">Veuf(ve) (V)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sexe *</label>
                <select value={form.sexe} onChange={(e) => handleChange('sexe', e.target.value)} required>
                  <option value="" disabled>Sélectionner...</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date de naissance *</label>
                <input type="date" value={form.date_naissance} onChange={(e) => handleChange('date_naissance', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Date d'adhésion</label>
                <input
                  type="date"
                  value={editingId ? (form.date_adhesion || '') : today()}
                  onChange={(e) => handleChange('date_adhesion', e.target.value)}
                  readOnly={!editingId}
                  style={!editingId ? { background: '#f8fafc', color: '#64748b' } : undefined}
                />
              </div>
              <div className="form-group full-width">
                <label>Adresse *</label>
                <input type="text" value={form.adresse} onChange={(e) => handleChange('adresse', e.target.value)} required />
              </div>
            </div>

            <div className="sub-section">
              <div className="sub-section-header">
                <h3>Sous-adhérents (ayants droit)</h3>
                <button
                  type="button"
                  className="btn-add-row"
                  onClick={addSousAdherent}
                  disabled={sousAdherentsDisabled}
                  title={sousAdherentsDisabled ? 'Non applicable pour un adhérent célibataire' : 'Ajouter un sous-adhérent'}
                >
                  + Ajouter
                </button>
              </div>
              {sousAdherentsDisabled && (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 12px' }}>
                  Les sous-adhérents ne sont pas applicables pour un adhérent célibataire.
                </p>
              )}
              {form.sous_adherents.map((sub, index) => (
                <div key={index} className="sub-row">
                  <input placeholder="Nom *" value={sub.nom} onChange={(e) => updateSousAdherent(index, 'nom', e.target.value)} />
                  <input placeholder="Prénom *" value={sub.prenom} onChange={(e) => updateSousAdherent(index, 'prenom', e.target.value)} />
                  <input type="date" value={sub.date_naissance} onChange={(e) => updateSousAdherent(index, 'date_naissance', e.target.value)} />
                  <select value={sub.sexe} onChange={(e) => updateSousAdherent(index, 'sexe', e.target.value)}>
                    <option value="">Sexe</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                  <input placeholder="Lien parenté" value={sub.lien_parente} onChange={(e) => updateSousAdherent(index, 'lien_parente', e.target.value)} />
                  <button type="button" className="btn-remove-row" onClick={() => removeSousAdherent(index)} title="Retirer">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Adherents;

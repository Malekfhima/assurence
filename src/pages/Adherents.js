import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { fetchApi } from '../apiService';

const ITEMS_PER_PAGE = 15;

const Adherents = () => {
  const [adherents, setAdherents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

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
    } catch (error) {
      console.error("Erreur lors du chargement des adhérents", error);
    } finally {
      setLoading(false);
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
        <button className="btn-primary">
          <Plus size={18} />
          Ajouter un Adhérent
        </button>
      </div>

      <div className="card">
        {/* Barre de recherche */}
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

        {/* Tableau */}
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
                  <th>Étal Civil</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((adherent) => (
                  <tr key={adherent.id_adherent}>
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
                      <button className="action-btn" title="Modifier"><Edit2 size={16} /></button>
                      <button className="action-btn" title="Supprimer" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Adherents;

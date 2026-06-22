import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { fetchApi } from '../apiService';

const Bulletins = () => {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBulletins();
  }, []);

  const loadBulletins = async () => {
    try {
      setLoading(true);
      const response = await fetchApi('/bulletins');
      if (response && response.data) {
        setBulletins(response.data);
      } else if (Array.isArray(response)) {
        setBulletins(response);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des bulletins", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bulletins des Soins</h1>
        <button className="btn-primary">
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
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>N° Bulletin</th>
                <th>Adhérent (Matricule)</th>
                <th>Date Soin</th>
                <th>Montant Dépense</th>
                <th>État</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bulletins.map((b) => (
                <tr key={b.id_bulletin}>
                  <td><strong>#{b.numero_bulletin}</strong></td>
                  <td>{b.adherent ? `${b.adherent.nom} ${b.adherent.prenom}` : 'Inconnu'} ({b.adherent ? b.adherent.matricule : 'N/A'})</td>
                  <td>{b.date_soin}</td>
                  <td>{b.montant_depense} DT</td>
                  <td>
                    <span className={`status-badge ${
                      b.etat === 'Traité' ? 'success' : 
                      b.etat === 'En attente' ? 'warning' : 'danger'
                    }`}>
                      {b.etat}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn" title="Modifier"><Edit2 size={18} /></button>
                    <button className="action-btn" title="Supprimer" style={{color: '#ef4444'}}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Bulletins;

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download } from 'lucide-react';
import { fetchApi } from '../apiService';

const Bordereaux = () => {
  const [bordereaux, setBordereaux] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBordereaux();
  }, []);

  const loadBordereaux = async () => {
    try {
      setLoading(true);
      const response = await fetchApi('/bordereaux');
      if (response && response.data) {
        setBordereaux(response.data);
      } else if (Array.isArray(response)) {
        setBordereaux(response);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des bordereaux", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bordereaux d'Envoi</h1>
        <button className="btn-primary">
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
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>N° Bordereau</th>
                <th>Date d'Envoi</th>
                <th>Nbr Bulletins</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bordereaux.map((b) => (
                <tr key={b.id_bordereau}>
                  <td><strong>#{b.numero_bordereau}</strong></td>
                  <td>{b.date_envoi || '-'}</td>
                  <td>1 bulletin(s)</td>
                  <td>
                    <span className={`status-badge ${
                      b.statut === 'Envoyé' ? 'success' : 'warning'
                    }`}>
                      {b.statut}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn" title="Télécharger PDF"><Download size={18} /></button>
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

export default Bordereaux;

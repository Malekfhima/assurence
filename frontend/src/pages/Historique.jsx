import { useState, useEffect } from 'react';
import api from '../services/api';

const etatBadge = (etat) => {
  const styles = {
    'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
    'Validé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Rejeté': 'bg-red-50 text-red-700 border-red-200',
    'Sous contrôle': 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return `inline-flex px-2 py-1 rounded-full text-xs font-medium border ${styles[etat] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

function PdfPreviewModal({ bulletin, onClose }) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bulletin?.id_bulletin) return;
    let blobUrl = null;
    setLoading(true);
    setError('');

    const fetchPdf = async () => {
      try {
        const response = await api.get(`/bulletins/${bulletin.id_bulletin}/pdf`, {
          responseType: 'blob',
        });
        blobUrl = URL.createObjectURL(response.data);
        setPdfUrl(blobUrl);
      } catch (err) {
        setError('Impossible de charger le PDF.');
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [bulletin?.id_bulletin]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-900">Bulletin n°{bulletin?.numero_bulletin}</h3>
            <span className="text-xs text-gray-400">— {bulletin?.adherent?.nom} {bulletin?.adherent?.prenom}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const response = await api.get(`/bulletins/${bulletin.id_bulletin}/pdf`, {
                    params: { download: '1' },
                    responseType: 'blob',
                  });
                  const blob = response.data;
                  const blobUrl = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = `bulletin_${bulletin.numero_bulletin}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                } catch (err) {
                  console.error('Erreur téléchargement PDF:', err);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0F2942] hover:bg-[#1A3A5C] rounded-lg transition"
              title="Télécharger le PDF"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-gray-100 flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">Chargement du PDF...</span>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center gap-2 text-red-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}
          {pdfUrl && (
            <iframe src={pdfUrl} className="w-full h-full min-h-[65vh]" title={`Bulletin n°${bulletin.numero_bulletin}`} />
          )}
        </div>
      </div>
    </div>
  );
}

function BulletinDetailView({ bulletin, onBack }) {
  const totalMontant = (bulletin.details || []).reduce((sum, d) => sum + Number(d.montant || 0), 0);
  const totalRembourse = (bulletin.details || []).reduce((sum, d) => sum + Number(d.montant_rembourse || 0), 0);
  const showRembourse = true;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux réclamations
      </button>

      {/* Bulletin header */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              bulletin.etat === 'Validé' ? 'bg-emerald-500' :
              bulletin.etat === 'Rejeté' ? 'bg-red-500' :
              bulletin.etat === 'Sous contrôle' ? 'bg-purple-500' : 'bg-amber-500'
            }`}></div>
            <h4 className="text-base font-semibold text-gray-900">Bulletin N°{bulletin.numero_bulletin}</h4>
            <span className={etatBadge(bulletin.etat)}>{bulletin.etat || 'En attente'}</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              {Number(bulletin.montant_depense || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Adhérent</p>
            <p className="text-gray-800 font-medium mt-0.5">{bulletin.adherent?.nom} {bulletin.adherent?.prenom}</p>
            {bulletin.adherent?.matricule && <p className="text-xs text-gray-400">Matricule: {bulletin.adherent.matricule}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Bénéficiaire</p>
            <p className="text-gray-800 mt-0.5">
              {bulletin.sous_adherent ? `${bulletin.sous_adherent.prenom} ${bulletin.sous_adherent.nom}` : "L'adhérent"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date du soin</p>
            <p className="text-gray-800 mt-0.5">{bulletin.date_soin || bulletin.details?.[0]?.date || '-'}</p>
          </div>
        </div>

        {/* Bordereau info */}
        {bulletin.bordereau && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Bordereau associé</p>
            <p className="text-sm text-gray-800 mt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200">
                N°{bulletin.bordereau.numero_bordereau}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Details table */}
      <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Détails des soins</h5>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Date</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Type de soin</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Frais</th>
              {showRembourse && (
                <th className="text-right px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Remboursé</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(bulletin.details || []).length === 0 ? (
              <tr>
                <td colSpan={showRembourse ? 4 : 3} className="text-center py-6 text-gray-400 text-xs">Aucun détail de soin.</td>
              </tr>
            ) : (
              bulletin.details.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-700">{d.date || '-'}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{d.type_soin || '-'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{Number(d.montant || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
                  {showRembourse && (
                    <td className="px-4 py-2.5 text-right">
                      {d.montant_rembourse !== null && d.montant_rembourse !== undefined ? (
                        <span className="font-medium text-emerald-600">{Number(d.montant_rembourse).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {(bulletin.details || []).length > 0 && (
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 text-right text-xs font-semibold text-gray-700">Total</td>
                <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-900">{totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
                {showRembourse && (
                  <td className="px-4 py-2.5 text-right text-sm font-bold text-emerald-600">{totalRembourse.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export default function Historique() {
  const [bulletins, setBulletins] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [search, setSearch] = useState('');
  const [etatFilter, setEtatFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        per_page: 100,
      };

      // Build etat filter: if a specific state is selected, show only that;
      // otherwise show both 'En attente' and 'Sous contrôle'
      if (etatFilter) {
        params.etat = etatFilter;
      } else {
        params.etat = ['En attente', 'Sous contrôle'];
      }

      if (search.trim()) params.search = search.trim();

      const res = await api.get('/bulletins', { params });
      if (res.data.success) {
        setBulletins(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (err) {
      console.error('Erreur chargement réclamations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [etatFilter, search]);

  const handleEtatClick = (etat) => {
    // Toggle: if already selected, deselect (show all)
    setEtatFilter(prev => prev === etat ? '' : etat);
  };

  const stats = {
    en_attente: bulletins.filter(b => b.etat === 'En attente').length,
    sous_controle: bulletins.filter(b => b.etat === 'Sous contrôle').length,
    total: bulletins.length,
    montant_total: bulletins.reduce((sum, b) => sum + Number(b.montant_depense || 0), 0),
  };

  if (selectedBulletin) {
    return (
      <div className="space-y-4">
        <BulletinDetailView
          bulletin={selectedBulletin}
          onBack={() => setSelectedBulletin(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Réclamations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bulletins en attente de traitement · <span className="font-medium">{meta.total} bulletin(s)</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status filter tags */}
          <button
            onClick={() => handleEtatClick('En attente')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
              etatFilter === 'En attente'
                ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-200 shadow-sm'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:shadow-sm'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              En attente
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                etatFilter === 'En attente' ? 'bg-amber-200' : 'bg-amber-100'
              }`}>{stats.en_attente}</span>
            </span>
          </button>
          <button
            onClick={() => handleEtatClick('Sous contrôle')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
              etatFilter === 'Sous contrôle'
                ? 'bg-purple-100 text-purple-800 border-purple-300 ring-2 ring-purple-200 shadow-sm'
                : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:shadow-sm'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Sous contrôle
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                etatFilter === 'Sous contrôle' ? 'bg-purple-200' : 'bg-purple-100'
              }`}>{stats.sous_controle}</span>
            </span>
          </button>
          {/* Separator */}
          <span className="text-gray-300 text-sm">|</span>
          {/* Search by matricule */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par matricule..."
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-56"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      {bulletins.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total réclamations</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">En attente</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{stats.en_attente}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Sous contrôle</p>
            <p className="text-xl font-bold text-purple-600 mt-1">{stats.sous_controle}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Montant total</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{stats.montant_total.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</p>
          </div>
        </div>
      )}

      {/* Bulletins table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">N° Bulletin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Adhérent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Matricule</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Bénéficiaire</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">État</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Montant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Bordereau</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs uppercase">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <svg className="animate-spin w-6 h-6 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </td>
                </tr>
              ) : bulletins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">Aucune réclamation en attente.</p>
                  </td>
                </tr>
              ) : (
                bulletins.map((b) => (
                  <tr
                    key={b.id_bulletin}
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setSelectedBulletin(b)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{b.numero_bulletin}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {b.adherent?.nom} {b.adherent?.prenom}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="font-mono text-xs">{b.adherent?.matricule || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {b.sous_adherent ? `${b.sous_adherent.nom} ${b.sous_adherent.prenom}` : "L'adhérent"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={etatBadge(b.etat)}>{b.etat}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      {Number(b.montant_depense || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{b.date_soin || '-'}</td>
                    <td className="px-4 py-3">
                      {b.bordereau ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200">
                          N°{b.bordereau.numero_bordereau}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Non affecté</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {b.pdf_path ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPdfPreview(b); }}
                          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                          title="Aperçu du PDF"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Aperçu
                        </button>
                      ) : (
                        <span className="text-gray-300">
                          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pdfPreview && (
        <PdfPreviewModal
          bulletin={pdfPreview}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </div>
  );
}

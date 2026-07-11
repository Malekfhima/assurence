import { useState, useEffect } from 'react';
import api from '../services/api';

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

const statutBordereauBadge = (statut) => {
  const styles = {
    'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
    'Envoyé': 'bg-blue-50 text-blue-700 border-blue-200',
    'Traité': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return `inline-flex px-2 py-1 rounded-full text-xs font-medium border ${styles[statut] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

function ReponsePdfPreviewModal({ idBordereau, titre, onClose }) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!idBordereau) return;
    let blobUrl = null;
    setLoading(true);
    setError('');

    const fetchPdf = async () => {
      try {
        const response = await api.get(`/bordereaux/${idBordereau}/reponse-pdf`, {
          responseType: 'blob',
        });
        blobUrl = URL.createObjectURL(response.data);
        setPdfUrl(blobUrl);
      } catch (err) {
        setError('Impossible de charger le PDF r\u00e9ponse.');
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [idBordereau]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-900">{titre || 'PDF R\u00e9ponse'}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const response = await api.get(`/bordereaux/${idBordereau}/reponse-pdf`, {
                    responseType: 'blob',
                  });
                  const blob = response.data;
                  const blobUrl = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = `reponse_bordereau_${idBordereau}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                } catch (err) {
                  console.error('Erreur t\u00e9l\u00e9chargement PDF:', err);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0F2942] hover:bg-[#1A3A5C] rounded-lg transition"
              title="T\u00e9l\u00e9charger le PDF"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              T\u00e9l\u00e9charger
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
            <iframe
              src={pdfUrl}
              className="w-full h-full min-h-[65vh]"
              title={titre || 'PDF R\u00e9ponse'}
              onLoad={() => setLoading(false)}
              onError={() => { setError('Impossible de charger le PDF.'); setLoading(false); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const etatBulletinBadge = (etat) => {
  const styles = {
    'Validé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Rejeté': 'bg-red-50 text-red-700 border-red-200',
    'Sous contrôle': 'bg-purple-50 text-purple-700 border-purple-200',
    'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return `inline-flex px-2 py-1 rounded-full text-xs font-medium border ${styles[etat] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
};

const getMontantAffiche = (bulletin) => {
  const etat = bulletin.etat || 'En attente';
  if (etat === 'Rejeté' || etat === 'Sous contrôle') return 0;
  // Validé → montant remboursé extrait du PDF réponse STIP (si disponible)
  if (etat === 'Validé' && bulletin.montant_rembourse !== null && bulletin.montant_rembourse !== undefined) {
    return Number(bulletin.montant_rembourse);
  }
  // En attente → montant réel (montant_depense)
  return Number(bulletin.montant_depense || 0);
};

function BordereauDetailView({ bordereau, onBack }) {
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [reponsePdfPreview, setReponsePdfPreview] = useState(null);
  const bulletins = bordereau.bulletinSoins || bordereau.bulletin_soins || [];
  const stats = bordereau.stats_bulletins || { en_attente: 0, valide: 0, rejete: 0, sous_controle: 0, total: 0, montant_rembourse: 0 };

  if (selectedBulletin) {
    const totalMontant = (selectedBulletin.details || []).reduce((sum, d) => sum + Number(d.montant || 0), 0);
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedBulletin(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0F2942]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#0F2942]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Détail du bulletin N°{selectedBulletin.numero_bulletin}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Bordereau N°{bordereau.numero_bordereau}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBulletin(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">&times;</button>
            </div>

            {/* Contenu du bulletin */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* En-tête bulletin */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedBulletin.etat === 'Validé' ? 'bg-emerald-500' :
                      selectedBulletin.etat === 'Rejeté' ? 'bg-red-500' :
                      selectedBulletin.etat === 'Sous contrôle' ? 'bg-purple-500' : 'bg-amber-500'
                    }`}></div>
                    <h4 className="text-base font-semibold text-gray-900">Bulletin N°{selectedBulletin.numero_bulletin}</h4>
                    <span className={etatBulletinBadge(selectedBulletin.etat)}>{selectedBulletin.etat || 'En attente'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedBulletin.pdf_path && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPdfPreview(selectedBulletin); }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Aperçu
                      </button>
                    )}
                    <p className={`text-lg font-bold ${getMontantAffiche(selectedBulletin) === 0 && selectedBulletin.etat !== 'En attente' ? 'text-gray-400' : 'text-gray-900'}`}>{getMontantAffiche(selectedBulletin).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Adhérent</p>
                    <p className="text-gray-800 font-medium mt-0.5">{selectedBulletin.adherent?.nom} {selectedBulletin.adherent?.prenom}</p>
                    {selectedBulletin.adherent?.matricule && <p className="text-xs text-gray-400">Mat: {selectedBulletin.adherent.matricule}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Bénéficiaire</p>
                    <p className="text-gray-800 mt-0.5">
                      {selectedBulletin.sous_adherent ? `${selectedBulletin.sous_adherent.prenom} ${selectedBulletin.sous_adherent.nom}` : "L'adhérent"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date du soin</p>
                    <p className="text-gray-800 mt-0.5">{selectedBulletin.date_soin || selectedBulletin.details?.[0]?.date || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Détails des soins */}
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Détails des soins</h5>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Date</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Type de soin</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedBulletin.details || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-gray-400 text-xs">Aucun détail de soin.</td>
                      </tr>
                    ) : (
                      selectedBulletin.details.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-700">{d.date || '-'}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{d.type_soin || '-'}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{Number(d.montant || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {(selectedBulletin.details || []).length > 0 && (
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={2} className="px-4 py-2.5 text-right text-xs font-semibold text-gray-700">Total</td>
                        <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-900">{totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end flex-shrink-0 bg-gray-50/50">
              <button onClick={() => setSelectedBulletin(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition">
                Retour
              </button>
            </div>
          </div>
        </div>

        {pdfPreview && (
          <PdfPreviewModal
            bulletin={pdfPreview}
            onClose={() => setPdfPreview(null)}
          />
        )}
      </>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
      </div>

      {/* Bordereau info */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bordereau N°{bordereau.numero_bordereau}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={statutBordereauBadge(bordereau.statut)}>{bordereau.statut}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{stats.total} bulletin(s)</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500 font-medium">{Number(bordereau.montant_total || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            {bordereau.date_envoi && <p>Date envoi : {bordereau.date_envoi}</p>}
            {bordereau.date_reponse && <p>Date réponse : {bordereau.date_reponse}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 text-sm flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-gray-600">Validés</span>
            <span className="font-semibold text-emerald-700">{stats.valide}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-gray-600">Rejetés</span>
            <span className="font-semibold text-red-700">{stats.rejete}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span className="text-gray-600">Sous contrôle</span>
            <span className="font-semibold text-purple-700">{stats.sous_controle || 0}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-gray-600">En attente</span>
            <span className="font-semibold text-amber-700">{stats.en_attente}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-600">Montant remboursé</span>
            <span className="font-semibold text-emerald-700">{Number(stats.montant_rembourse || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</span>
          </span>
        </div>
      </div>

      {/* Bulletins list - cliquable */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Bulletins du bordereau</h3>
      <div className="space-y-2">
        {bulletins.map((bs) => (
          <div
            key={bs.id_bulletin}
            onClick={() => setSelectedBulletin(bs)}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/30 transition cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-2.5 h-2.5 rounded-full ${
                bs.etat === 'Validé' ? 'bg-emerald-500' :
                bs.etat === 'Rejeté' ? 'bg-red-500' :
                bs.etat === 'Sous contrôle' ? 'bg-purple-500' : 'bg-amber-500'
              }`}></div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">N°{bs.numero_bulletin}</span>
                  <span className={etatBulletinBadge(bs.etat)}>{bs.etat || 'En attente'}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {bs.adherent?.nom} {bs.adherent?.prenom}
                  {bs.adherent?.matricule && <span> · Mat: {bs.adherent.matricule}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bs.pdf_path && (
                <button
                  onClick={(e) => { e.stopPropagation(); setPdfPreview(bs); }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  title="Aperçu du PDF"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
              <div className="text-right">
                <p className={`text-sm font-semibold ${getMontantAffiche(bs) === 0 && bs.etat !== 'En attente' ? 'text-gray-400' : 'text-gray-900'}`}>{getMontantAffiche(bs).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</p>
                {bs.details && bs.details.length > 0 && (
                  <p className="text-xs text-gray-400">{bs.details.length} détail(s)</p>
                )}
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
        {bulletins.length === 0 && (
          <p className="text-center py-6 text-gray-400 text-sm">Aucun bulletin associé.</p>
        )}
      </div>

      {/* Voir PDF réponse */}
      {bordereau.fichier_reponse && (
        <div className="mt-5">
          <button
            onClick={() => setReponsePdfPreview(bordereau.id_bordereau)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Voir PDF réponse
          </button>
        </div>
      )}

      {/* Commentaire */}
      {bordereau.commentaire && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Commentaire :</p>
          <p className="text-sm text-gray-700">{bordereau.commentaire}</p>
        </div>
      )}

      {reponsePdfPreview && (
        <ReponsePdfPreviewModal
          idBordereau={reponsePdfPreview}
          titre={`PDF Réponse - Bordereau N°${bordereau.numero_bordereau}`}
          onClose={() => setReponsePdfPreview(null)}
        />
      )}
    </div>
  );
}

export default function Historique() {
  const [bordereaux, setBordereaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMois, setSelectedMois] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedBordereau, setSelectedBordereau] = useState(null);
  const [tablePdfPreview, setTablePdfPreview] = useState(null);

  const annee = selectedMois ? selectedMois.split('-')[0] : '';
  const mois = selectedMois ? selectedMois.split('-')[1] : '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { per_page: 200 };
      if (annee) params.annee = annee;
      if (mois) params.mois = mois;

      const res = await api.get('/bordereaux', { params });
      if (res.data.success) {
        // Afficher dans l'Historique uniquement les bordereaux
        // dont la date d'envoi date de plus d'un an
        const ilYaUnAn = new Date();
        ilYaUnAn.setFullYear(ilYaUnAn.getFullYear() - 1);
        setBordereaux(res.data.data.filter(b => {
          if (b.date_envoi) {
            const dateEnvoi = new Date(b.date_envoi);
            return dateEnvoi < ilYaUnAn;
          }
          return false;
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedMois]);

  // Stats globales
  const stats = {
    total: bordereaux.length,
    valides: bordereaux.reduce((sum, b) => sum + ((b.stats_bulletins?.valide || 0)), 0),
    rejetes: bordereaux.reduce((sum, b) => sum + ((b.stats_bulletins?.rejete || 0)), 0),
    sous_controle: bordereaux.reduce((sum, b) => sum + ((b.stats_bulletins?.sous_controle || 0)), 0),
    // Montant remboursé : utilise le montant_rembourse stocké (Total Bordereau du PDF réponse)
    // ou fallback sur la somme des bulletins validés
    montant_rembourse: bordereaux.reduce((sum, b) => {
      return sum + (b.stats_bulletins?.montant_rembourse || 0);
    }, 0),
  };

  if (selectedBordereau) {
    return (
      <div className="space-y-4">
        <BordereauDetailView
          bordereau={selectedBordereau}
          onBack={() => setSelectedBordereau(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Historique</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bordereaux archivés - <span className="font-medium">{stats.total} bordereau(x)</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Calendrier : sélecteur de mois */}
          <div className="relative">
            <input
              type="month"
              value={selectedMois}
              onChange={(e) => setSelectedMois(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white pr-10"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Cartes statistiques mensuelles */}
      {bordereaux.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Bordereaux</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Validés</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{stats.valides}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Rejetés</p>
            <p className="text-xl font-bold text-red-600 mt-1">{stats.rejetes}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Sous contrôle</p>
            <p className="text-xl font-bold text-purple-600 mt-1">{stats.sous_controle}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Montant remboursé</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{stats.montant_rembourse.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</p>
          </div>
        </div>
      )}

      {/* Liste des bordereaux traités */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">N° Bordereau</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Validés</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Rejetés</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Sous contrôle</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">En attente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Montant total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Montant remboursé</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date envoi</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Date réponse</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-10">
                    <svg className="animate-spin w-6 h-6 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </td>
                </tr>
              ) : bordereaux.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">Aucun bordereau traité pour cette période.</p>
                  </td>
                </tr>
              ) : (
                bordereaux.map((b) => {
                  const s = b.stats_bulletins || { en_attente: 0, valide: 0, rejete: 0, sous_controle: 0, total: 0 };
                  return (
                    <tr
                      key={b.id_bordereau}
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => setSelectedBordereau(b)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{b.numero_bordereau}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">{s.valide}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">{s.rejete}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{s.sous_controle || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">{s.en_attente}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">{Number(b.montant_total || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">
                        {b.statut === 'Traité'
                          ? Number(b.montant_rembourse || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT'
                          : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{b.date_envoi || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{b.date_reponse || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={statutBordereauBadge(b.statut)}>{b.statut}</span>
                        {b.fichier_reponse && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[10px] font-bold uppercase tracking-wider">PDF</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedBordereau(b); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Voir détails"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {b.fichier_reponse && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setTablePdfPreview(b.id_bordereau); }}
                              className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Voir le PDF réponse"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {tablePdfPreview && (
        <ReponsePdfPreviewModal
          idBordereau={tablePdfPreview}
          titre="PDF Réponse"
          onClose={() => setTablePdfPreview(null)}
        />
      )}
    </div>
  );
}

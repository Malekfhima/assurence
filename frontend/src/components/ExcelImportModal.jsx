import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';

const COLUMN_MAPPING = [
  { key: 'matricule', label: 'Matricule adhérent', required: true, hint: 'Colonne MATRICULE' },
  { key: 'numero_bulletin', label: 'N° Bulletin', required: true, hint: 'Colonne N° BULLETIN' },
  { key: 'montant', label: 'Dépenses (DT)', required: true, hint: 'Colonne DEPENSES EN DT' },
  { key: 'type_soin', label: 'Type de soin', required: true, hint: 'Colonne SOINS PRATIQUES' },
  { key: 'date', label: 'Date de soin', required: false, hint: 'Colonne DATE DE SOINS' },
  { key: 'beneficiaire', label: 'Bénéficiaire / Prestataire', required: false, hint: 'Colonne PRESTATAIRE' },
  { key: 'adherent_nom', label: 'Nom adhérent', required: false, hint: 'Colonne ADHERENT (info seulement)' },
];

// Mapping automatique des types de soin (défini au niveau module pour être accessible par tous les composants)
const mapTypeSoin = (type) => {
  const t = (type || '').toString().toUpperCase().trim();
  if (t === 'LABO') return 'B';
  if (t === 'RADIO') return 'ERK';
  if (t === '' || t === '-' || t === '.' || t === 'VIDE' || t === 'N/A') return 'PH';
  return t;
};

// Mots-clés STIP pour détecter la ligne d'en-tête
const STIP_HEADER_KEYWORDS = [
  /n[iî°]?\s*bulletin/i,
  /matricule/i,
  /adherent/i,
  /prestataire/i,
  /date[\.\-]?\s*(de|des)?\s*soins?/i,
  /soins\s*pratiqu/i,
  /depenses/i,
];

export default function ExcelImportModal({ onClose, showNotif, fetchBulletins }) {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('upload'); // upload | preview | mapping | importing | done
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [headerRowIndex, setHeaderRowIndex] = useState(-1);
  const [mapping, setMapping] = useState({});
  const [groupedBulletins, setGroupedBulletins] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [editingBulletin, setEditingBulletin] = useState(null); // bulletin en cours d'édition

  // Formats heure Excel en date ISO (en locale, pas UTC)
  const excelSerialToDate = (serial) => {
    if (serial instanceof Date && !isNaN(serial)) {
      // Utiliser les méthodes locales pour éviter le décalage UTC
      const y = serial.getFullYear();
      const m = String(serial.getMonth() + 1).padStart(2, '0');
      const d = String(serial.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof serial === 'number' && serial > 1) {
      // Les dates Excel sont des nombres sérialisés (1 = 1900-01-01).
      // Utiliser SSF.parse_date_code (timezone-safe, pas de décalage UTC).
      try {
        const date = XLSX.SSF.parse_date_code(serial);
        if (date && date.y && date.y > 1900 && date.y < 2100) {
          return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
      } catch (e) { /* fallback */ }
    }
    // Format déjà texte : essayer de parser
    if (typeof serial === 'string') {
      const trimmed = serial.trim();
      // ═══════════════════════════════════════════════════════════════
      // IMPORTANT: Toujours vérifier les formats ISO (aaaa-mm-jj)
      // AVANT les formats français (jj/mm/aaaa) pour éviter les
      // ambiguïtés (ex: "2026-06-01" ne doit pas être interprété
      // comme jj=20, mm=26, aaaa=01).
      // ═══════════════════════════════════════════════════════════════

      // 1. Format aaaa-mm-jj (ISO) déjà correct
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      // 2. Format aaaa/mm/jj ou aaaa mm jj
      const isoMatch = trimmed.match(/^(\d{4})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,2})$/);
      if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
      }

      // 3. Format jj/mm/aaaa ou jj-mm-aaaa ou jj.mm.aaaa (français)
      // Uniquement si ça ne commence PAS par 4 chiffres (pour éviter
      // de confondre avec ISO)
      if (!/^\d{4}/.test(trimmed)) {
        const dateMatch = trimmed.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{2,4})$/);
        if (dateMatch) {
          let dd = dateMatch[1].padStart(2, '0');
          let mm = dateMatch[2].padStart(2, '0');
          let yyyy = dateMatch[3];
          if (yyyy.length === 2) {
            yyyy = '20' + yyyy;
          }
          // Format jj/mm/aaaa (français) → aaaa-mm-jj
          return `${yyyy}-${mm}-${dd}`;
        }
      }
    }
    return String(serial ?? '').trim();
  };

  // Détecte la ligne d'en-tête dans le fichier
  const detectHeaderRow = (rows) => {
    let bestRow = -1;
    let bestScore = 0;

    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      let score = 0;
      const rowText = row.map(c => String(c).toLowerCase().trim()).join(' ');

      STIP_HEADER_KEYWORDS.forEach(re => {
        if (re.test(rowText)) score += 2;
      });

      // Plus de points si plusieurs colonnes sont trouvées
      const matchedCols = row.filter(c => {
        const t = String(c).toLowerCase().trim();
        return t.includes('bulletin') || t.includes('matricule') || t.includes('adherent') ||
               t.includes('prestataire') || t.includes('soins') || t.includes('depenses');
      }).length;

      if (matchedCols >= 3) score += matchedCols;

      if (score > bestScore) {
        bestScore = score;
        bestRow = i;
      }
    }

    return bestRow;
  };

  // Auto-detect mapping from headers
  // ATTENTION: l'ordre des `else if` est important ! 
  // Les regex plus spécifiques doivent passer AVANT les plus génériques.
  const detectMapping = useCallback((headers) => {
    const map = {};
    const lowerHeaders = headers.map(h => String(h).toLowerCase().trim());

    lowerHeaders.forEach((h, idx) => {
      // 1. MATRICULE (très spécifique)
      if (/matricule|matr[ic]*ule/.test(h)) {
        map.matricule = idx;
      }
      // 2. N° BULLETIN
      else if (/n[iî°#]?\s*\.?\s*bulletin|num[eé]ro.?bulletin/i.test(h)) {
        map.numero_bulletin = idx;
      }
      // 3. DATE DE SOINS (AVANT type_soin car 'date de soins' contient 'soin')
      // Note: 'soins?' permet de matcher autant 'date de soin' que 'date de soins' (pluriel)
      // Accepte: 'date de soins', 'date soins', 'date des soins', 'date soin'
      else if (/date\s*(de\s*soins?|d(es)?\s*soins?|soins?|d['']?acte)\b/i.test(h) && !(/naissance|adhesion|envoi/i.test(h))) {
        map.date = idx;
      }
      // 4. TYPE DE SOIN / SOINS PRATIQUES (après date pour éviter conflit avec 'date de soins')
      else if (/soins\s*pratiqu|type\s*d[eu]\s*soin|nature\s*d[eu]\s*soin|acte|prestation/i.test(h) && !/date/i.test(h)) {
        map.type_soin = idx;
      }
      // 5. MONTANT / DEPENSES
      else if (/depenses|d[eé]penses?|montant|frais|cout|co[uû]t|total/i.test(h)) {
        map.montant = idx;
      }
      // 6. PRESTATAIRE / BENEFICIAIRE
      else if (/prestataire|b[eé]n[eé]ficiaire|patient|assur[eé]/i.test(h)) {
        map.beneficiaire = idx;
      }
      // 7. NOM ADHERENT (fallback)
      else if (/adherent|nom|pr[eé]nom|prenom/i.test(h) && !map.matricule) {
        map.adherent_nom = idx;
      }
    });

    return map;
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      showNotif('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv.', 'error');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        // NOTE: cellDates: false (par défaut) car cellDates:true dans xlsx 0.18.x
        // provoque des décalages de date liés au fuseau horaire (timezone bug).
        // Les dates Excel (nombres sérialisés) sont parsées manuellement
        // via excelSerialToDate → XLSX.SSF.parse_date_code qui est timezone-safe.
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        if (allRows.length < 2) {
          showNotif('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données.', 'error');
          return;
        }

        // Détecter la ligne d'en-tête
        const headerIdx = detectHeaderRow(allRows);
        if (headerIdx === -1) {
          showNotif('Impossible de détecter la ligne d\'en-tête dans le fichier.', 'error');
          return;
        }

        setHeaderRowIndex(headerIdx);
        const rawHeaders = allRows[headerIdx].map(h => String(h).trim());
        // Lignes après l'en-tête, filtrer les vides
        const rows = allRows.slice(headerIdx + 1).filter(row =>
          row.some(cell => String(cell).trim() !== '')
        );

        setHeaders(rawHeaders);
        setRawData(rows);
        setPreviewRows(rows.slice(0, 15));

        // Auto-detect mapping
        const detected = detectMapping(rawHeaders);
        setMapping(detected);

        const requiredKeys = COLUMN_MAPPING.filter(c => c.required).map(c => c.key);
        const detectedRequired = requiredKeys.filter(k => detected[k] !== undefined);

        if (detectedRequired.length === requiredKeys.length) {
          // Regrouper par bulletin
          groupBulletins(rows, detected);
          setStep('preview');
        } else {
          setStep('mapping');
        }
      } catch (err) {
        console.error('Erreur parsing Excel:', err);
        showNotif('Erreur lors de la lecture du fichier Excel. Vérifiez le format.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Regroupe les lignes par N° Bulletin (une ligne = un détail de soin)
  const groupBulletins = (rows, map) => {
    const grouped = {};
    const getVal = (row, key) => {
      const idx = map[key];
      if (idx === undefined) return '';
      return String(row[idx] ?? '').trim();
    };
    const getMontant = (row) => {
      const idx = map.montant;
      if (idx === undefined) return 0;
      const val = String(row[idx] ?? '0').replace(',', '.').replace(/[^0-9.]/g, '');
      return parseFloat(val) || 0;
    };
    const getDate = (row) => {
      const idx = map.date;
      if (idx === undefined) return '';
      return excelSerialToDate(row[idx]);
    };

    const seenBulletins = new Set();

    rows.forEach((row, i) => {
      const numBulletin = getVal(row, 'numero_bulletin');
      const matricule = getVal(row, 'matricule');
      if (!numBulletin || !matricule) return;

      const montant = getMontant(row);
      if (montant <= 0) return;

      if (!grouped[numBulletin]) {
        grouped[numBulletin] = {
          numero_bulletin: numBulletin,
          matricule: matricule,
          beneficiaire: getVal(row, 'beneficiaire'),
          adherent_nom: getVal(row, 'adherent_nom'),
          date_soin: '',
          details: [],
        };
        seenBulletins.add(numBulletin);
      }

      grouped[numBulletin].details.push({
        date: getDate(row),
        montant: montant,
        type_soin: mapTypeSoin(getVal(row, 'type_soin')),
      });
    });

    // Calculer la date principale et le montant total
    Object.values(grouped).forEach(b => {
      if (b.details.length > 0) {
        b.date_soin = b.details[0].date || '';
        b.montant_total = b.details.reduce((sum, d) => sum + d.montant, 0);
      }
    });

    const bulletinsList = Object.values(grouped);
    setGroupedBulletins(bulletinsList);
    return bulletinsList;
  };

  const handleMappingChange = (field, headerIndex) => {
    setMapping(prev => {
      const updated = { ...prev };
      if (headerIndex === '' || headerIndex === null) {
        delete updated[field];
      } else {
        updated[field] = Number(headerIndex);
      }
      return updated;
    });
  };

  const validateAndProceed = () => {
    const requiredKeys = COLUMN_MAPPING.filter(c => c.required).map(c => c.key);
    const missingKeys = requiredKeys.filter(k => mapping[k] === undefined);

    if (missingKeys.length > 0) {
      const labels = missingKeys.map(k => COLUMN_MAPPING.find(c => c.key === k)?.label || k);
      showNotif(`Veuillez mapper les champs obligatoires : ${labels.join(', ')}`, 'error');
      return;
    }

    // Regrouper avec le nouveau mapping
    groupBulletins(rawData, mapping);
    setStep('preview');
  };

  const handleImport = async () => {
    setImporting(true);

    // Construire les bulletins avec leurs détails groupés (déjà mappés par groupBulletins)
    const bulletins = groupedBulletins.map(b => ({
      matricule: b.matricule,
      numero_bulletin: b.numero_bulletin,
      date: b.date_soin,
      montant: b.montant_total,
      type_soin: b.details[0]?.type_soin || '',
      _details: b.details,
    }));

    if (bulletins.length === 0) {
      showNotif('Aucune donnée valide trouvée dans le fichier.', 'error');
      setImporting(false);
      return;
    }

    try {
      const res = await api.post('/bulletins/import-excel', { bulletins });
      if (res.data.success) {
        setImportResult({
          ...res.data.data,
          total_bulletins: groupedBulletins.length,
          total_details: groupedBulletins.reduce((s, b) => s + b.details.length, 0),
        });
        setStep('done');
        fetchBulletins(1, '', '');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'import des bulletins.';
      showNotif(msg, 'error');
    } finally {
      setImporting(false);
    }
  };

  const getHeaderOptions = () => {
    return headers.map((h, i) => (
      <option key={i} value={i}>{h || `Colonne ${i + 1}`}</option>
    ));
  };

  const formatDateValue = (val) => {
    return excelSerialToDate(val);
  };

  const formatMontant = (val) => {
    const n = parseFloat(String(val || '0').replace(',', '.')) || 0;
    return n.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Importer des bulletins depuis Excel</h3>
              <p className="text-xs text-gray-500">
                {step === 'upload' && 'Sélectionnez un fichier Excel (.xlsx, .xls ou .csv)'}
                {step === 'mapping' && 'Associez les colonnes du fichier aux champs requis'}
                {step === 'preview' && `Aperçu — ${groupedBulletins.length} bulletin(s) trouvé(s) sur ${rawData.length} ligne(s)`}
                {step === 'done' && 'Résultat de l\'importation'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-lg border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition cursor-pointer group"
              >
                <svg className="w-14 h-14 mx-auto text-gray-400 group-hover:text-emerald-500 transition mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-base font-medium text-gray-700 group-hover:text-emerald-700 transition mb-1">
                  Cliquez pour sélectionner un fichier
                </p>
                <p className="text-sm text-gray-500">
                  Formats acceptés : <strong>.xlsx</strong>, .xls, .csv
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mt-8 w-full max-w-lg bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Format STIP détecté automatiquement
                </p>
                <div className="space-y-1 text-xs text-emerald-700">
                  <p>Le fichier est analysé pour trouver la ligne d'en-tête et les colonnes suivantes sont reconnues automatiquement :</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                    {COLUMN_MAPPING.filter(c => c.required).map(col => (
                      <div key={col.key} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                        <span className="font-medium">{col.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-emerald-600">Les lignes ayant le même N° Bulletin sont automatiquement regroupées en un seul bulletin avec plusieurs détails de soin.</p>
                </div>
              </div>

              {/* Bouton pour télécharger un modèle */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 mb-2">Vous n'avez pas de fichier ? Téléchargez le format type :</p>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg border border-gray-200">
                    N° BULLETIN | MATRICULE | SOINS PRATIQUES | DEPENSES EN DT
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Certaines colonnes n'ont pas été reconnues automatiquement. Veuillez associer manuellement les colonnes du fichier aux champs de l'application.
                </span>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase w-48">Champ</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase w-20">Requis</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Colonne du fichier</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase">Aperçu (1ère ligne)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {COLUMN_MAPPING.map(col => (
                      <tr key={col.key} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-gray-800">{col.label}</span>
                          <p className="text-[10px] text-gray-400 mt-0.5">{col.hint}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          {col.required
                            ? <span className="inline-flex px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">Obligatoire</span>
                            : <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Optionnel</span>
                          }
                        </td>
                        <td className="px-4 py-2.5">
                          <select
                            value={mapping[col.key] !== undefined ? mapping[col.key] : ''}
                            onChange={(e) => handleMappingChange(col.key, e.target.value)}
                            className="w-full max-w-xs px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="">— Non mappé —</option>
                            {getHeaderOptions()}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">
                          {mapping[col.key] !== undefined && rawData[0] !== undefined
                            ? String(rawData[0][mapping[col.key]] ?? '').substring(0, 50) || <span className="text-gray-300 italic">vide</span>
                            : <span className="text-gray-300 italic">-</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mini prévisualisation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-700 mb-2">Aperçu des lignes reconnues : {rawData.length} ligne(s)</p>
                <div className="overflow-x-auto max-h-32">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-blue-600">
                        <th className="px-2 py-1 font-medium">#</th>
                        {COLUMN_MAPPING.filter(c => mapping[c.key] !== undefined).map(c => (
                          <th key={c.key} className="px-2 py-1 font-medium">{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {rawData.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1 text-blue-400">{i + 1}</td>
                          {COLUMN_MAPPING.filter(c => mapping[c.key] !== undefined).map(c => (
                            <td key={c.key} className="px-2 py-1 text-blue-800 truncate max-w-[150px]">
                              {c.key === 'montant' ? formatMontant(row[mapping[c.key]]) :
                               c.key === 'date' ? formatDateValue(row[mapping[c.key]]) :
                               String(row[mapping[c.key]] ?? '').substring(0, 30)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
                  Changer de fichier
                </button>
                <button onClick={validateAndProceed} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                  Valider le mapping
                </button>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Bulletins</p>
                  <p className="text-lg font-bold text-gray-900">{groupedBulletins.length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Lignes de soins</p>
                  <p className="text-lg font-bold text-gray-900">{rawData.length}</p>
                  <p className="text-[10px] text-gray-400">détails individuels</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Montant total</p>
                  <p className="text-lg font-bold text-gray-900">
                    {groupedBulletins.reduce((s, b) => s + (b.montant_total || 0), 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Fichier</p>
                  <p className="text-xs font-medium text-gray-700 mt-1 truncate" title={file?.name}>{file?.name}</p>
                  <p className="text-[10px] text-gray-400">Ligne d'en-tête : ligne {headerRowIndex + 1}</p>
                </div>
              </div>

              {/* Info regroupement */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>
                  <strong>{groupedBulletins.length} bulletin(s)</strong> regroupé(s) à partir de <strong>{rawData.length} ligne(s)</strong> de soins.
                  Chaque ligne de soin ayant le même N° Bulletin devient un détail de soin du même bulletin.
                </span>
              </div>

              {/* Preview table with edit buttons - AFFICHE TOUS les bulletins */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ maxHeight: 'calc(100vh - 420px)' }}>
                <div className="overflow-y-auto" style={{ maxHeight: 'inherit' }}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="text-center px-2 py-2 font-medium text-gray-600 text-xs uppercase w-12">Action</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">N° Bulletin</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">Date soin</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">Matricule</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600 text-xs uppercase">Montant</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">Détails</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">Soins</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">Bénéficiaire</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groupedBulletins.map((b, i) => (
                      <tr key={i} className="hover:bg-gray-50 group">
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => setEditingBulletin({ ...b, _index: i })}
                            className="p-1.5 text-gray-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Modifier ce bulletin"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-800">{b.numero_bulletin}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{b.date_soin || '-'}</td>
                        <td className="px-3 py-2 text-gray-700">{b.matricule}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900">
                          {b.montant_total?.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {b.details.length} soin{b.details.length > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {[...new Set(b.details.map(d => d.type_soin))].map((type, ti) => (
                              <span key={ti} className="inline-flex px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">{type}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{b.beneficiaire || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setStep('mapping')} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
                  Modifier le mapping
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {importing && (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {importing ? 'Importation en cours...' : `Importer ${groupedBulletins.length} bulletin(s)`}
                </button>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && importResult && (
            <div className="space-y-5 py-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{importResult.imported}</p>
                  <p className="text-xs text-emerald-600 mt-1">Importé(s)</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-red-700">{importResult.failed}</p>
                  <p className="text-xs text-red-600 mt-1">Échec(s)</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{importResult.total}</p>
                  <p className="text-xs text-blue-600 mt-1">Total</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">{importResult.total_bulletins || importResult.total}</p>
                  <p className="text-xs text-purple-600 mt-1">Lignes import</p>
                </div>
              </div>

              {/* Errors */}
              {(importResult.errors?.length > 0) && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-2">Détail des erreurs :</p>
                  <div className="border border-red-200 rounded-lg divide-y divide-red-100 max-h-36 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="px-4 py-2 text-xs flex items-start gap-2 bg-red-50/50">
                        <span className="text-red-400 font-medium flex-shrink-0">Ligne {err.row}</span>
                        <span className="text-red-700">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success */}
              {(importResult.success?.length > 0) && (
                <div>
                  <p className="text-xs font-semibold text-emerald-700 mb-2">Bulletins créés :</p>
                  <div className="border border-emerald-200 rounded-lg divide-y divide-emerald-100 max-h-32 overflow-y-auto">
                    {importResult.success.map((s, i) => (
                      <div key={i} className="px-4 py-1.5 text-xs flex items-center gap-2">
                        <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">N°</span>
                        <span className="font-medium text-gray-800">{s.numero_bulletin}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button onClick={onClose} className="px-5 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition">
                  Terminer
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal d'édition d'un bulletin */}
      {editingBulletin && (
        <EditBulletinModal
          bulletin={editingBulletin}
          onSave={(updated) => {
            setGroupedBulletins(prev => {
              const copy = [...prev];
              const montant_total = updated.details.reduce((s, d) => s + (parseFloat(d.montant) || 0), 0);
              const date_soin = updated.details.length > 0 ? (updated.details[0].date || '') : '';
              copy[updated._index] = { ...updated, montant_total, date_soin };
              return copy;
            });
            setEditingBulletin(null);
            showNotif('Bulletin modifié avec succès.');
          }}
          onClose={() => setEditingBulletin(null)}
        />
      )}
    </div>
  );
}

// Sous-composant : modal d'édition d'un bulletin individuel
function EditBulletinModal({ bulletin, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    numero_bulletin: bulletin.numero_bulletin || '',
    matricule: bulletin.matricule || '',
    beneficiaire: bulletin.beneficiaire || '',
    details: bulletin.details.map(d => ({ ...d })),
  }));
  const [errors, setErrors] = useState({});

  const handleDetailChange = (idx, field, value) => {
    setForm(prev => {
      const details = [...prev.details];
      details[idx] = { ...details[idx], [field]: value };
      return { ...prev, details };
    });
    setErrors({});
  };

  const addDetail = () => {
    setForm(prev => ({
      ...prev,
      details: [...prev.details, { date: '', montant: '', type_soin: '' }],
    }));
  };

  const removeDetail = (idx) => {
    setForm(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== idx),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.numero_bulletin.trim()) errs.numero_bulletin = 'Le N° bulletin est requis.';
    if (!form.matricule.trim()) errs.matricule = 'Le matricule est requis.';
    const validDetails = form.details.filter(d => parseFloat(d.montant) > 0 && d.type_soin.trim());
    if (validDetails.length === 0) errs.details = 'Ajoutez au moins un détail de soin valide.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      ...bulletin,
      numero_bulletin: form.numero_bulletin.trim(),
      matricule: form.matricule.trim(),
      beneficiaire: form.beneficiaire.trim(),
      details: form.details
      .filter(d => parseFloat(d.montant) > 0 && d.type_soin.trim())
      .map(d => ({
        ...d,
        montant: parseFloat(String(d.montant).replace(',', '.')) || 0,
        type_soin: mapTypeSoin(d.type_soin),
      })),
    });
  };

  const totalMontant = form.details.reduce((s, d) => s + (parseFloat(String(d.montant).replace(',', '.')) || 0), 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Modifier le bulletin</h4>
              <p className="text-xs text-gray-500">N° {bulletin.numero_bulletin}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">N° Bulletin <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.numero_bulletin}
                onChange={(e) => { setForm(f => ({ ...f, numero_bulletin: e.target.value })); setErrors({}); }}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none ${errors.numero_bulletin ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.numero_bulletin && <p className="text-xs text-red-500 mt-1">{errors.numero_bulletin}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Matricule <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.matricule}
                onChange={(e) => { setForm(f => ({ ...f, matricule: e.target.value })); setErrors({}); }}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none ${errors.matricule ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.matricule && <p className="text-xs text-red-500 mt-1">{errors.matricule}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bénéficiaire</label>
            <input
              type="text"
              value={form.beneficiaire}
              onChange={(e) => setForm(f => ({ ...f, beneficiaire: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="Ex: LUI-MEME, AFEF/CONJOINT, ..."
            />
          </div>

          {/* Détails de soin */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">Détails des soins <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={addDetail}
                className="text-xs px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Ajouter
              </button>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">Montant</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase w-28">Type soin</th>
                    <th className="text-center px-2 py-2 font-medium text-gray-600 text-xs uppercase w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.details.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5">
                        <input
                          type="date"
                          value={d.date}
                          onChange={(e) => handleDetailChange(i, 'date', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={d.montant}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9.,]/g, '');
                            val = val.replace(',', '.');
                            handleDetailChange(i, 'montant', val);
                          }}
                          className="w-full max-w-[110px] px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-amber-500 outline-none text-right"
                          placeholder="0.000"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={d.type_soin}
                          onChange={(e) => handleDetailChange(i, 'type_soin', e.target.value.toUpperCase())}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-amber-500 outline-none uppercase"
                          placeholder="C1, PH..."
                          maxLength={20}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeDetail(i)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Supprimer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {form.details.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-400 text-xs">Aucun détail. Cliquez sur "Ajouter".</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Total</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                      {totalMontant.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {errors.details && <p className="text-xs text-red-500 mt-1">{errors.details}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
            Annuler
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
}

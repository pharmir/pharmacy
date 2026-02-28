
import React, { useState, useMemo, useEffect } from 'react';
import { Save, Printer, ArrowLeft, Calendar, Pill, CheckCircle, AlertCircle, Plus, Trash2, Edit, History, Search, FileText, FileDown, Layers, X, FolderOutput } from 'lucide-react';
import { InventoryExit, Medication, PharmacyInfo } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface SortieItem {
  id: string;
  drugName: string;
  quantity: number;
}

interface SortiesFormProps {
  existingExit?: InventoryExit | null;
  allSorties: InventoryExit[];
  medications: Medication[];
  pharmacyInfo: PharmacyInfo | null;
  onSave: (exits: InventoryExit[]) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

const SortiesForm: React.FC<SortiesFormProps> = ({ 
  existingExit, 
  allSorties, 
  medications, 
  pharmacyInfo,
  onSave, 
  onDelete, 
  onCancel 
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());
  const months = [
    "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
    "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"
  ];
  const reasons = ["VENTE", "PÉRIMÉ", "DON", "CASSE", "ERREUR INVENTAIRE", "AUTRE"];

  const [globalData, setGlobalData] = useState({
    year: existingExit?.year || currentYear.toString(),
    month: existingExit?.month || months[new Date().getMonth()],
    reason: existingExit?.reason || 'VENTE',
    date: existingExit?.date || new Date().toISOString().split('T')[0],
  });

  const [items, setItems] = useState<SortieItem[]>([]);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (existingExit) {
      setItems([{ id: existingExit.id, drugName: existingExit.drugName, quantity: existingExit.quantity }]);
      setGlobalData({
        year: existingExit.year,
        month: existingExit.month,
        reason: existingExit.reason,
        date: existingExit.date
      });
    } else {
      setItems([{ id: crypto.randomUUID(), drugName: '', quantity: 0 }]);
    }
  }, [existingExit]);

  const [historySearch, setHistorySearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    return allSorties
      .filter(s => 
        s.drugName.toLowerCase().includes(historySearch.toLowerCase()) ||
        s.reason.toLowerCase().includes(historySearch.toLowerCase())
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [allSorties, historySearch]);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), drugName: '', quantity: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItemToDeleteId(id);
    }
  };

  const confirmRemoveItem = () => {
    if (itemToDeleteId) {
      setItems(items.filter(item => item.id !== itemToDeleteId));
      setItemToDeleteId(null);
    }
  };

  const cancelRemoveItem = () => {
    setItemToDeleteId(null);
  };

  const updateItem = (index: number, field: keyof SortieItem, value: any) => {
    const newItems = [...items];
    const finalValue = (typeof value === 'string') ? value.toUpperCase() : value;
    newItems[index] = { ...newItems[index], [field]: finalValue };
    setItems(newItems);
  };

  const handleEditHistory = (exit: InventoryExit) => {
    setGlobalData({
      year: exit.year,
      month: exit.month,
      reason: exit.reason,
      date: exit.date
    });
    setItems([{ id: exit.id, drugName: exit.drugName, quantity: exit.quantity }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!globalData.reason.trim()) {
      setError("Le motif de sortie est obligatoire.");
      return;
    }

    const validItems = items.filter(item => item.drugName.trim() !== '' && item.quantity > 0);
    
    if (validItems.length === 0) {
      setError("Veuillez saisir au moins un médicament avec une quantité valide.");
      return;
    }

    const exits: InventoryExit[] = validItems.map(item => ({
      id: item.id,
      year: globalData.year,
      month: globalData.month,
      reason: globalData.reason.toUpperCase(),
      drugName: item.drugName.toUpperCase(),
      quantity: item.quantity,
      date: globalData.date,
      createdAt: existingExit?.createdAt || Date.now()
    }));

    setError(null);
    onSave(exits);
    setShowSuccess(true);
    
    if (!existingExit) {
      setItems([{ id: crypto.randomUUID(), drugName: '', quantity: 0 }]);
      setTimeout(() => setShowSuccess(false), 1500);
    } else {
      setTimeout(onCancel, 1500);
    }
  };

  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>BON DE SORTIE - ${globalData.reason}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4; margin: 0; }
          body { 
            font-family: "Times New Roman", Times, serif; 
            text-transform: uppercase; 
            background: white; 
            color: black; 
            margin: 0; 
            padding: 0; 
          }
          .header-box {
            height: 4cm;
            margin: 1cm 1cm 0 1cm;
            border: 1px solid black;
            border-radius: 8px;
            box-sizing: border-box;
            padding: 10px 25px;
            display: flex;
            flex-direction: column;
          }
          .pharmacy-name-header {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            flex: 1;
          }
          .details-group {
            font-size: 10pt;
            font-weight: bold;
            line-height: 1.1;
          }
          .left-group { text-align: left; }
          .right-group { 
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .right-inner {
            text-align: left;
            min-width: 150px;
          }
          .content-title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin-top: 0.5cm;
            margin-bottom: 0.3cm;
          }
          .info-line {
            margin: 0 1cm 0.3cm 1cm;
            font-size: 12pt;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
          }
          .table-container { margin: 0 1cm; }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 0;
            border: none;
          }
          th {
            padding: 0;
            border: none;
            text-align: center;
          }
          .th-inner {
            background-color: #e5e7eb;
            border-radius: 8px;
            padding: 6px 4px;
            margin: 0 0.5mm;
            display: block;
            font-weight: bold;
            font-size: 9pt;
            color: black;
          }
          td {
            border: 1px solid #e5e7eb;
            padding: 6px 10px;
            text-align: left;
            font-size: 9pt;
            font-weight: bold;
          }
          .col-num { width: 60px; text-align: center; }
          .col-med { width: 70%; }
          .col-qty { width: calc(30% - 60px); text-align: center; }
          
          .separator-container {
            margin: 5px 1cm 0 1cm;
          }
          .gray-line-rounded {
            height: 1mm;
            background-color: #e5e7eb;
            width: 100%;
            border-radius: 6px;
          }
          .summary-container {
            margin: 10px 1cm 0 1cm;
            display: flex;
            align-items: center;
            font-weight: bold;
            font-size: 10pt;
          }
          .footer {
            margin-top: 1cm;
            display: flex;
            flex-direction: column;
            align-items: center;
            font-style: italic;
            font-size: 9pt;
            font-weight: bold;
          }
          .footer-date {
            align-self: flex-start;
            margin-left: 1cm;
            font-size: 8pt;
            font-style: italic;
            font-weight: bold;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="pharmacy-name-header">PHARMACIE ${pharmacyInfo?.name || 'NOM DE LA PHARMACIE'}</div>
          <div class="details-grid">
            <div class="details-group left-group">
              <div>ADRESSE: ${pharmacyInfo?.address || ''}</div>
              <div>N° ORDRE: ${pharmacyInfo?.nOrdre || ''}</div>
              <div>AGRÉMENT: ${pharmacyInfo?.agreement || ''}</div>
            </div>
            <div class="details-group right-group">
              <div class="right-inner">
                <div>NIF: ${pharmacyInfo?.nif || ''}</div>
                <div>NIS: ${pharmacyInfo?.nis || ''}</div>
                <div>TEL: ${pharmacyInfo?.tel || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="content-title">BON DE SORTIE PSYCHOTROPES</div>

        <div class="info-line">
          <div>PÉRIODE: ${globalData.month} ${globalData.year}</div>
          <div>DATE: ${formatDisplayDate(globalData.date)}</div>
        </div>
        <div class="info-line">
           <div>MOTIF: ${globalData.reason}</div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N°</span></th>
                <th class="col-med"><span class="th-inner">MEDICAMENT</span></th>
                <th class="col-qty"><span class="th-inner">QUANTITE</span></th>
              </tr>
            </thead>
            <tbody>
              ${items.filter(i => i.drugName).map((item, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-med">${item.drugName}</td>
                  <td class="col-qty">${item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="separator-container">
          <div class="gray-line-rounded"></div>
        </div>

        <div class="summary-container">
          <div class="count-box">${items.filter(i => i.drugName).length}</div>
          <div style="margin-left: 10px;">PRODUIT(S) SORTI(S)</div>
        </div>

        <div class="signature-section">
          <div class="sig-box">
            <div>LE PHARMACIEN</div>
            <div style="font-size: 10pt; margin-top: 5mm;">(Cachet et Signature)</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintReport = (mode: 'p1' | 'p2' | 'both') => {
    const filtered = allSorties.filter(s => s.date >= reportStartDate && s.date <= reportEndDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (filtered.length === 0) {
      alert("Aucune donnée trouvée pour cette période.");
      return;
    }

    const aggregatedMap = new Map<string, number>();
    filtered.forEach(s => {
      const name = s.drugName.toUpperCase();
      aggregatedMap.set(name, (aggregatedMap.get(name) || 0) + s.quantity);
    });
    const summaryList = Array.from(aggregatedMap.entries()).map(([drugName, totalQuantity]) => ({ drugName, totalQuantity }));

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const commonStyles = `
      @page { size: A4 landscape; margin: 0; }
      body { 
        font-family: "Times New Roman", Times, serif; 
        text-transform: uppercase; 
        background: white; 
        color: black; 
        margin: 0; 
        padding: 0; 
      }
      .page { 
        width: 100%;
        height: 100%;
        page-break-after: always;
        padding-bottom: 1cm;
      }
      .page:last-child { page-break-after: avoid; }
      .header-box {
        height: 4cm;
        margin: 1cm 1cm 0 1cm;
        border: 1px solid black;
        border-radius: 8px;
        box-sizing: border-box;
        padding: 10px 25px;
        display: flex;
        flex-direction: column;
      }
      .pharmacy-name-header {
        text-align: center;
        font-size: 16pt;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        width: 100%;
        flex: 1;
      }
      .details-group {
        font-size: 10pt;
        font-weight: bold;
        line-height: 1.1;
      }
      .left-group { text-align: left; }
      .right-group { 
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .right-inner {
        text-align: left;
        min-width: 150px;
      }
      .content-title {
        text-align: center;
        font-size: 16pt;
        font-weight: bold;
        margin-top: 0.5cm;
        margin-bottom: 0.3cm;
      }
      .info-line {
        margin: 0 1cm 0.3cm 1cm;
        font-size: 16pt;
        font-weight: bold;
        text-align: center;
      }
      .table-container { margin: 0 1cm; }
      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0 0;
        border: none;
      }
      th {
        padding: 0;
        border: none;
        text-align: center;
      }
      .th-inner {
        background-color: #e5e7eb;
        border-radius: 8px;
        padding: 6px 4px;
        margin: 0 0.5mm;
        display: block;
        font-weight: bold;
        font-size: 9pt;
        color: black;
      }
      td {
        border: 1px solid #e5e7eb;
        padding: 6px 10px;
        text-align: left;
        font-size: 9pt;
        font-weight: bold;
      }
      .separator-container {
        margin: 5px 1cm 0 1cm;
      }
      .gray-line-rounded {
        height: 1mm;
        background-color: #e5e7eb;
        width: 100%;
        border-radius: 6px;
      }
      .summary-container {
        margin: 10px 1cm 0 1cm;
        display: flex;
        align-items: center;
        font-weight: bold;
        font-size: 10pt;
      }
      .footer {
        margin-top: 1cm;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-style: italic;
        font-size: 9pt;
        font-weight: bold;
      }
      .footer-date {
        align-self: flex-start;
        margin-left: 1cm;
        font-size: 8pt;
        font-style: italic;
        font-weight: bold;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; }
      }
    `;

    const page1Html = `
      <div class="page">
        <div class="header-box">
          <div class="pharmacy-name-header">PHARMACIE ${pharmacyInfo?.name || 'NOM DE LA PHARMACIE'}</div>
          <div class="details-grid">
            <div class="details-group left-group">
              <div>ADRESSE: ${pharmacyInfo?.address || ''}</div>
              <div>N° ORDRE: ${pharmacyInfo?.nOrdre || ''}</div>
              <div>AGRÉMENT: ${pharmacyInfo?.agreement || ''}</div>
            </div>
            <div class="details-group right-group">
              <div class="right-inner">
                <div>NIF: ${pharmacyInfo?.nif || ''}</div>
                <div>NIS: ${pharmacyInfo?.nis || ''}</div>
                <div>TEL: ${pharmacyInfo?.tel || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="content-title">RAPPORT CHRONOLOGIQUE DES SORTIES PSYCHOTROPES</div>
        <div class="info-line">PÉRIODE : DU ${reportStartDate.split('-').reverse().join('/')} AU ${reportEndDate.split('-').reverse().join('/')}</div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 10%"><span class="th-inner">DATE</span></th>
                <th style="width: 20%"><span class="th-inner">MOTIF</span></th>
                <th style="width: 45%"><span class="th-inner">MEDICAMENT</span></th>
                <th style="width: 10%"><span class="th-inner">QTÉ</span></th>
                <th style="width: 15%"><span class="th-inner">PÉRIODE</span></th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(s => `
                <tr>
                  <td>${s.date.split('-').reverse().join('/')}</td>
                  <td>${s.reason}</td>
                  <td>${s.drugName}</td>
                  <td style="text-align: center; font-weight: 900">${s.quantity}</td>
                  <td>${s.month} ${s.year}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="separator-container">
          <div class="gray-line-rounded"></div>
        </div>

        <div class="summary-container">
          <div style="background-color: #e5e7eb; padding: 4px 15px; border-radius: 8px; margin-right: 10px;">${filtered.length}</div>
          <div>LIGNES DE SORTIES ENREGISTRÉES</div>
        </div>
        
        <div class="footer-date">GÉNÉRÉ LE : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        <div class="footer">
          <div>LE PHARMACIEN</div>
        </div>
      </div>
    `;

    const page2Html = `
      <div class="page">
        <div class="header-box">
          <div class="pharmacy-name-header">PHARMACIE ${pharmacyInfo?.name || 'NOM DE LA PHARMACIE'}</div>
          <div class="details-grid">
            <div class="details-group left-group">
              <div>ADRESSE: ${pharmacyInfo?.address || ''}</div>
              <div>N° ORDRE: ${pharmacyInfo?.nOrdre || ''}</div>
              <div>AGRÉMENT: ${pharmacyInfo?.agreement || ''}</div>
            </div>
            <div class="details-group right-group">
              <div class="right-inner">
                <div>NIF: ${pharmacyInfo?.nif || ''}</div>
                <div>NIS: ${pharmacyInfo?.nis || ''}</div>
                <div>TEL: ${pharmacyInfo?.tel || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="content-title">ÉTAT RÉCAPITULATIF DES SORTIES</div>
        <div class="info-line">PÉRIODE : DU ${reportStartDate.split('-').reverse().join('/')} AU ${reportEndDate.split('-').reverse().join('/')}</div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 10%"><span class="th-inner">N°</span></th>
                <th style="width: 70%"><span class="th-inner">MEDICAMENT</span></th>
                <th style="width: 20%"><span class="th-inner">TOTAL QUANTITÉ</span></th>
              </tr>
            </thead>
            <tbody>
              ${summaryList.map((item, idx) => `
                <tr>
                  <td style="text-align: center">${idx + 1}</td>
                  <td style="font-weight: bold">${item.drugName}</td>
                  <td style="text-align: center; font-weight: 900">${item.totalQuantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="separator-container">
          <div class="gray-line-rounded"></div>
        </div>

        <div class="summary-container">
          <div style="background-color: #e5e7eb; padding: 4px 15px; border-radius: 8px; margin-right: 10px;">${summaryList.length}</div>
          <div>PRODUITS SORTIS</div>
        </div>
        
        <div class="footer-date">GÉNÉRÉ LE : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        <div class="footer">
          <div>LE PHARMACIEN</div>
        </div>
      </div>
    `;

    const finalHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>RAPPORT DES SORTIES - PHARMAPSY</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>${commonStyles}</style>
      </head>
      <body>
        ${(mode === 'p1' || mode === 'both') ? page1Html : ''}
        ${(mode === 'p2' || mode === 'both') ? page2Html : ''}
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(finalHtml);
    printWindow.document.close();
    setShowPrintModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 uppercase pb-20">
      <ConfirmationModal
        isOpen={!!itemToDeleteId}
        onClose={cancelRemoveItem}
        onConfirm={confirmRemoveItem}
        title="RETIRER LA LIGNE ?"
        message="Voulez-vous vraiment retirer cette ligne de médicament du formulaire ?"
      />
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
              {existingExit || items.some(i => allSorties.some(as => as.id === i.id)) ? 'Modifier la Sortie' : 'Nouvelle Sortie'}
            </h2>
            <p className="text-slate-500 text-sm">Enregistrement des sorties de stock de psychotropes.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold shadow-sm transition-all"><Printer className="w-4 h-4" />Imprimer Bon</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-8 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"><Save className="w-4 h-4" />Enregistrer</button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-2xl flex items-center gap-4 no-print animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="font-bold text-sm uppercase">{error}</p>
        </div>
      )}

      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50">
              <h3 className="text-lg font-black text-rose-900 flex items-center gap-2 uppercase tracking-tight">
                <Printer className="w-5 h-5" /> Sélection d'impression
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="p-2 hover:bg-rose-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-rose-600" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wide text-center mb-6">Quel rapport souhaitez-vous générer ?</p>
              
              <button 
                onClick={() => handlePrintReport('p1')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50 transition-all group"
              >
                <div className="bg-slate-100 group-hover:bg-rose-200 p-3 rounded-xl transition-colors">
                  <FileText className="w-6 h-6 text-slate-500 group-hover:text-rose-700" />
                </div>
                <div className="text-left">
                  <div className="font-black text-slate-800 text-sm">PAGE 1 SEULEMENT</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Journal Chronologique complet</div>
                </div>
              </button>

              <button 
                onClick={() => handlePrintReport('p2')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50 transition-all group"
              >
                <div className="bg-slate-100 group-hover:bg-rose-200 p-3 rounded-xl transition-colors">
                  <Layers className="w-6 h-6 text-slate-500 group-hover:text-rose-700" />
                </div>
                <div className="text-left">
                  <div className="font-black text-slate-800 text-sm">PAGE 2 SEULEMENT</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">État Récapitulatif (Total Qty)</div>
                </div>
              </button>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => handlePrintReport('both')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                >
                  <div className="bg-rose-500 p-3 rounded-xl">
                    <Printer className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm">LES DEUX PAGES</div>
                    <div className="text-[10px] text-rose-200 font-bold uppercase">Rapport complet (1 & 2)</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-10 space-y-10 no-print">
        {showSuccess ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-rose-100 p-6 rounded-full text-rose-600">
              <CheckCircle className="w-16 h-16" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 uppercase">Données Enregistrées !</h3>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide"><Calendar className="w-4 h-4 text-rose-500" /> Date Effective</label>
                <input 
                  type="date"
                  value={globalData.date}
                  onChange={(e) => setGlobalData({...globalData, date: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide"><History className="w-4 h-4 text-rose-500" /> Année</label>
                <select 
                  value={globalData.year} 
                  onChange={(e) => setGlobalData({...globalData, year: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none uppercase font-bold text-slate-800"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide"><Calendar className="w-4 h-4 text-rose-500" /> Mois</label>
                <select 
                  value={globalData.month} 
                  onChange={(e) => setGlobalData({...globalData, month: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none uppercase font-bold text-slate-800"
                >
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-8">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide"><FolderOutput className="w-4 h-4 text-rose-500" /> Motif de sortie (Reason)</label>
              <div className="relative">
                <input 
                  list="reasons-datalist"
                  type="text" 
                  value={globalData.reason} 
                  onChange={(e) => setGlobalData({...globalData, reason: e.target.value.toUpperCase()})}
                  placeholder="SÉLECTIONNER OU SAISIR LE MOTIF..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none uppercase font-bold text-slate-800 shadow-sm"
                />
                <datalist id="reasons-datalist">
                  {reasons.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3 uppercase"><Pill className="w-5 h-5 text-rose-500" /> Médicaments & Quantités</h3>
                <button onClick={addItem} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl font-bold hover:bg-rose-100 transition-colors text-xs uppercase tracking-wider"><Plus className="w-4 h-4" /> Ajouter une ligne</button>
              </div>
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end animate-in fade-in duration-300">
                    <div className="md:col-span-1 text-center font-mono text-slate-300 font-bold pb-4 text-lg">#{index + 1}</div>
                    <div className="md:col-span-8 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Médicament</label>
                      <input 
                        list="meds-datalist"
                        type="text" 
                        value={item.drugName} 
                        onChange={(e) => updateItem(index, 'drugName', e.target.value)}
                        placeholder="NOM DU MÉDICAMENT..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none uppercase font-bold text-sm text-slate-800"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-center block">Quantité</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={item.quantity} 
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-black text-rose-600 text-center text-lg"
                      />
                    </div>
                    <div className="md:col-span-1 pb-1">
                      <button 
                        onClick={() => removeItem(item.id)} 
                        disabled={items.length === 1}
                        className="w-full flex items-center justify-center p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl disabled:opacity-0 transition-all shadow-sm border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <datalist id="meds-datalist">
                {medications.map(m => <option key={m.id} value={m.fullNom.toUpperCase()} />)}
              </datalist>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
        <div className="p-8 bg-slate-50 border-b border-slate-100 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm"><History className="w-6 h-6 text-rose-500" /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Journal des Sorties</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Historique complet des sorties de stock</p>
              </div>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="FILTRER PAR PRODUIT OU MOTIF..."
                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs font-bold uppercase tracking-wider"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 flex flex-col md:flex-row md:items-end gap-6 shadow-inner">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Date de début
                </label>
                <input 
                  type="date" 
                  value={reportStartDate} 
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Date de fin
                </label>
                <input 
                  type="date" 
                  value={reportEndDate} 
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-bold text-sm"
                />
              </div>
            </div>
            <button 
              onClick={() => setShowPrintModal(true)}
              className="px-8 py-2.5 bg-rose-700 text-white rounded-xl font-bold hover:bg-rose-800 transition-all shadow-lg flex items-center gap-2 uppercase text-xs"
            >
              <FileDown className="w-4 h-4" />
              Imprimer Rapport
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">Date & Période</th>
                <th className="px-8 py-5">Motif</th>
                <th className="px-8 py-5">Médicament</th>
                <th className="px-8 py-5 text-center">Quantité</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.length > 0 ? (
                filteredHistory.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="font-bold text-slate-800 text-sm tracking-tight">{s.date.split('-').reverse().join('/')}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{s.month} {s.year}</div>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-600 text-xs uppercase truncate max-w-[180px]">
                      {s.reason}
                    </td>
                    <td className="px-8 py-5 font-black text-slate-800 text-sm uppercase">
                      {s.drugName}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-4 py-1.5 bg-rose-50 text-rose-700 rounded-xl font-black text-sm border border-rose-100 shadow-sm">
                        -{s.quantity}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button onClick={() => handleEditHistory(s)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Edit className="w-5 h-5" /></button>
                        <button 
                          onClick={() => onDelete(s.id)} 
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <FileText className="w-16 h-16 opacity-20" />
                      <p className="text-xl font-bold uppercase tracking-widest">Aucun enregistrement</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SortiesForm;

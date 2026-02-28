
import React, { useState, useMemo, useEffect } from 'react';
import { Save, Printer, ArrowLeft, Building2, Calendar, Pill, CheckCircle, AlertCircle, Plus, Trash2, Edit, History, Search, FileText, FileDown, Layers, X } from 'lucide-react';
import { InventoryEntry, Supplier, Medication, PharmacyInfo, Order } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface EntreeItem {
  id: string;
  drugName: string;
  quantity: number;
}

interface EntreesFormProps {
  existingEntry?: InventoryEntry | null;
  allEntrees: InventoryEntry[];
  orders: Order[];
  suppliers: Supplier[];
  medications: Medication[];
  pharmacyInfo: PharmacyInfo | null;
  onSave: (entries: InventoryEntry[]) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

const EntreesForm: React.FC<EntreesFormProps> = ({ 
  existingEntry, 
  allEntrees, 
  orders,
  suppliers, 
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

  const [globalData, setGlobalData] = useState({
    year: existingEntry?.year || currentYear.toString(),
    month: existingEntry?.month || months[new Date().getMonth()],
    supplier: existingEntry?.supplier || '',
    date: existingEntry?.date || new Date().toISOString().split('T')[0],
  });

  const [items, setItems] = useState<EntreeItem[]>([]);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (existingEntry) {
      setItems([{ id: existingEntry.id, drugName: existingEntry.drugName, quantity: existingEntry.quantity }]);
      setGlobalData({
        year: existingEntry.year,
        month: existingEntry.month,
        supplier: existingEntry.supplier,
        date: existingEntry.date
      });
      setCurrentOrderId(existingEntry.orderId || null);
    } else {
      setItems([{ id: crypto.randomUUID(), drugName: '', quantity: 0 }]);
      setCurrentOrderId(null);
    }
  }, [existingEntry]);

  const [historySearch, setHistorySearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    return allEntrees
      .filter(e => 
        e.drugName.toLowerCase().includes(historySearch.toLowerCase()) ||
        e.supplier.toLowerCase().includes(historySearch.toLowerCase())
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [allEntrees, historySearch]);

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

  const updateItem = (index: number, field: keyof EntreeItem, value: any) => {
    const newItems = [...items];
    const finalValue = (typeof value === 'string') ? value.toUpperCase() : value;
    newItems[index] = { ...newItems[index], [field]: finalValue };
    setItems(newItems);
  };

  const handleEditHistory = (entry: InventoryEntry) => {
    setGlobalData({
      year: entry.year,
      month: entry.month,
      supplier: entry.supplier,
      date: entry.date
    });
    setItems([{ id: entry.id, drugName: entry.drugName, quantity: entry.quantity }]);
    setCurrentOrderId(entry.orderId || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!globalData.supplier.trim()) {
      setError("Le fournisseur est obligatoire.");
      return;
    }

    const validItems = items.filter(item => item.drugName.trim() !== '' && item.quantity > 0);
    
    if (validItems.length === 0) {
      setError("Veuillez saisir au moins un médicament avec une quantité valide.");
      return;
    }

    const entries: InventoryEntry[] = validItems.map(item => ({
      id: item.id,
      year: globalData.year,
      month: globalData.month,
      supplier: globalData.supplier.toUpperCase(),
      drugName: item.drugName.toUpperCase(),
      quantity: item.quantity,
      date: globalData.date,
      createdAt: existingEntry?.createdAt || Date.now(),
      orderId: currentOrderId || undefined
    }));

    setError(null);
    onSave(entries);
    setShowSuccess(true);
    
    if (!existingEntry) {
      setItems([{ id: crypto.randomUUID(), drugName: '', quantity: 0 }]);
      setCurrentOrderId(null);
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
        <title>BON D'ENTRÉE - ${globalData.supplier}</title>
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

        <div class="content-title">BON D'ENTRÉE PSYCHOTROPES</div>

        <div class="info-line">
          <div>PÉRIODE: ${globalData.month} ${globalData.year}</div>
          <div>DATE: ${formatDisplayDate(globalData.date)}</div>
        </div>
        <div class="info-line">
           <div>FOURNISSEUR: ${globalData.supplier}</div>
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
                  <td class="col-qty" style="text-align: center; font-weight: 900">${item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="separator-container">
          <div class="gray-line-rounded"></div>
        </div>

        <div class="summary-container">
          <div style="background-color: #e5e7eb; padding: 4px 15px; border-radius: 8px; margin-right: 10px;">${items.filter(i => i.drugName).length}</div>
          <div>PRODUIT(S) RÉCEPTIONNÉ(S)</div>
        </div>

        <div class="footer-date">GÉNÉRÉ LE : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        <div class="footer">
          <div>LE PHARMACIEN</div>
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
    const filtered = allEntrees.filter(e => e.date >= reportStartDate && e.date <= reportEndDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (filtered.length === 0) {
      alert("Aucune donnée trouvée pour cette période.");
      return;
    }

    const aggregatedMap = new Map<string, number>();
    filtered.forEach(e => {
      const name = e.drugName.toUpperCase();
      aggregatedMap.set(name, (aggregatedMap.get(name) || 0) + e.quantity);
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

        <div class="content-title">RAPPORT CHRONOLOGIQUE DES ENTRÉES PSYCHOTROPES</div>
        <div class="info-line">PÉRIODE : DU ${reportStartDate.split('-').reverse().join('/')} AU ${reportEndDate.split('-').reverse().join('/')}</div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 10%"><span class="th-inner">DATE</span></th>
                <th style="width: 20%"><span class="th-inner">FOURNISSEUR</span></th>
                <th style="width: 45%"><span class="th-inner">MEDICAMENT</span></th>
                <th style="width: 10%"><span class="th-inner">QTÉ</span></th>
                <th style="width: 15%"><span class="th-inner">PÉRIODE</span></th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(e => `
                <tr>
                  <td>${e.date.split('-').reverse().join('/')}</td>
                  <td>${e.supplier}</td>
                  <td>${e.drugName}</td>
                  <td style="text-align: center; font-weight: 900">${e.quantity}</td>
                  <td>${e.month} ${e.year}</td>
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
          <div>LIGNES D'ENTRÉES ENREGISTRÉES</div>
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

        <div class="content-title">ÉTAT RÉCAPITULATIF DES ENTRÉES</div>
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
          <div>PRODUITS RÉCEPTIONNÉS</div>
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
        <title>RAPPORT DES ENTRÉES - PHARMAPSY</title>
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

  const handleImportOrder = (order: Order) => {
    // Populate form with order data
    const orderDate = new Date(order.date);
    const monthName = months[orderDate.getMonth()];
    
    setGlobalData({
      year: orderDate.getFullYear().toString(),
      month: monthName,
      supplier: order.supplier,
      date: order.date
    });

    // Map order items to entree items
    const newItems = order.items.map(item => ({
      id: crypto.randomUUID(),
      drugName: item.name,
      quantity: item.quantity
    }));

    setItems(newItems);
    setCurrentOrderId(order.id);
    setShowOrderModal(false);
    setError(null);
  };

  const importedOrderIds = useMemo(() => {
    return new Set(allEntrees.map(e => e.orderId).filter(Boolean));
  }, [allEntrees]);

  const availableOrders = useMemo(() => {
    return orders.filter(o => !importedOrderIds.has(o.id)).sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, importedOrderIds]);

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
              {existingEntry || items.some(i => allEntrees.some(ae => ae.id === i.id)) ? 'Modifier l\'Entrée' : 'Nouvelle Entrée'}
            </h2>
            <p className="text-slate-500 text-sm">Saisie des réceptions de médicaments psychotropes.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowOrderModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 font-bold shadow-sm transition-all">
            <FileDown className="w-4 h-4" />
            IMPORTER BC
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold shadow-sm transition-all"><Printer className="w-4 h-4" />Imprimer Bon</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"><Save className="w-4 h-4" />Enregistrer</button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-2xl flex items-center gap-4 no-print animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="font-bold text-sm uppercase">{error}</p>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-50">
              <h3 className="text-lg font-black text-blue-900 flex items-center gap-2 uppercase tracking-tight">
                <FileDown className="w-5 h-5" /> Importer un Bon de Commande
              </h3>
              <button onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-blue-600" />
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {availableOrders.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">Aucun bon de commande disponible à l'importation.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {availableOrders.map(order => (
                    <button 
                      key={order.id}
                      onClick={() => handleImportOrder(order)}
                      className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-slate-800">BC N° {order.orderNumber || 'SANS NUMÉRO'}</div>
                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(order.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {order.supplier}</span>
                        </div>
                      </div>
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold group-hover:bg-blue-200 transition-colors">
                        {order.items.length} PRODUIT(S)
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
              <h3 className="text-lg font-black text-emerald-900 flex items-center gap-2 uppercase tracking-tight">
                <Printer className="w-5 h-5" /> Sélection d'impression
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-emerald-600" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wide text-center mb-6">Quel rapport souhaitez-vous générer ?</p>
              
              <button 
                onClick={() => handlePrintReport('p1')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
              >
                <div className="bg-slate-100 group-hover:bg-emerald-200 p-3 rounded-xl transition-colors">
                  <FileText className="w-6 h-6 text-slate-500 group-hover:text-emerald-700" />
                </div>
                <div className="text-left">
                  <div className="font-black text-slate-800 text-sm">PAGE 1 SEULEMENT</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Journal Chronologique complet</div>
                </div>
              </button>

              <button 
                onClick={() => handlePrintReport('p2')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
              >
                <div className="bg-slate-100 group-hover:bg-emerald-200 p-3 rounded-xl transition-colors">
                  <Layers className="w-6 h-6 text-slate-500 group-hover:text-emerald-700" />
                </div>
                <div className="text-left">
                  <div className="font-black text-slate-800 text-sm">PAGE 2 SEULEMENT</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">État Récapitulatif (Total Qty)</div>
                </div>
              </button>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => handlePrintReport('both')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  <div className="bg-emerald-500 p-3 rounded-xl">
                    <Printer className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm">LES DEUX PAGES</div>
                    <div className="text-[10px] text-emerald-200 font-bold uppercase">Rapport complet (1 & 2)</div>
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
            <div className="bg-emerald-100 p-6 rounded-full text-emerald-600">
              <CheckCircle className="w-16 h-16" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 uppercase">Données Enregistrées !</h3>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide"><Calendar className="w-4 h-4 text-emerald-500" /> Date Effective</label>
                <input 
                  type="date"
                  value={globalData.date}
                  onChange={(e) => setGlobalData({...globalData, date: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide"><History className="w-4 h-4 text-emerald-500" /> Année</label>
                <select 
                  value={globalData.year} 
                  onChange={(e) => setGlobalData({...globalData, year: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-bold text-slate-800"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide"><Calendar className="w-4 h-4 text-emerald-500" /> Mois</label>
                <select 
                  value={globalData.month} 
                  onChange={(e) => setGlobalData({...globalData, month: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-bold text-slate-800"
                >
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-8">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide"><Building2 className="w-4 h-4 text-emerald-500" /> Fournisseur (Provider)</label>
              <div className="relative">
                <input 
                  list="suppliers-datalist"
                  type="text" 
                  value={globalData.supplier} 
                  onChange={(e) => setGlobalData({...globalData, supplier: e.target.value.toUpperCase()})}
                  placeholder="RECHERCHER OU SAISIR FOURNISSEUR..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-bold text-slate-800 shadow-sm"
                />
                <datalist id="suppliers-datalist">
                  {suppliers.map(s => <option key={s.id} value={s.name.toUpperCase()} />)}
                </datalist>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3 uppercase"><Pill className="w-5 h-5 text-emerald-500" /> Médicaments & Quantités</h3>
                <button onClick={addItem} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-colors text-xs uppercase tracking-wider"><Plus className="w-4 h-4" /> Ajouter une ligne</button>
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
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-bold text-sm text-slate-800"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-center block">Quantité</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={item.quantity} 
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-emerald-600 text-center text-lg"
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
              <div className="bg-white p-3 rounded-xl shadow-sm"><History className="w-6 h-6 text-emerald-500" /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Journal des Entrées</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Historique complet des réceptions</p>
              </div>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="FILTRER PAR PRODUIT OU FOURNISSEUR..."
                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs font-bold uppercase tracking-wider"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex flex-col md:flex-row md:items-end gap-6 shadow-inner">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Date de début
                </label>
                <input 
                  type="date" 
                  value={reportStartDate} 
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Date de fin
                </label>
                <input 
                  type="date" 
                  value={reportEndDate} 
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                />
              </div>
            </div>
            <button 
              onClick={() => setShowPrintModal(true)}
              className="px-8 py-2.5 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-lg flex items-center gap-2 uppercase text-xs"
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
                <th className="px-8 py-5">Fournisseur</th>
                <th className="px-8 py-5">Médicament</th>
                <th className="px-8 py-5 text-center">Quantité</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.length > 0 ? (
                filteredHistory.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="font-bold text-slate-800 text-sm tracking-tight">{e.date.split('-').reverse().join('/')}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{e.month} {e.year}</div>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-600 text-xs uppercase truncate max-w-[180px]">
                      {e.supplier}
                    </td>
                    <td className="px-8 py-5 font-black text-slate-800 text-sm uppercase">
                      {e.drugName}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl font-black text-sm border border-emerald-100 shadow-sm">
                        +{e.quantity}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button onClick={() => handleEditHistory(e)} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit className="w-5 h-5" /></button>
                        <button 
                          onClick={() => onDelete(e.id)} 
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

export default EntreesForm;

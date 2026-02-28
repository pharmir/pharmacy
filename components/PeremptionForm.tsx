import React, { useState, useEffect } from 'react';
import { Save, X, Printer, Search, Plus, Trash2, Calendar, Edit } from 'lucide-react';
import { Peremption, PeremptionItem, Medication, Supplier, PharmacyInfo } from '../types';

interface PeremptionFormProps {
  initialData?: Peremption;
  existingReports?: Peremption[];
  medications: Medication[];
  suppliers: Supplier[];
  pharmacyInfo: PharmacyInfo | null;
  onSave: (data: Omit<Peremption, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const PeremptionForm: React.FC<PeremptionFormProps> = ({ 
  initialData, 
  existingReports = [],
  medications, 
  suppliers, 
  pharmacyInfo,
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    reportNumber: initialData?.reportNumber || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    items: initialData?.items || [] as PeremptionItem[]
  });

  // State for the new item being added
  const [newItem, setNewItem] = useState({
    medicationName: '',
    dci: '',
    supplier: '',
    lotNumber: '',
    expiryDate: '',
    quantity: 0,
    unitPrice: 0,
    observation: ''
  });
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showMedResults, setShowMedResults] = useState(false);

  useEffect(() => {
    if (!initialData) {
      // Generate new report number: 00X/YYYY
      const year = new Date().getFullYear();
      const count = existingReports.filter(r => r.reportNumber.endsWith(`/${year}`)).length + 1;
      const reportNumber = `${count.toString().padStart(3, '0')}/${year}`;
      setFormData(prev => ({ ...prev, reportNumber }));
    }
  }, [initialData, existingReports]);

  const filteredMeds = medications.filter(m => 
    m.fullNom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMedSelect = (med: Medication) => {
    setNewItem(prev => ({
      ...prev,
      medicationName: med.fullNom,
      dci: med.dci
    }));
    setSearchTerm('');
    setShowMedResults(false);
  };

  const handleAddItem = () => {
    if (!newItem.medicationName || !newItem.lotNumber || !newItem.expiryDate || newItem.quantity <= 0) {
      alert("Veuillez remplir tous les champs obligatoires du médicament.");
      return;
    }

    if (editingItemId) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === editingItemId 
            ? { ...item, ...newItem, totalPrice: newItem.quantity * newItem.unitPrice }
            : item
        )
      }));
      setEditingItemId(null);
    } else {
      const item: PeremptionItem = {
        id: crypto.randomUUID(),
        ...newItem,
        totalPrice: newItem.quantity * newItem.unitPrice
      };

      setFormData(prev => ({
        ...prev,
        items: [...prev.items, item]
      }));
    }

    // Reset new item fields
    setNewItem({
      medicationName: '',
      dci: '',
      supplier: '',
      lotNumber: '',
      expiryDate: '',
      quantity: 0,
      unitPrice: 0,
      observation: ''
    });
  };

  const handleEditItem = (item: PeremptionItem) => {
    setNewItem({
      medicationName: item.medicationName,
      dci: item.dci,
      supplier: item.supplier,
      lotNumber: item.lotNumber,
      expiryDate: item.expiryDate,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      observation: item.observation
    });
    setEditingItemId(item.id);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setNewItem({
      medicationName: '',
      dci: '',
      supplier: '',
      lotNumber: '',
      expiryDate: '',
      quantity: 0,
      unitPrice: 0,
      observation: ''
    });
    setEditingItemId(null);
  };

  const handleRemoveItem = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
      if (editingItemId === id) {
        handleCancelEdit();
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrintItem = (item: PeremptionItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Détail Péremption - ${item.medicationName}</title>
        <style>
          @page { size: A5 landscape; margin: 0.5cm; }
          body { font-family: "Times New Roman", Times, serif; text-transform: uppercase; }
          .container { border: 1px solid black; padding: 20px; }
          .header { text-align: center; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid black; padding-bottom: 10px; }
          .row { display: flex; margin-bottom: 10px; }
          .label { font-weight: bold; width: 150px; }
          .value { flex: 1; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h3>DÉTAIL PRODUIT PÉRIMÉ</h3>
            <div>PV N°: ${formData.reportNumber} | DATE: ${new Date(formData.date).toLocaleDateString('fr-FR')}</div>
          </div>
          <div class="row"><div class="label">MÉDICAMENT:</div><div class="value">${item.medicationName}</div></div>
          <div class="row"><div class="label">DCI:</div><div class="value">${item.dci}</div></div>
          <div class="row"><div class="label">FOURNISSEUR:</div><div class="value">${item.supplier}</div></div>
          <div class="row"><div class="label">LOT:</div><div class="value">${item.lotNumber}</div></div>
          <div class="row"><div class="label">DDP:</div><div class="value">${item.expiryDate}</div></div>
          <div class="row"><div class="label">QUANTITÉ:</div><div class="value">${item.quantity}</div></div>
          <div class="row"><div class="label">PRIX UNITAIRE:</div><div class="value">${formatCurrency(item.unitPrice)} DA</div></div>
          <div class="row"><div class="label">VALEUR TOTALE:</div><div class="value">${formatCurrency(item.totalPrice)} DA</div></div>
          <div class="row"><div class="label">OBSERVATION:</div><div class="value">${item.observation}</div></div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const calculateTotalValue = () => {
    return formData.items.reduce((acc, item) => acc + item.totalPrice, 0);
  };

  const calculateTotalQuantity = () => {
    return formData.items.reduce((acc, item) => acc + item.quantity, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert("Veuillez ajouter au moins un médicament au rapport.");
      return;
    }
    onSave(formData);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour afficher le rapport d'impression.");
      return;
    }

    const totalValue = calculateTotalValue();
    const totalQuantity = calculateTotalQuantity();
    const displayDate = new Date(formData.date).toLocaleDateString('fr-FR');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>PV de Péremption - ${formData.reportNumber}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4 landscape; margin: 0.5cm; }
          body { 
            font-family: "Times New Roman", Times, serif; 
            text-transform: uppercase; 
            background: white; 
            color: black; 
            margin: 0; 
            padding: 0; 
          }
          .header-box {
            margin: 1cm 1cm 0 1cm;
            border: 1px solid black;
            border-radius: 8px;
            box-sizing: border-box;
            padding: 15px 25px;
            display: flex;
            flex-direction: column;
          }
          .pharmacy-name-header {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 10px;
            font-family: "Times New Roman", Times, serif;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            flex: 1;
          }
          .details-group {
            font-size: 8pt;
            font-family: "Segoe UI", sans-serif;
            font-weight: bold;
            line-height: 1.2;
          }
          .left-group { text-align: left; }
          .right-group { 
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .right-inner {
            text-align: left;
            min-width: 180px;
          }
          .title-container {
            margin: 0.5cm 1cm 0.2cm 1cm;
            text-align: center;
          }
          .content-title-box {
            background-color: #e5e7eb;
            border-radius: 12px;
            padding: 10px 20px;
            display: block;
            width: 100%;
            box-sizing: border-box;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .report-date {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 5px;
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
            border-radius: 12px;
            padding: 4px 4px;
            margin: 0 0.5mm;
            display: block;
            font-weight: bold;
            font-size: 10pt;
            color: black;
            font-family: "Times New Roman", Times, serif;
          }
          td {
            border: none;
            padding: 2px 5px;
            text-align: left;
            font-size: 8pt;
            font-family: "Segoe UI", sans-serif;
            font-weight: normal;
          }
          
          /* Column Widths */
          .col-num { width: 40px; text-align: center; }
          .col-med { width: 20%; }
          .col-dci { width: 15%; }
          .col-supp { width: 15%; }
          .col-lot { width: 10%; text-align: center; }
          .col-ddp { width: 8%; text-align: center; }
          .col-qty { width: 6%; text-align: center; font-weight: bold; font-family: "Times New Roman", Times, serif; font-size: 10pt; }
          .col-price { width: 8%; text-align: right; font-weight: bold; font-family: "Times New Roman", Times, serif; font-size: 10pt; }
          .col-total { width: 8%; text-align: right; font-weight: bold; font-family: "Times New Roman", Times, serif; font-size: 10pt; }
          .col-obs { width: 10%; }

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
            justify-content: flex-end;
            align-items: center;
            font-weight: bold;
            font-size: 11pt;
            gap: 20px;
          }
          .summary-item {
            background-color: #f3f4f6;
            padding: 5px 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .signature-section {
            margin-top: 1.5cm;
            text-align: center;
            font-weight: bold;
            font-size: 12pt;
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
              <div>TEL: ${pharmacyInfo?.tel || ''}</div>
            </div>
            <div class="details-group right-group">
              <div class="right-inner">
                <div>NIF: ${pharmacyInfo?.nif || ''}</div>
                <div>NIS: ${pharmacyInfo?.nis || ''}</div>
                <div>RC: ${pharmacyInfo?.rc || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="title-container">
          <div class="content-title-box">
            PROCÈS-VERBAL DE PÉREMPTION N° ${formData.reportNumber}
          </div>
          <div class="report-date">DATE: ${displayDate}</div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N°</span></th>
                <th class="col-med"><span class="th-inner">MÉDICAMENT</span></th>
                <th class="col-dci"><span class="th-inner">DCI</span></th>
                <th class="col-supp"><span class="th-inner">FOURNISSEUR</span></th>
                <th class="col-lot"><span class="th-inner">LOT</span></th>
                <th class="col-ddp"><span class="th-inner">DDP</span></th>
                <th class="col-qty"><span class="th-inner">QTÉ</span></th>
                <th class="col-price"><span class="th-inner">P.U</span></th>
                <th class="col-total"><span class="th-inner">TOTAL</span></th>
                <th class="col-obs"><span class="th-inner">OBS</span></th>
              </tr>
            </thead>
            <tbody>
              ${formData.items.map((item, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-med">${item.medicationName}</td>
                  <td class="col-dci">${item.dci}</td>
                  <td class="col-supp">${item.supplier}</td>
                  <td class="col-lot">${item.lotNumber}</td>
                  <td class="col-ddp">${item.expiryDate}</td>
                  <td class="col-qty">${item.quantity}</td>
                  <td class="col-price">${formatCurrency(item.unitPrice)}</td>
                  <td class="col-total">${formatCurrency(item.totalPrice)}</td>
                  <td class="col-obs">${item.observation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="page-break-inside: avoid;">
          <div class="separator-container">
            <div class="gray-line-rounded"></div>
          </div>

          <div class="summary-container">
            <div class="summary-item">ARTICLES: ${formData.items.length}</div>
            <div class="summary-item">QUANTITÉ: ${totalQuantity}</div>
            <div class="summary-item">VALEUR: ${formatCurrency(totalValue)} DA</div>
          </div>

          <div class="signature-section">
            <div>LE PHARMACIEN</div>
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

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-6xl mx-auto my-8 flex flex-col h-[90vh]">
      <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-bold text-slate-800">
          {initialData ? 'Modifier PV de Péremption' : 'Nouveau PV de Péremption'}
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">N° Rapport</label>
            <input
              type="text"
              readOnly
              className="w-full px-4 py-3 bg-slate-200 border border-slate-300 rounded-xl text-slate-600 font-bold uppercase"
              value={formData.reportNumber}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Date</label>
            <div className="relative">
              <input
                type="date"
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Add Item Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 uppercase">Ajouter un médicament</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2 relative">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Médicament</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase font-bold text-sm"
                  placeholder="Rechercher..."
                  value={newItem.medicationName || searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setNewItem(prev => ({ ...prev, medicationName: e.target.value }));
                    setShowMedResults(true);
                  }}
                  onFocus={() => setShowMedResults(true)}
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {showMedResults && searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredMeds.map(med => (
                    <div
                      key={med.id}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                      onClick={() => handleMedSelect(med)}
                    >
                      <div className="font-bold text-slate-800 text-sm">{med.fullNom}</div>
                      <div className="text-xs text-slate-500">{med.dci}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">DCI</label>
              <input
                type="text"
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm uppercase"
                value={newItem.dci}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Fournisseur</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm uppercase"
                value={newItem.supplier}
                onChange={(e) => setNewItem(prev => ({ ...prev, supplier: e.target.value }))}
              >
                <option value="">Sélectionner</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">N° Lot</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm uppercase"
                value={newItem.lotNumber}
                onChange={(e) => setNewItem(prev => ({ ...prev, lotNumber: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">DDP (MM/AAAA)</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm"
                value={newItem.expiryDate}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2, 6);
                  setNewItem(prev => ({ ...prev, expiryDate: val }));
                }}
                placeholder="MM/AAAA"
                maxLength={7}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Quantité</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm text-right"
                value={newItem.quantity || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                  setNewItem(prev => ({ ...prev, quantity: val }));
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Prix Unitaire</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm text-right"
                value={newItem.unitPrice || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setNewItem(prev => ({ ...prev, unitPrice: val }));
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Total</label>
              <input
                type="text"
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-bold font-mono text-sm text-right"
                value={(newItem.quantity * newItem.unitPrice).toFixed(2)}
              />
            </div>
            <div className="flex items-end gap-2">
              {editingItemId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-all"
                >
                  Annuler
                </button>
              )}
              <button
                type="button"
                onClick={handleAddItem}
                className={`w-full px-4 py-2 ${editingItemId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'} text-white rounded-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2`}
              >
                {editingItemId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingItemId ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Observation</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm uppercase"
              value={newItem.observation}
              onChange={(e) => setNewItem(prev => ({ ...prev, observation: e.target.value.toUpperCase() }))}
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-4 py-3">Médicament</th>
                <th className="px-4 py-3">Fournisseur</th>
                <th className="px-4 py-3">Lot</th>
                <th className="px-4 py-3">DDP</th>
                <th className="px-4 py-3 text-center">Qté</th>
                <th className="px-4 py-3 text-right">P.U</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {formData.items.length > 0 ? (
                formData.items.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${editingItemId === item.id ? 'bg-amber-50' : ''}`}
                    onDoubleClick={() => handleEditItem(item)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 text-sm">{item.medicationName}</div>
                      <div className="text-xs text-slate-500">{item.dci}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.supplier}</td>
                    <td className="px-4 py-3 font-mono text-sm">{item.lotNumber}</td>
                    <td className="px-4 py-3 font-mono text-sm">{item.expiryDate}</td>
                    <td className="px-4 py-3 text-center font-bold text-sm">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-700 text-sm">{formatCurrency(item.totalPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handlePrintItem(item); }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="Imprimer étiquette"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditItem(item); }}
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Aucun médicament ajouté au rapport
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-right font-bold text-slate-600 uppercase">Total Général</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatCurrency(calculateTotalValue())} DA</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex justify-between items-center shrink-0">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
        >
          <Printer className="w-5 h-5" />
          Imprimer PV
        </button>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
          >
            <Save className="w-5 h-5" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PeremptionForm;

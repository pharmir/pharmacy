
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Save, Printer, ArrowLeft, AlertCircle, CheckCircle, Database, ArrowUp, ArrowDown } from 'lucide-react';
import { StockInitial, MedicationItem, Medication, PharmacyInfo } from '../types';

interface StockInitialFormProps {
  existingStock?: StockInitial | null;
  allStocks: StockInitial[];
  medications: Medication[];
  pharmacyInfo: PharmacyInfo | null;
  onSave: (stock: StockInitial) => void;
  onCancel: () => void;
}

const StockInitialForm: React.FC<StockInitialFormProps> = ({ existingStock, allStocks, medications, pharmacyInfo, onSave, onCancel }) => {
  const [stock, setStock] = useState<StockInitial>(
    existingStock ? {
      ...existingStock,
      items: [...existingStock.items].sort((a, b) => a.name.localeCompare(b.name))
    } : {
      id: crypto.randomUUID(),
      docNumber: `SI-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      items: [{ id: crypto.randomUUID(), name: '', quantity: 0, unit: 'BOITE' }],
      createdAt: Date.now()
    }
  );

  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'dci' | 'quantity'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handleSort = (field: 'name' | 'dci' | 'quantity') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedItems = () => {
    return [...stock.items].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      if (sortField === 'name') {
        aValue = a.name;
        bValue = b.name;
      } else if (sortField === 'dci') {
        // Find DCI from medications list
        const medA = medications.find(m => m.fullNom === a.name);
        const medB = medications.find(m => m.fullNom === b.name);
        aValue = medA?.dci || '';
        bValue = medB?.dci || '';
      } else if (sortField === 'quantity') {
        aValue = a.quantity;
        bValue = b.quantity;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return bValue > aValue ? 1 : -1;
      }
    });
  };

  const addItem = () => {
    setStock({
      ...stock,
      items: [...stock.items, { id: crypto.randomUUID(), name: '', quantity: 0, unit: 'BOITE' }]
    });
  };

  const removeItem = (id: string) => {
    setStock({
      ...stock,
      items: stock.items.filter(item => item.id !== id)
    });
  };

  const updateItem = (index: number, field: keyof MedicationItem, value: any) => {
    const newItems = [...stock.items];
    const finalValue = (typeof value === 'string') ? value.toUpperCase() : value;
    newItems[index] = { ...newItems[index], [field]: finalValue };
    setStock({ ...stock, items: newItems });
  };

  const validate = (): boolean => {
    if (stock.items.length === 0) {
      setError("Le stock initial doit contenir au moins un article.");
      return false;
    }
    
    const hasEmptyItem = stock.items.some(item => !item.name.trim());
    if (hasEmptyItem) {
      setError("Toutes les lignes doivent avoir un médicament sélectionné.");
      return false;
    }

    // Check for internal duplicates within this form
    const formNames = stock.items.map(item => item.name.trim().toUpperCase());
    const hasInternalDuplicates = formNames.some((name, idx) => formNames.indexOf(name) !== idx);
    if (hasInternalDuplicates) {
      const duplicateName = formNames.find((name, idx) => formNames.indexOf(name) !== idx);
      setError(`Le médicament "${duplicateName}" est saisi plusieurs fois dans cette liste.`);
      return false;
    }

    // Check for global duplicates across other Stock Initial records
    const otherStocks = allStocks.filter(s => s.id !== stock.id);
    for (const item of stock.items) {
      const itemName = item.name.trim().toUpperCase();
      const isAlreadyEntered = otherStocks.some(s => 
        s.items.some(existingItem => existingItem.name.trim().toUpperCase() === itemName)
      );
      if (isAlreadyEntered) {
        setError(`Le médicament "${itemName}" a déjà été initialisé dans un autre document.`);
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(stock);
    setShowSuccess(true);
    setTimeout(onCancel, 1500);
  };

  const handlePrint = () => {
    if (!validate()) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Stock Initial - Impression</title>
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
          .order-info {
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
          .count-box {
            width: 60px;
            text-align: center;
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

        <div class="content-title">ÉTAT DU STOCK INITIAL PSYCHOTROPES</div>

        <div class="order-info">
          DATE: ${formatDisplayDate(stock.date)}
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
              ${stock.items.map((item, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-med">${item.name}</td>
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
          <div style="background-color: #e5e7eb; padding: 4px 15px; border-radius: 8px; margin-right: 10px;">${stock.items.length}</div>
          <div>PRODUIT(S) INITIALISÉ(S)</div>
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 uppercase">
      <div className="flex items-center justify-between mb-8 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Stock Initial</h2>
            <p className="text-slate-500 text-sm lowercase">Initialisation des quantités de départ en inventaire.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-bold shadow-sm transition-all"><Printer className="w-4 h-4" />Imprimer</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-100 transition-all"><Save className="w-4 h-4" />Enregistrer</button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 no-print animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm uppercase">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 no-print">
        {showSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-emerald-100 p-4 rounded-full"><CheckCircle className="w-12 h-12 text-emerald-600" /></div>
            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-widest">Initialisation Réussie !</h3>
            <p className="text-slate-500 lowercase">Redirection vers l'inventaire en cours...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase">Date d'Initialisation</label>
                <input 
                  type="date" 
                  value={stock.date} 
                  onChange={(e) => setStock({...stock, date: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-tighter">Médicaments du Stock Initial</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-100 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="pb-3 px-2 w-16 text-center">#</th>
                      <th className="pb-3 px-2 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">
                          Désignation
                          {sortField === 'name' && (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="pb-3 px-2 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('dci')}>
                        <div className="flex items-center gap-1">
                          DCI
                          {sortField === 'dci' && (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="pb-3 px-2 w-40 text-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('quantity')}>
                        <div className="flex items-center justify-center gap-1">
                          Quantité Départ
                          {sortField === 'quantity' && (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="pb-3 px-2 w-24 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {getSortedItems().map((item, index) => {
                      const med = medications.find(m => m.fullNom === item.name);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-2 text-center text-slate-400 font-mono text-sm">{index + 1}</td>
                          <td className="py-4 px-2">
                            <select 
                              value={item.name}
                              onChange={(e) => {
                                // Find the original index in the main state array to update correctly
                                const originalIndex = stock.items.findIndex(i => i.id === item.id);
                                if (originalIndex !== -1) {
                                  updateItem(originalIndex, 'name', e.target.value.toUpperCase());
                                }
                              }}
                              className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 outline-none transition-all py-1 font-bold text-slate-800 uppercase"
                            >
                              <option value="">Sélectionner un produit...</option>
                              {medications.map(m => (
                                <option key={m.id} value={m.fullNom.toUpperCase()}>{m.fullNom.toUpperCase()}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-4 px-2 text-slate-500 text-xs font-medium uppercase">
                            {med?.dci || '-'}
                          </td>
                          <td className="py-4 px-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              value={item.quantity} 
                              onChange={(e) => {
                                // Find the original index in the main state array to update correctly
                                const originalIndex = stock.items.findIndex(i => i.id === item.id);
                                if (originalIndex !== -1) {
                                  updateItem(originalIndex, 'quantity', parseInt(e.target.value) || 0);
                                }
                              }}
                              className="w-full text-center bg-transparent border-b border-transparent focus:border-emerald-500 outline-none py-1 font-black text-lg text-emerald-700" 
                            />
                          </td>
                          <td className="py-4 px-2 text-center">
                            <button onClick={() => removeItem(item.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button onClick={addItem} className="mt-6 flex items-center gap-2 text-emerald-600 font-black uppercase text-sm"><Plus className="w-5 h-5" />Ajouter une ligne de stock</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockInitialForm;

import React, { useState } from 'react';
import { Search, Plus, Filter, AlertCircle, Trash2, Edit, Printer, ArrowUp, ArrowDown, Calendar, Package, DollarSign } from 'lucide-react';
import { Peremption, PharmacyInfo } from '../types';

interface PeremptionDashboardProps {
  peremptions: Peremption[];
  pharmacyInfo: PharmacyInfo | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const PeremptionDashboard: React.FC<PeremptionDashboardProps> = ({ peremptions, pharmacyInfo, onEdit, onDelete, onCreateNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'reportNumber' | 'date' | 'supplier' | 'totalValue'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredPeremptions = peremptions.filter(p => 
    p.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.items.some(item => 
      item.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dci.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleSort = (field: 'reportNumber' | 'date' | 'totalValue') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const calculateReportTotal = (p: Peremption) => p.items.reduce((acc, item) => acc + item.totalPrice, 0);

  const sortedPeremptions = [...filteredPeremptions].sort((a, b) => {
    let aValue: any = '';
    let bValue: any = '';

    if (sortField === 'totalValue') {
      aValue = calculateReportTotal(a);
      bValue = calculateReportTotal(b);
    } else {
      aValue = a[sortField];
      bValue = b[sortField];
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalReports = peremptions.length;
  const totalItems = peremptions.reduce((acc, p) => acc + p.items.reduce((sum, item) => sum + item.quantity, 0), 0);
  const totalValue = peremptions.reduce((acc, p) => acc + calculateReportTotal(p), 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrintList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour afficher le rapport d'impression.");
      return;
    }

    const now = new Date();
    const displayDate = now.toLocaleDateString('fr-FR');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Liste des PV de Péremption</title>
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
          .col-num { width: 15%; text-align: left; padding-left: 10px; }
          .col-date { width: 15%; text-align: center; }
          .col-items { width: 15%; text-align: center; }
          .col-val { width: 20%; text-align: right; padding-right: 10px; font-weight: bold; font-family: "Times New Roman", Times, serif; font-size: 10pt; }
          .col-empty { width: 35%; }

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
            LISTE DES PV DE PÉREMPTION
          </div>
          <div class="report-date">DATE: ${displayDate}</div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N° RAPPORT</span></th>
                <th class="col-date"><span class="th-inner">DATE</span></th>
                <th class="col-items"><span class="th-inner">NB ARTICLES</span></th>
                <th class="col-val"><span class="th-inner">VALEUR TOTALE</span></th>
                <th class="col-empty"></th>
              </tr>
            </thead>
            <tbody>
              ${sortedPeremptions.map((p) => `
                <tr>
                  <td class="col-num">${p.reportNumber}</td>
                  <td class="col-date">${new Date(p.date).toLocaleDateString('fr-FR')}</td>
                  <td class="col-items">${p.items.length}</td>
                  <td class="col-val">${formatCurrency(calculateReportTotal(p))} DA</td>
                  <td class="col-empty"></td>
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
            <div class="summary-item">TOTAL RAPPORTS: ${totalReports}</div>
            <div class="summary-item">TOTAL ARTICLES: ${totalItems}</div>
            <div class="summary-item">VALEUR TOTALE: ${formatCurrency(totalValue)} DA</div>
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

  const handlePrintReport = (p: Peremption) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour afficher le rapport d'impression.");
      return;
    }

    const totalValue = calculateReportTotal(p);
    const totalQuantity = p.items.reduce((acc, item) => acc + item.quantity, 0);
    const displayDate = new Date(p.date).toLocaleDateString('fr-FR');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>PV de Péremption - ${p.reportNumber}</title>
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
            PROCÈS-VERBAL DE PÉREMPTION N° ${p.reportNumber}
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
              ${p.items.map((item, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-med">${item.medicationName}</td>
                  <td class="col-dci">${item.dci}</td>
                  <td class="col-supp">${item.supplier}</td>
                  <td class="col-lot">${item.lotNumber}</td>
                  <td class="col-ddp">${item.expiryDate}</td>
                  <td class="col-qty">${item.quantity}</td>
                  <td class="col-price">${item.unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="col-total">${item.totalPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
            <div class="summary-item">ARTICLES: ${p.items.length}</div>
            <div class="summary-item">QUANTITÉ: ${totalQuantity}</div>
            <div class="summary-item">VALEUR: ${totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</div>
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
    <div className="space-y-6 uppercase">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">PV de Péremption</h2>
          <p className="text-slate-500 mt-1">Gérez les produits périmés et avariés.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrintList}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer className="w-5 h-5" />
            Imprimer Liste
          </button>
          <button 
            onClick={onCreateNew}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
          >
            <Plus className="w-5 h-5" />
            Nouveau PV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 lowercase">Total Rapports</p>
              <p className="text-2xl font-bold text-slate-800">{totalReports}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 lowercase">Total Articles Périmés</p>
              <p className="text-2xl font-bold text-slate-800">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 lowercase">Valeur Totale</p>
              <p className="text-2xl font-bold text-slate-800">{totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 no-print">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Chercher par N° Rapport, Fournisseur ou Médicament..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('reportNumber')}>
                <div className="flex items-center gap-2">
                  N° Rapport
                  {sortField === 'reportNumber' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>
                <div className="flex items-center gap-2">
                  Date
                  {sortField === 'date' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-center">Articles</th>
              <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('totalValue')}>
                <div className="flex items-center justify-end gap-2">
                  Valeur Totale
                  {sortField === 'totalValue' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedPeremptions.length > 0 ? (
              sortedPeremptions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {p.reportNumber}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(p.date).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {p.items.length}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                    {calculateReportTotal(p).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 transition-opacity">
                      <button 
                        onClick={() => handlePrintReport(p)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Imprimer PV"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onEdit(p.id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(p.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-slate-400">
                    <div className="bg-slate-100 p-4 rounded-full">
                      <AlertCircle className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-600 uppercase">Aucun PV trouvé</p>
                      <p className="text-sm uppercase">Créez un nouveau PV de péremption pour commencer.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PeremptionDashboard;


import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit, Printer, ClipboardCheck, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { DCIConfirmation, PharmacyInfo } from '../types';

interface DCIDashboardProps {
  confirmations: DCIConfirmation[];
  pharmacyInfo: PharmacyInfo | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const DCIDashboard: React.FC<DCIDashboardProps> = ({ confirmations, pharmacyInfo, onEdit, onDelete, onCreateNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'dci' | 'remarque'>('dci');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filtered = confirmations.filter(c => 
    c.dci.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.remarque.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (field: 'dci' | 'remarque') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedConfirmations = [...filtered].sort((a, b) => {
    const aValue = a[sortField].toLowerCase();
    const bValue = b[sortField].toLowerCase();
    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const stats = {
    total: confirmations.length,
    ordinaire: confirmations.filter(c => c.remarque === 'ORDONNANCE ORDINAIRE').length,
    souches: confirmations.filter(c => c.remarque === 'ORDONNANCE 03 SOUCHES').length
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour afficher le rapport d'impression.");
      return;
    }

    const sortedConfirmations = [...confirmations].sort((a, b) => 
      a.dci.localeCompare(b.dci)
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Liste des DCI</title>
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
          .col-dci { width: 55%; }
          .col-rem { width: calc(45% - 60px); }
          
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

        <div class="content-title">LISTE DES DCI</div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N°</span></th>
                <th class="col-dci"><span class="th-inner">DCI</span></th>
                <th class="col-rem"><span class="th-inner">REMARQUE</span></th>
              </tr>
            </thead>
            <tbody>
              ${sortedConfirmations.map((c, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-dci">${c.dci}</td>
                  <td class="col-rem">${c.remarque}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="separator-container">
          <div class="gray-line-rounded"></div>
        </div>

        <div class="summary-container">
          <div style="background-color: #e5e7eb; padding: 4px 15px; border-radius: 8px; margin-right: 10px;">${sortedConfirmations.length}</div>
          <div>DCI ENREGISTRÉS</div>
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
    <div className="space-y-6 uppercase">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Liste des DCI</h2>
          <p className="text-slate-500 mt-1">Gérez le répertoire des dénominations communes.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer className="w-5 h-5" />
            Imprimer Liste
          </button>
          <button 
            onClick={onCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
          >
            <Plus className="w-5 h-5" />
            Nouveau DCI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Total DCI</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-500 uppercase">Ordonnance Ordinaire</p>
            <p className="text-2xl font-bold text-slate-800">{stats.ordinaire}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-500 uppercase">Ordonnance 03 Souches</p>
            <p className="text-2xl font-bold text-slate-800">{stats.souches}</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 no-print">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher une DCI ou remarque..."
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
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('dci')}>
                <div className="flex items-center gap-2">
                  DCI
                  {sortField === 'dci' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('remarque')}>
                <div className="flex items-center gap-2">
                  Remarque
                  {sortField === 'remarque' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedConfirmations.length > 0 ? (
              sortedConfirmations.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-800">{item.dci}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${
                      item.remarque === 'ORDONNANCE 03 SOUCHES' 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {item.remarque}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handlePrint()} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Imprimer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => onEdit(item.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Modifier"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-slate-400">
                    <ClipboardCheck className="w-10 h-10" />
                    <p className="text-lg font-bold text-slate-600 uppercase">Aucun DCI enregistré</p>
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

export default DCIDashboard;

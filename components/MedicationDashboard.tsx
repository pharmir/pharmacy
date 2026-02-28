
import React, { useState } from 'react';
import { Search, Plus, Filter, Pill, Trash2, Edit, Printer, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { Medication, PharmacyInfo } from '../types';

interface MedicationDashboardProps {
  medications: Medication[];
  pharmacyInfo: PharmacyInfo | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const MedicationDashboard: React.FC<MedicationDashboardProps> = ({ medications, pharmacyInfo, onEdit, onDelete, onCreateNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'commercialNom' | 'dci' | 'forme' | 'dosage' | 'conditionnement'>('commercialNom');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredMeds = medications.filter(m => 
    m.fullNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.dci.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (field: 'commercialNom' | 'dci' | 'forme' | 'dosage' | 'conditionnement') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedMeds = [...filteredMeds].sort((a, b) => {
    const aValue = a[sortField].toLowerCase();
    const bValue = b[sortField].toLowerCase();
    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour afficher le rapport d'impression.");
      return;
    }

    const sortedMeds = [...medications].sort((a, b) => 
      a.commercialNom.localeCompare(b.commercialNom)
    );

    const now = new Date();
    const displayDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Liste des Médicaments</title>
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
            height: 5cm;
            margin: 1cm 1cm 0 1cm;
            border: 1px solid black;
            border-radius: 8px;
            box-sizing: border-box;
            padding: 15px 25px;
            display: flex;
            flex-direction: column;
          }
          .pharmacy-name {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            flex: 1;
          }
          .details-group {
            font-size: 12pt;
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
          .content-title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin-top: 1cm;
            margin-bottom: 1cm;
          }
          .report-info {
             margin: 0 1cm 0.5cm 1cm;
             font-size: 10pt;
             text-align: right;
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
            padding: 8px 4px;
            margin: 0 0.5mm;
            display: block;
            font-weight: bold;
            font-size: 10pt;
            color: black;
          }
          td {
            border: none;
            padding: 6px 10px;
            text-align: left;
            font-size: 9pt;
            font-weight: bold;
          }
          .col-num { width: 60px; text-align: center; }
          .col-dci { width: 25%; }
          .col-name { width: 35%; }
          .col-forme { width: 60px; text-align: center; }
          .col-dosage { width: 80px; text-align: center; }
          .col-cond { width: 80px; text-align: center; }
          
          .separator-line {
            height: 2mm;
            background-color: #e5e7eb;
            margin: 5px 1cm 0 1cm;
            border-radius: 4px;
          }
          .summary-row {
            margin: 10px 1cm 0 1cm;
            display: flex;
            align-items: center;
            font-weight: bold;
            font-size: 11pt;
          }
          .count-box {
            width: 60px;
            text-align: center;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="pharmacy-name">PHARMACIE ${pharmacyInfo?.name || 'NOM DE LA PHARMACIE'}</div>
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

        <div class="content-title">LISTE DES MEDICAMENTS PSYCHOTROPES</div>
        
        <div class="report-info" dir="rtl">
           GÉNÉRÉ LE <span dir="ltr">${displayDate}</span>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N°</span></th>
                <th class="col-dci"><span class="th-inner">DCI</span></th>
                <th class="col-name"><span class="th-inner">NOM COMMERCIAL</span></th>
                <th class="col-forme"><span class="th-inner">FORME</span></th>
                <th class="col-dosage"><span class="th-inner">DOSAGE</span></th>
                <th class="col-cond"><span class="th-inner">COND</span></th>
              </tr>
            </thead>
            <tbody>
              ${sortedMeds.map((m, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-dci">${m.dci}</td>
                  <td class="col-name">${m.commercialNom}</td>
                  <td class="col-forme">${m.forme}</td>
                  <td class="col-dosage">${m.dosage}</td>
                  <td class="col-cond">${m.conditionnement}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="separator-line"></div>

        <div class="summary-row">
          <div class="count-box">${sortedMeds.length}</div>
          <div style="margin-left: 10px;">Produit(s) à commander</div>
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
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Référentiel Médicaments</h2>
          <p className="text-slate-500 mt-1">Gérez le catalogue des produits pharmaceutiques disponibles.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer className="w-5 h-5" />
            Imprimer Catalogue
          </button>
          <button 
            onClick={onCreateNew}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
          >
            <Plus className="w-5 h-5" />
            Nouveau Médicament
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 lowercase">Total Médicaments</p>
              <p className="text-2xl font-bold text-slate-800">{medications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 lowercase">Formes Uniques</p>
              <p className="text-2xl font-bold text-slate-800">{new Set(medications.map(m => m.forme)).size}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 lowercase">DCI Uniques</p>
              <p className="text-2xl font-bold text-slate-800">{new Set(medications.map(m => m.dci)).size}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 no-print">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Chercher par DCI ou Nom Commercial..."
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
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('commercialNom')}>
                <div className="flex items-center gap-2">
                  Nom Commercial
                  {sortField === 'commercialNom' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('dci')}>
                <div className="flex items-center gap-2">
                  DCI
                  {sortField === 'dci' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('forme')}>
                <div className="flex items-center gap-2">
                  Forme
                  {sortField === 'forme' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('dosage')}>
                <div className="flex items-center gap-2">
                  Dosage
                  {sortField === 'dosage' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('conditionnement')}>
                <div className="flex items-center gap-2">
                  Cond.
                  {sortField === 'conditionnement' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedMeds.length > 0 ? (
              sortedMeds.map((med) => (
                <tr key={med.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block uppercase">{med.commercialNom}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 italic uppercase">
                    {med.dci}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm uppercase">
                    {med.forme}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm uppercase">
                    {med.dosage}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm uppercase">
                    {med.conditionnement}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 transition-opacity">
                      <button 
                        onClick={() => handlePrint()} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Imprimer fiche"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onEdit(med.id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(med.id)}
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
                      <Pill className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-600 uppercase">Aucun médicament trouvé</p>
                      <p className="text-sm uppercase">Enregistrez un nouveau produit dans votre base.</p>
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

export default MedicationDashboard;


import React, { useState } from 'react';
import { Search, Plus, Filter, Truck, Trash2, Edit, Printer, MapPin, Phone, ArrowUp, ArrowDown } from 'lucide-react';
import { Supplier, PharmacyInfo } from '../types';

interface SupplierDashboardProps {
  suppliers: Supplier[];
  pharmacyInfo: PharmacyInfo | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ suppliers, pharmacyInfo, onEdit, onDelete, onCreateNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'address' | 'phone'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (field: 'name' | 'address' | 'phone') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    const aValue = (a[sortField] || '').toLowerCase();
    const bValue = (b[sortField] || '').toLowerCase();
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

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Liste des Fournisseurs</title>
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
          .col-name { width: 40%; }
          .col-addr { width: 35%; }
          .col-phone { width: calc(25% - 60px); }
          
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

        <div class="content-title">LISTE DES FOURNISSEURS</div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N°</span></th>
                <th class="col-name"><span class="th-inner">NOM</span></th>
                <th class="col-addr"><span class="th-inner">ADRESSE</span></th>
                <th class="col-phone"><span class="th-inner">TÉLÉPHONE</span></th>
              </tr>
            </thead>
            <tbody>
              ${sortedSuppliers.map((s, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-name">${s.name}</td>
                  <td class="col-addr">${s.address || '-'}</td>
                  <td class="col-phone">${s.phone || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="separator-container">
          <div class="gray-line-rounded"></div>
        </div>

        <div class="summary-container">
          <div style="background-color: #e5e7eb; padding: 4px 15px; border-radius: 8px; margin-right: 10px;">${sortedSuppliers.length}</div>
          <div>FOURNISSEURS ENREGISTRÉS</div>
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

  const handlePrintSingle = (supplier: Supplier) => {
    // Keep existing single print or update it too? 
    // User asked for "list of suppliers exactly the same in format as the print report in pv inventaire"
    // So handlePrint covers the list. 
    // I'll leave handlePrintSingle as is or maybe just remove it if not used, but it is used in the UI.
    // I'll just leave it as window.print() for now as the request was specific about the list.
    window.print();
  };

  const now = new Date();
  const displayDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Gestion des Fournisseurs</h2>
          <p className="text-slate-500 mt-1">Gérez votre base de données de partenaires logistiques.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer className="w-5 h-5" />
            Imprimer la liste
          </button>
          <button 
            onClick={onCreateNew}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
          >
            <Plus className="w-5 h-5" />
            Nouveau fournisseur
          </button>
        </div>
      </div>

      <div className="print-only mb-8">
        <h1 className="text-2xl font-bold text-slate-900 uppercase">Liste des Fournisseurs Pharmaceutiques</h1>
        <p className="text-slate-500 uppercase">Généré le {displayDate}</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 no-print">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Chercher par nom, adresse ou téléphone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">
                  Fournisseur
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('phone')}>
                <div className="flex items-center gap-2">
                  Coordonnées
                  {sortField === 'phone' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('address')}>
                <div className="flex items-center gap-2">
                  Adresse
                  {sortField === 'address' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-right no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedSuppliers.length > 0 ? (
              sortedSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Truck className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-800">{supplier.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {supplier.phone || 'Non renseigné'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm max-w-xs truncate">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-slate-400 mt-1 shrink-0" />
                      <span>{supplier.address || 'Aucune adresse'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right no-print">
                    <div className="flex items-center justify-end gap-1 transition-opacity">
                      <button 
                        onClick={() => handlePrintSingle(supplier)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Imprimer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onEdit(supplier.id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(supplier.id)}
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
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-slate-400">
                    <div className="bg-slate-100 p-4 rounded-full">
                      <Truck className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-600">Aucun fournisseur trouvé</p>
                      <p className="text-sm">Commencez par enregistrer un nouveau partenaire.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-2 text-slate-400 text-xs no-print">
        <p>Affichage de {filteredSuppliers.length} sur {suppliers.length} fournisseurs</p>
      </div>
    </div>
  );
};

export default SupplierDashboard;

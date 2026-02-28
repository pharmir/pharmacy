
import React, { useState } from 'react';
import { Search, Plus, Filter, MoreHorizontal, FileText, Trash2, Edit, Printer, Package, ArrowUp, ArrowDown } from 'lucide-react';
import { Order, PharmacyInfo } from '../types';

interface OrderDashboardProps {
  orders: Order[];
  pharmacyInfo: PharmacyInfo | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const OrderDashboard: React.FC<OrderDashboardProps> = ({ orders, pharmacyInfo, onEdit, onDelete, onCreateNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'orderNumber' | 'supplier' | 'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (field: 'orderNumber' | 'supplier' | 'date') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handlePrintOrder = (order: Order) => {
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
        <title>Bon de Commande - ${order.orderNumber}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4; margin: 0.5cm; }
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
          .pharmacy-name-header {
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
            margin: 1cm 1cm 0.5cm 1cm;
            background-color: #e5e7eb;
            border-radius: 8px;
            padding: 10px;
          }
          .order-info {
            margin: 0 1cm 0.5cm 1cm;
            font-size: 11pt;
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
            padding: 8px 10px;
            text-align: left;
            font-size: 10pt;
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
            font-size: 11pt;
          }
          .count-box {
            width: 60px;
            text-align: center;
          }
          .signature-section {
            margin-top: 1cm;
            text-align: center;
            font-weight: bold;
          }
          .sig-pharmacy-name {
            font-size: 12pt;
            margin-bottom: 1mm;
          }
          .sig-stamp {
            font-size: 10pt;
            font-style: italic;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="pharmacy-name-header">PHARMACIE ${pharmacyInfo?.name || ''}</div>
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

        <div class="content-title">BON DE COMMANDE</div>

        <div class="order-info">
          <div>N° BC: ${order.orderNumber}</div>
          <div>DATE: ${formatDisplayDate(order.date)}</div>
          <div>FOURNISSEUR: ${order.supplier}</div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N°</span></th>
                <th class="col-med"><span class="th-inner">DÉSIGNATION</span></th>
                <th class="col-qty"><span class="th-inner">QUANTITÉ</span></th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-med">${item.name}</td>
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
          <div class="count-box">${order.items.length}</div>
          <div style="margin-left: 10px;">PRODUITS À COMMANDER</div>
        </div>

        <div class="signature-section">
          <div class="sig-pharmacy-name">${pharmacyInfo?.name || ''}</div>
          <div class="sig-stamp">(Cachet et signature)</div>
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

  const handlePrintList = () => {
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
        <title>LISTE DES COMMANDES</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4; margin: 0.5cm; }
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
            border-bottom: 1px solid #f1f5f9;
          }
          .col-num { width: 40px; text-align: center; }
          .col-ref { width: 15%; font-weight: bold; }
          .col-date { width: 15%; text-align: center; }
          .col-supp { width: 35%; }
          .col-items { width: 10%; text-align: center; }
          .col-status { width: 15%; text-align: center; }
          
          .signature-section {
            margin-top: 1.5cm;
            text-align: center;
            font-weight: bold;
          }
          .sig-pharmacy-name {
            font-size: 12pt;
            margin-bottom: 1mm;
          }
          .sig-stamp {
            font-size: 10pt;
            font-style: italic;
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
            LISTE DES COMMANDES
          </div>
          <div style="font-size: 10pt; margin-top: 5px;">${new Date().toLocaleDateString('fr-FR')}</div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N°</span></th>
                <th class="col-ref"><span class="th-inner">RÉF</span></th>
                <th class="col-date"><span class="th-inner">DATE</span></th>
                <th class="col-supp"><span class="th-inner">FOURNISSEUR</span></th>
                <th class="col-items"><span class="th-inner">ARTICLES</span></th>
                <th class="col-status"><span class="th-inner">STATUT</span></th>
              </tr>
            </thead>
            <tbody>
              ${sortedOrders.map((order, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-ref">${order.orderNumber}</td>
                  <td class="col-date">${formatDisplayDate(order.date)}</td>
                  <td class="col-supp">${order.supplier}</td>
                  <td class="col-items">${order.items.length}</td>
                  <td class="col-status">${order.status === 'Saved' ? 'ENREGISTRÉ' : 'BROUILLON'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="signature-section">
          <div class="sig-pharmacy-name">${pharmacyInfo?.name || 'NOM DE LA PHARMACIE'}</div>
          <div class="sig-stamp">(Cachet et signature)</div>
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

  const uniqueSuppliers = new Set(orders.map(o => o.supplier)).size;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const ordersThisMonth = orders.filter(o => {
    const d = new Date(o.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
  const pendingOrders = orders.filter(o => o.status === 'Draft').length;

  return (
    <div className="space-y-6 uppercase">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Inventaire des Commandes</h2>
          <p className="text-slate-500 mt-1">Gérez vos demandes d'approvisionnement et l'historique.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrintList}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer className="w-5 h-5" />
            Imprimer Liste
          </button>
          <button 
            onClick={onCreateNew}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
          >
            <Plus className="w-5 h-5" />
            Nouvelle commande
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 no-print">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-black text-slate-800">{orders.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Articles</p>
            <p className="text-2xl font-black text-slate-800">{orders.reduce((acc, curr) => acc + curr.items.length, 0)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fournisseurs</p>
            <p className="text-2xl font-black text-slate-800">{uniqueSuppliers}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ce Mois</p>
            <p className="text-2xl font-black text-slate-800">{ordersThisMonth}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brouillons</p>
            <p className="text-2xl font-black text-slate-800 text-amber-600">{pendingOrders}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sync</p>
            <p className="text-sm font-bold text-emerald-600 mt-1">OK</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 no-print">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Chercher par numéro ou fournisseur..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('orderNumber')}>
                <div className="flex items-center gap-2">
                  Réf. Commande
                  {sortField === 'orderNumber' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('supplier')}>
                <div className="flex items-center gap-2">
                  Fournisseur
                  {sortField === 'supplier' && (
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
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedOrders.length > 0 ? (
              sortedOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onDoubleClick={() => onEdit(order.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-800 uppercase">{order.orderNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium uppercase">
                    {order.supplier || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm uppercase text-right" dir="rtl">
                    <span dir="ltr">${formatDisplayDate(order.date)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold uppercase">
                      {order.items.length} meds
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      order.status === 'Saved' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {order.status === 'Saved' ? 'ENREGISTRÉ' : 'BROUILLON'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right no-print">
                    <div className="flex items-center justify-end gap-1 transition-opacity">
                      <button 
                        onClick={() => handlePrintOrder(order)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Imprimer Bon de commande"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onEdit(order.id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(order.id)}
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
                      <Search className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-600 uppercase">Aucune commande trouvée</p>
                      <p className="text-sm uppercase">Commencez par créer votre première demande.</p>
                    </div>
                    <button 
                      onClick={onCreateNew}
                      className="mt-2 text-emerald-600 font-bold hover:underline uppercase no-print"
                    >
                      Nouvelle commande
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-2 text-slate-400 text-xs lowercase no-print">
        <p>Affichage de {filteredOrders.length} sur {orders.length} commandes</p>
      </div>
    </div>
  );
};

export default OrderDashboard;

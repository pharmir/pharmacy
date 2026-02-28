
import React, { useState, useMemo } from 'react';
import { Search, Plus, Printer, FileText, Trash2, Edit, Package, History, Filter, ArrowDownAZ, AlertCircle, CheckCircle } from 'lucide-react';
import { StockInitial, Medication, DCIConfirmation } from '../types';

interface StockInitialDashboardProps {
  stocks: StockInitial[];
  medications: Medication[];
  confirmations: DCIConfirmation[];
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const StockInitialDashboard: React.FC<StockInitialDashboardProps> = ({ stocks, medications, confirmations, onCreateNew, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  // Assuming single stock
  const stock = stocks.length > 0 ? stocks[0] : null;

  const getDciNote = (medName: string) => {
    const med = medications.find(m => m.fullNom === medName);
    if (!med) return '';
    const conf = confirmations.find(c => c.dci.toUpperCase() === med.dci.toUpperCase());
    return conf?.remarque || '';
  };

  const getDci = (medName: string) => {
    const med = medications.find(m => m.fullNom === medName);
    return med ? med.dci : '';
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredItems = useMemo(() => {
    if (!stock) return [];
    let items = stock.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    items.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortConfig.key) {
        case 'name':
          valA = a.name;
          valB = b.name;
          break;
        case 'dci':
          valA = getDci(a.name);
          valB = getDci(b.name);
          break;
        case 'type':
          valA = getDciNote(a.name);
          valB = getDciNote(b.name);
          break;
        case 'quantity':
          valA = a.quantity;
          valB = b.quantity;
          break;
        default:
          return 0;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [stock, searchTerm, sortConfig, medications, confirmations]);

  // Statistics
  const totalItems = stock?.items.length || 0;
  const zeroQuantityItems = stock?.items.filter(i => i.quantity === 0).length || 0;
  const totalQuantity = stock?.items.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <Package className="w-16 h-16 mb-4" />
        <p className="text-xl font-bold uppercase">Aucun stock initial trouvé</p>
        <button 
          onClick={onCreateNew}
          className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase"
        >
          Créer le Stock Initial
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 uppercase">
      <div className="flex items-center justify-between mb-8 no-print">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">Stock Initial</h2>
          <p className="text-slate-500 mt-1 lowercase">Gestion de l'inventaire de départ.</p>
        </div>
        <button 
          onClick={() => onEdit(stock.id)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
        >
          <Edit className="w-5 h-5" />
          Modifier le Stock
        </button>
      </div>

      {/* Statistical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 lowercase">Total Produits</p>
              <p className="text-2xl font-bold text-slate-800">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 lowercase">Produits à 0</p>
              <p className="text-2xl font-bold text-slate-800">{zeroQuantityItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 lowercase">Quantité Totale</p>
              <p className="text-2xl font-bold text-slate-800">{totalQuantity}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 no-print">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Chercher un produit..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {/* Sort buttons removed */}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4 w-16 text-center">#</th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Médicament
                  {sortConfig.key === 'name' && (
                    <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => handleSort('dci')}
              >
                <div className="flex items-center gap-2">
                  DCI
                  {sortConfig.key === 'dci' && (
                    <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-2">
                  Type Ordonnance
                  {sortConfig.key === 'type' && (
                    <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center justify-center gap-2">
                  Quantité Initiale
                  {sortConfig.key === 'quantity' && (
                    <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-center text-slate-400 font-mono text-xs">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {getDci(item.name) || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                      getDciNote(item.name) === 'ORDONNANCE 03 SOUCHES' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getDciNote(item.name) || 'NON DÉFINI'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-mono font-bold text-lg ${item.quantity === 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {item.quantity}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                  Aucun produit trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockInitialDashboard;

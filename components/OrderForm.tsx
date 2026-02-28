
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Save, Printer, ArrowLeft, Loader2, Sparkles, Info, AlertCircle } from 'lucide-react';
import { Order, MedicationItem, MedicationInfo, Supplier, Medication, PharmacyInfo } from '../types';
import { getMedicationInsights } from '../services/geminiService';
import { translations, Language } from '../src/translations';

interface OrderFormProps {
  existingOrder: Order | null;
  orders: Order[];
  suppliers: Supplier[];
  medications: Medication[];
  pharmacyInfo: PharmacyInfo | null;
  onSave: (order: Order) => void;
  onCancel: () => void;
  language: Language;
}

const OrderForm: React.FC<OrderFormProps> = ({ existingOrder, orders, suppliers, medications, pharmacyInfo, onSave, onCancel, language }) => {
  const t = translations[language];
  const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const yearOrders = orders.filter(o => o.orderNumber.includes(`/${year}`));
    const sequences = yearOrders.map(o => {
      const match = o.orderNumber.match(/BC(\d+)\//);
      return match ? parseInt(match[1]) : 0;
    });
    const maxSeq = sequences.length > 0 ? Math.max(...sequences) : 0;
    const nextSeq = maxSeq + 1;
    return `BC${nextSeq.toString().padStart(4, '0')}/${year}`;
  };

  const [order, setOrder] = useState<Order>(
    existingOrder || {
      id: crypto.randomUUID(),
      orderNumber: generateOrderNumber(),
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      items: [{ id: crypto.randomUUID(), name: '', quantity: 1, unit: 'BOITE' }],
      status: 'Draft',
      createdAt: Date.now()
    }
  );

  const [insight, setInsight] = useState<MedicationInfo | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const addItem = () => {
    setOrder({
      ...order,
      items: [...order.items, { id: crypto.randomUUID(), name: '', quantity: 1, unit: 'BOITE' }]
    });
  };

  const removeItem = (id: string) => {
    setOrder({
      ...order,
      items: order.items.filter(item => item.id !== id)
    });
  };

  const updateItem = (index: number, field: keyof MedicationItem, value: any) => {
    const newItems = [...order.items];
    const finalValue = (typeof value === 'string') ? value.toUpperCase() : value;
    newItems[index] = { ...newItems[index], [field]: finalValue };
    setOrder({ ...order, items: newItems });
  };

  const handleFetchInsight = async (name: string, index: number) => {
    if (!name || name.length < 3) return;
    setLoadingInsight(true);
    setActiveItemIndex(index);
    const result = await getMedicationInsights(name);
    setInsight(result);
    setLoadingInsight(false);
  };

  const [isSaved, setIsSaved] = useState(!!existingOrder);

  const handleSave = () => {
    if (!order.orderNumber.trim()) {
      setError(t.errorRequired);
      return;
    }
    if (!order.supplier.trim()) {
      setError(t.errorRequired);
      return;
    }
    if (order.items.length === 0) {
      setError(t.errorRequired);
      return;
    }
    
    const hasEmptyItem = order.items.some(item => !item.name.trim() || !item.quantity || item.quantity <= 0);
    if (hasEmptyItem) {
      setError(t.errorRequired);
      return;
    }

    setError(null);
    onSave(order);
    setIsSaved(true);
  };

  const handlePrint = () => {
    setError(null);

    if (!order.supplier.trim()) {
      setError(t.errorRequired);
      return;
    }

    const hasValidItems = order.items.some(item => item.name.trim() !== '');
    if (!hasValidItems) {
      setError(t.errorNoItems);
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour afficher le rapport d'impression.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>${t.orderForm} - ${order.orderNumber}</title>
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
          <div class="pharmacy-name-header">${t.pharmacy} ${pharmacyInfo?.name || ''}</div>
          <div class="details-grid">
            <div class="details-group left-group">
              <div>${t.address}: ${pharmacyInfo?.address || ''}</div>
              <div>${t.orderNum}: ${pharmacyInfo?.nOrdre || ''}</div>
              <div>${t.agreement}: ${pharmacyInfo?.agreement || ''}</div>
              <div>${t.phone}: ${pharmacyInfo?.tel || ''}</div>
            </div>
            <div class="details-group right-group">
              <div class="right-inner">
                <div>${t.nif}: ${pharmacyInfo?.nif || ''}</div>
                <div>${t.nis}: ${pharmacyInfo?.nis || ''}</div>
                <div>${t.rc}: ${pharmacyInfo?.rc || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="content-title">${t.orderForm}</div>

        <div class="order-info">
          <div>${t.bcNumber}: ${order.orderNumber}</div>
          <div>${t.date}: ${formatDisplayDate(order.date)}</div>
          <div>${t.supplier}: ${order.supplier}</div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N°</span></th>
                <th class="col-med"><span class="th-inner">${t.medication}</span></th>
                <th class="col-qty"><span class="th-inner">${t.quantity}</span></th>
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
          <div style="margin-left: 10px;">${t.productsToOrder}</div>
        </div>

        <div class="signature-section">
          <div class="sig-pharmacy-name">${pharmacyInfo?.name || ''}</div>
          <div class="sig-stamp">(${t.stampAndSignature})</div>
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
            <h2 className="text-2xl font-bold text-slate-800">{existingOrder ? t.editOrder : t.createOrder}</h2>
            <p className="text-slate-500 text-sm">{t.supplyManagement}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button 
            onClick={handlePrint} 
            disabled={!isSaved}
            title={!isSaved ? (language === 'ar' ? "يرجى حفظ الطلب أولاً لتفعيل الطباعة" : "Veuillez enregistrer la commande pour activer l'impression") : ""}
            className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all shadow-sm ${isSaved ? 'scale-110 ring-2 ring-emerald-500 ring-offset-2' : 'opacity-50 cursor-not-allowed'}`}
          >
            <Printer className="w-4 h-4" />{t.print}
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md"><Save className="w-4 h-4" />{t.save}</button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 no-print animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm uppercase">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.orderNumber}</label>
            <input type="text" value={order.orderNumber} onChange={(e) => setOrder({...order, orderNumber: e.target.value.toUpperCase()})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono font-bold" />
          </div>
          <div dir="rtl" style={{ textAlign: 'right' }}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.date}</label>
            <div className="relative">
              <input type="date" value={order.date} onChange={(e) => setOrder({...order, date: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" style={{ direction: 'ltr', textAlign: 'left' }} />
              <div className="mt-1 text-xs text-slate-400">Format: <span dir="ltr">{formatDisplayDate(order.date)}</span></div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.supplier}</label>
            <select value={order.supplier} onChange={(e) => setOrder({...order, supplier: e.target.value.toUpperCase()})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none uppercase">
              <option value="">{t.selectSupplier}</option>
              {suppliers.map(s => <option key={s.id} value={s.name.toUpperCase()}>{s.name.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t.orderLines}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-2 w-16 text-center">#</th>
                  <th className="pb-3 px-2">{t.medication}</th>
                  <th className="pb-3 px-2 w-32 text-center">{t.quantity}</th>
                  <th className="pb-3 px-2 w-24 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.items.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-2 text-center text-slate-400 font-mono text-sm">{index + 1}</td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <input
                          list={`medications-list-${index}`}
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value.toUpperCase())}
                          placeholder={t.chooseProduct}
                          className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 outline-none transition-all py-1 font-bold text-slate-800 uppercase"
                        />
                        <datalist id={`medications-list-${index}`}>
                          {medications.map(m => (
                            <option key={m.id} value={m.fullNom.toUpperCase()} />
                          ))}
                        </datalist>
                        <button onClick={() => handleFetchInsight(item.name, index)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded transition-colors">
                          {loadingInsight && activeItemIndex === index ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} className="w-full text-center bg-transparent border-b border-transparent focus:border-emerald-500 outline-none py-1 font-bold" />
                    </td>
                    <td className="py-4 px-2 text-center">
                      <button onClick={() => removeItem(item.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addItem} className="mt-6 flex items-center gap-2 text-emerald-600 font-semibold"><Plus className="w-5 h-5" />{t.addLine}</button>
        </div>
      </div>

      {insight && !loadingInsight && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 no-print animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-emerald-500 mt-1" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between"><h4 className="font-bold text-emerald-900 text-lg">{insight.name.toUpperCase()}</h4><button onClick={() => setInsight(null)}>✕</button></div>
              <p className="text-sm text-emerald-800 leading-relaxed">{insight.commonUsage.toUpperCase()}</p>
              <div className="p-3 bg-white rounded-lg border border-amber-200 flex gap-3 text-xs italic text-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" /><strong>{t.insightWarning}</strong> {insight.interactionWarning.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderForm;

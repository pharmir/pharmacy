import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  ShoppingCart, Users, Pill, Activity, TrendingUp, TrendingDown, 
  Package, ArrowUpRight, ArrowDownLeft, CheckCircle, AlertCircle, Clock, UserCheck
} from 'lucide-react';
import { Order, Supplier, Medication, InventoryEntry, InventoryExit, StockInitial } from '../types';
import { translations, Language } from '../src/translations';

interface StatsDashboardProps {
  orders: Order[];
  suppliers: Supplier[];
  medications: Medication[];
  entrees: InventoryEntry[];
  sorties: InventoryExit[];
  stocksInitial: StockInitial[];
  language: Language;
  onNavigate: (view: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatsDashboard: React.FC<StatsDashboardProps> = ({
  orders,
  suppliers,
  medications,
  entrees,
  sorties,
  stocksInitial,
  language,
  onNavigate
}) => {
  const t = translations[language];
  
  // --- Statistics Calculations ---

  const calculateTrend = (items: any[], dateKey: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentCount = 0;
    let prevCount = 0;

    items.forEach(item => {
      const date = new Date(item[dateKey] || Date.now());
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        currentCount++;
      } else if (date.getMonth() === prevMonth && date.getFullYear() === prevYear) {
        prevCount++;
      }
    });

    if (prevCount === 0) return currentCount > 0 ? "+100%" : "0%";
    const percent = ((currentCount - prevCount) / prevCount) * 100;
    return `${percent > 0 ? '+' : ''}${percent.toFixed(0)}% vs m-1`;
  };

  const totalOrders = orders.length;
  const ordersTrend = calculateTrend(orders, 'createdAt');

  const totalSuppliers = suppliers.length;
  const activeSuppliersCount = useMemo(() => {
    const supplierNames = new Set(orders.map(o => o.supplier).filter(Boolean));
    return supplierNames.size;
  }, [orders]);

  const totalMedications = medications.length;

  // Calculate total stock volume (simple sum of quantities for now)
  const totalEntrees = entrees.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
  const totalSorties = sorties.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
  const totalInitial = stocksInitial.reduce((acc, curr) => {
    return acc + (curr.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0);
  }, 0);
  
  const currentStockVolume = totalInitial + totalEntrees - totalSorties;

  // --- Chart Data Preparation ---

  // 1. Orders per Month
  const ordersByMonth = useMemo(() => {
    const data: Record<string, number> = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt || Date.now());
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      data[key] = (data[key] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // 2. Inventory Movement (Entrees vs Sorties) per Month
  const inventoryMovement = useMemo(() => {
    const data: Record<string, { name: string, entrees: number, sorties: number }> = {};
    
    entrees.forEach(e => {
      const key = `${e.month}/${e.year}`;
      if (!data[key]) data[key] = { name: key, entrees: 0, sorties: 0 };
      data[key].entrees += Number(e.quantity || 0);
    });

    sorties.forEach(s => {
      const key = `${s.month}/${s.year}`;
      if (!data[key]) data[key] = { name: key, entrees: 0, sorties: 0 };
      data[key].sorties += Number(s.quantity || 0);
    });

    return Object.values(data).sort((a, b) => {
      const [ma, ya] = a.name.split('/').map(Number);
      const [mb, yb] = b.name.split('/').map(Number);
      return (ya - yb) || (ma - mb);
    });
  }, [entrees, sorties]);

  // 3. Top Suppliers (by number of orders)
  const topSuppliers = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      const supplierName = suppliers.find(s => s.id === order.supplier)?.name || order.supplier || t.unknown;
      counts[supplierName] = (counts[supplierName] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [orders, suppliers, t.unknown]);

  // 4. Medication Forms Distribution
  const medForms = useMemo(() => {
    const counts: Record<string, number> = {};
    medications.forEach(med => {
      const form = med.forme || t.other;
      counts[form] = (counts[form] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [medications, t.other]);

  // 5. Orders by Status
  const ordersStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      const status = order.status === 'Draft' ? t.draft : 
                     order.status === 'Saved' ? t.saved : 
                     order.status === 'Processed' ? t.processed : order.status;
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders, t]);

  // 6. Stock Value Evolution (Simulated)
  const stockValueEvolution = useMemo(() => {
    // This is a simulation since we don't have historical snapshots or prices
    // We'll use inventory movement to simulate volume changes over time
    const data: { name: string, value: number }[] = [];
    let cumulative = totalInitial; // Start with initial stock
    
    // Combine all movements
    const movements = [
      ...entrees.map(e => ({ date: new Date(Number(e.year), Number(e.month)-1), change: Number(e.quantity || 0) })),
      ...sorties.map(s => ({ date: new Date(Number(s.year), Number(s.month)-1), change: -Number(s.quantity || 0) }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by month
    const monthlyChanges: Record<string, number> = {};
    movements.forEach(m => {
      const key = `${m.date.getMonth() + 1}/${m.date.getFullYear()}`;
      monthlyChanges[key] = (monthlyChanges[key] || 0) + m.change;
    });

    Object.entries(monthlyChanges).forEach(([name, change]) => {
      cumulative += change;
      data.push({ name, value: Math.max(0, cumulative) });
    });

    // If no data, show at least current state
    if (data.length === 0) {
      const now = new Date();
      data.push({ name: `${now.getMonth() + 1}/${now.getFullYear()}`, value: currentStockVolume });
    }

    return data;
  }, [entrees, sorties, totalInitial, currentStockVolume]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-8 h-8 text-emerald-600" />
          {t.dashboard}
        </h2>
        <div className="text-sm text-slate-500">
          {t.lastUpdate}: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t.totalOrders} 
          value={totalOrders} 
          icon={<ShoppingCart className="w-6 h-6 text-blue-500" />} 
          trend={ordersTrend}
          color="bg-blue-50"
          onDoubleClick={() => onNavigate('orders_dashboard')}
          tooltip={t.doubleClickToOpen}
        />
        <StatCard 
          title={t.suppliers} 
          value={totalSuppliers} 
          icon={<Users className="w-6 h-6 text-purple-500" />} 
          trend={t.referenced}
          color="bg-purple-50"
          onDoubleClick={() => onNavigate('suppliers_dashboard')}
          tooltip={t.doubleClickToOpen}
        />
        <StatCard 
          title={t.activeSuppliers} 
          value={activeSuppliersCount} 
          icon={<UserCheck className="w-6 h-6 text-indigo-500" />} 
          trend={t.active}
          color="bg-indigo-50"
          onDoubleClick={() => onNavigate('suppliers_dashboard')}
          tooltip={t.doubleClickToOpen}
        />
        <StatCard 
          title={t.medications} 
          value={totalMedications} 
          icon={<Pill className="w-6 h-6 text-emerald-500" />} 
          trend={t.referenced}
          color="bg-emerald-50"
          onDoubleClick={() => onNavigate('meds_dashboard')}
          tooltip={t.doubleClickToOpen}
        />
        <StatCard 
          title={t.stockVolume} 
          value={currentStockVolume} 
          icon={<Package className="w-6 h-6 text-amber-500" />} 
          trend={t.units}
          color="bg-amber-50"
          onDoubleClick={() => onNavigate('inventory_dashboard')}
          tooltip={t.doubleClickToOpen}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-400" />
            {t.ordersTrend}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-slate-400" />
            {t.stockMovement}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryMovement}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="entrees" name={t.entries} fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sorties" name={t.exits} fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">{t.topSuppliers}</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSuppliers} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">{t.medForms}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={medForms}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {medForms.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 3 (New Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-slate-400" />
            {t.ordersStatus}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {ordersStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            {t.stockValue}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockValueEvolution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#fef3c7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, color, onDoubleClick, tooltip }: { title: string, value: string | number, icon: React.ReactNode, trend?: string, color: string, onDoubleClick?: () => void, tooltip?: string }) => (
  <div 
    className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md cursor-pointer select-none"
    onDoubleClick={onDoubleClick}
    title={tooltip}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span className="text-slate-400 font-medium">{trend}</span>
      </div>
    )}
  </div>
);

export default StatsDashboard;


import React, { useState, useEffect } from 'react';
import { Layout, Plus, FileText, Settings, Database, Trash2, Printer, Search, Info, Package, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Menu, Truck, Pill, ClipboardCheck, ChevronDown, ChevronUp, Languages, Activity, Cross, Inbox, Send, ClipboardList, LogOut, History, ArrowDownLeft, LayoutDashboard } from 'lucide-react';
import { Order, MedicationItem, Supplier, Medication, DCIConfirmation, PharmacyInfo, InventoryExit, StockInitial, InventoryEntry, Peremption } from './types';
import { translations, Language } from './src/translations';
import OrderForm from './components/OrderForm';
import OrderDashboard from './components/OrderDashboard';
import SupplierForm from './components/SupplierForm';
import SupplierDashboard from './components/SupplierDashboard';
import MedicationForm from './components/MedicationForm';
import MedicationDashboard from './components/MedicationDashboard';
import DCIForm from './components/DCIForm';
import DCIDashboard from './components/DCIDashboard';
import PharmacyForm from './components/PharmacyForm';
import SortiesForm from './components/SortiesForm';
import EntreesForm from './components/EntreesForm';
import StockInitialForm from './components/StockInitialForm';
import StockInitialDashboard from './components/StockInitialDashboard';
import InventoryDashboard from './components/InventoryDashboard';
import PeremptionDashboard from './components/PeremptionDashboard';
import PeremptionForm from './components/PeremptionForm';
import StatsDashboard from './components/StatsDashboard';
import SettingsForm from './components/SettingsForm';
import AboutDashboard from './components/AboutDashboard';
import { dbService, STORES } from './services/db';
import ConfirmationModal from './components/ConfirmationModal';

const playSound = (type: 'click' | 'save', enabled: boolean) => {
  if (!enabled) return;
  const audio = new Audio();
  if (type === 'click') {
    audio.src = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'; // Simple click
  } else {
    audio.src = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'; // Success/Save
  }
  audio.volume = 0.3;
  audio.play().catch(() => {}); // Ignore errors if browser blocks autoplay
};

const NarcoticPillIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M10.5 3a4.5 4.5 0 0 0-4.5 4.5v3a4.5 4.5 0 0 0 4.5 4.5" />
    <path d="M13.5 15a4.5 4.5 0 0 0 4.5-4.5v-3a4.5 4.5 0 0 0-4.5-4.5" />
    <circle cx="12" cy="7" r="0.5" fill="currentColor" />
    <circle cx="12" cy="11" r="0.5" fill="currentColor" />
    <circle cx="10" cy="9" r="0.5" fill="currentColor" />
    <circle cx="14" cy="9" r="0.5" fill="currentColor" />
    <path d="M12 4v2M12 12v2" strokeWidth="1" opacity="0.5" />
  </svg>
);

const PharmacySymbolIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: '1', name: "Global Health Dist.", address: "12 Avenue de l'Hôpital, 75001 Paris", phone: "01 23 45 67 89" },
  { id: '2', name: "MediSource Logistics", address: "88 Rue du Commerce, 69002 Lyon", phone: "04 12 34 56 78" }
];

type AppView = 'stats_dashboard' | 'orders_dashboard' | 'new_order' | 'edit_order' | 
               'suppliers_dashboard' | 'new_supplier' | 'edit_supplier' | 
               'meds_dashboard' | 'new_med' | 'edit_med' |
               'dci_dashboard' | 'new_dci' | 'edit_dci' |
               'inventory_entrees' | 'inventory_sorties' | 'inventory_dashboard' |
               'stock_initial_dashboard' | 'new_stock_initial' | 'edit_stock_initial' |
               'edit_inventory_sortie' | 'edit_inventory_entree' |
               'peremption_dashboard' | 'new_peremption' | 'edit_peremption' |
               'pharmacy_info' | 'settings' | 'about';

const App: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [confirmations, setConfirmations] = useState<DCIConfirmation[]>([]);
  const [pharmacyInfo, setPharmacyInfo] = useState<PharmacyInfo | null>(null);
  const [entrees, setEntrees] = useState<InventoryEntry[]>([]);
  const [sorties, setSorties] = useState<InventoryExit[]>([]);
  const [stocksInitial, setStocksInitial] = useState<StockInitial[]>([]);
  const [peremptions, setPeremptions] = useState<Peremption[]>([]);
  const [language, setLanguage] = useState<Language>('fr');
  const [theme, setTheme] = useState<'light' | 'dark' | 'emerald'>('light');
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeView, setActiveView] = useState<AppView>('stats_dashboard');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentSupplierId, setCurrentSupplierId] = useState<string | null>(null);
  const [currentMedId, setCurrentMedId] = useState<string | null>(null);
  const [currentDCIId, setCurrentDCIId] = useState<string | null>(null);
  const [currentInventoryEntryId, setCurrentInventoryEntryId] = useState<string | null>(null);
  const [currentInventoryExitId, setCurrentInventoryExitId] = useState<string | null>(null);
  const [currentStockInitialId, setCurrentStockInitialId] = useState<string | null>(null);
  const [currentPeremptionId, setCurrentPeremptionId] = useState<string | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDataDropdownOpen, setIsDataDropdownOpen] = useState(false);
  const [isInventoryDropdownOpen, setIsInventoryDropdownOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {} 
  });

  const openConfirmationModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirmationModal = () => {
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };

  const t = translations[language];

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [loadedOrders, loadedSuppliers, loadedMeds, loadedConfirmations, loadedPharmacy, loadedLang, loadedTheme, loadedSounds, loadedReminders, loadedEntrees, loadedSorties, loadedInitial, loadedPeremptions] = await Promise.all([
          dbService.getAll<Order>(STORES.ORDERS),
          dbService.getAll<Supplier>(STORES.SUPPLIERS),
          dbService.getAll<Medication>(STORES.MEDICATIONS),
          dbService.getAll<DCIConfirmation>(STORES.CONFIRMATIONS),
          dbService.getPharmacyInfo(),
          dbService.getSetting<Language>('language'),
          dbService.getSetting<'light' | 'dark' | 'emerald'>('theme'),
          dbService.getSetting<boolean>('soundsEnabled'),
          dbService.getSetting<boolean>('remindersEnabled'),
          dbService.getAll<InventoryEntry>(STORES.ENTREES),
          dbService.getAll<InventoryExit>(STORES.SORTIES),
          dbService.getAll<StockInitial>(STORES.INITIAL),
          dbService.getAll<Peremption>(STORES.PEREMPTIONS)
        ]);

        setOrders(loadedOrders);
        setSuppliers(loadedSuppliers.length > 0 ? loadedSuppliers : DEFAULT_SUPPLIERS);
        setMeds(loadedMeds);
        setConfirmations(loadedConfirmations);
        setPharmacyInfo(loadedPharmacy);
        setEntrees(loadedEntrees);
        setSorties(loadedSorties);
        setPeremptions(loadedPeremptions);
        
        // Ensure at least one StockInitial exists
        if (loadedInitial.length === 0) {
          const defaultStock: StockInitial = {
            id: crypto.randomUUID(),
            docNumber: `SI-${new Date().getFullYear()}-0001`,
            date: new Date().toISOString().split('T')[0],
            items: [],
            createdAt: Date.now()
          };
          await dbService.put(STORES.INITIAL, defaultStock);
          setStocksInitial([defaultStock]);
        } else {
          setStocksInitial(loadedInitial);
        }

        if (loadedLang) setLanguage(loadedLang);
        if (loadedTheme) setTheme(loadedTheme);
        if (loadedSounds !== null) setSoundsEnabled(loadedSounds);
        if (loadedReminders !== null) setRemindersEnabled(loadedReminders);
      } catch (err) {
        console.error("Failed to load database data", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  useEffect(() => {
    // Check for monthly reminder
    if (remindersEnabled) {
      const lastCheck = localStorage.getItem('lastInventoryReminder');
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${today.getMonth()}`;
      
      if (lastCheck !== currentMonth) {
        // It's a new month, show reminder
        openConfirmationModal(
          t.reminders.toUpperCase(),
          t.inventoryReminder,
          () => {
            localStorage.setItem('lastInventoryReminder', currentMonth);
            setActiveView('inventory_dashboard');
          }
        );
      }
    }
  }, [remindersEnabled, language]);

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    await dbService.saveSetting('language', lang);
    setIsLanguageMenuOpen(false);
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'emerald') => {
    setTheme(newTheme);
    await dbService.saveSetting('theme', newTheme);
  };

  const handleSoundsToggle = async (enabled: boolean) => {
    setSoundsEnabled(enabled);
    await dbService.saveSetting('soundsEnabled', enabled);
  };

  const handleRemindersToggle = async (enabled: boolean) => {
    setRemindersEnabled(enabled);
    await dbService.saveSetting('remindersEnabled', enabled);
  };

  const handleExport = async () => {
    try {
      const data = await dbService.exportDatabase();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      a.href = url;
      a.download = `BKP${dd}${mm}${yyyy}.json`;
      a.click();
      URL.revokeObjectURL(url);
      playSound('save', soundsEnabled);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleImport = async () => {
    openConfirmationModal(
      t.importDb.toUpperCase(),
      t.saveDbFirst,
      async () => {
        // First trigger export
        await handleExport();
        
        // Then show file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (!file) return;
          
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const json = event.target?.result as string;
              await dbService.importDatabase(json);
              playSound('save', soundsEnabled);
              alert(t.importSuccess);
              window.location.reload();
            } catch (err) {
              console.error("Import failed", err);
              alert("Import failed. Invalid file format.");
            }
          };
          reader.readAsText(file);
        };
        input.click();
      }
    );
  };

  const handleSaveOrder = async (order: Order) => {
    await dbService.put(STORES.ORDERS, order);
    playSound('save', soundsEnabled);
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === order.id);
      return idx >= 0 ? prev.map(o => o.id === order.id ? order : o) : [...prev, order];
    });
    // Do not close the form, just switch to edit mode so we have the ID
    setCurrentOrderId(order.id);
    setActiveView('edit_order');
  };

  const handleSaveStockInitial = async (stock: StockInitial) => {
    await dbService.put(STORES.INITIAL, stock);
    playSound('save', soundsEnabled);
    setStocksInitial(prev => {
      const idx = prev.findIndex(s => s.id === stock.id);
      return idx >= 0 ? prev.map(s => s.id === stock.id ? stock : s) : [stock];
    });
    setActiveView('stock_initial_dashboard');
  };

  const handleDeleteStockInitial = async (id: string) => {
    openConfirmationModal(
      "SUPPRIMER LE STOCK INITIAL ?",
      "Voulez-vous supprimer ce document ? Cette action affectera les calculs d'inventaire.",
      async () => {
        await dbService.delete(STORES.INITIAL, id);
        setStocksInitial(prev => prev.filter(s => s.id !== id));
      }
    );
  };

  const handleSaveEntrees = async (entries: InventoryEntry[]) => {
    for (const entry of entries) {
      await dbService.put(STORES.ENTREES, entry);
    }
    playSound('save', soundsEnabled);
    setEntrees(prev => {
      let next = [...prev];
      entries.forEach(entry => {
        const idx = next.findIndex(e => e.id === entry.id);
        if (idx >= 0) next[idx] = entry;
        else next.push(entry);
      });
      return next;
    });
    setActiveView('inventory_dashboard');
  };

  const handleDeleteEntree = async (id: string) => {
    openConfirmationModal(
      "SUPPRIMER L'ENTRÉE ?",
      "Cette action est définitive. Voulez-vous vraiment supprimer cette entrée de l'inventaire ?",
      async () => {
        await dbService.delete(STORES.ENTREES, id);
        setEntrees(prev => prev.filter(e => e.id !== id));
      }
    );
  };

  const handleSaveSorties = async (exits: InventoryExit[]) => {
    for (const exit of exits) {
      await dbService.put(STORES.SORTIES, exit);
    }
    playSound('save', soundsEnabled);
    setSorties(prev => {
      let next = [...prev];
      exits.forEach(exit => {
        const idx = next.findIndex(e => e.id === exit.id);
        if (idx >= 0) next[idx] = exit;
        else next.push(exit);
      });
      return next;
    });
    setActiveView('inventory_dashboard');
  };

  const handleDeleteSortie = async (id: string) => {
    openConfirmationModal(
      "SUPPRIMER LA SORTIE ?",
      "Cette action est définitive. Voulez-vous vraiment supprimer cette sortie de l'inventaire ?",
      async () => {
        await dbService.delete(STORES.SORTIES, id);
        setSorties(prev => prev.filter(e => e.id !== id));
      }
    );
  };

  const handleSaveSupplier = async (supplier: Supplier) => {
    await dbService.put(STORES.SUPPLIERS, supplier);
    playSound('save', soundsEnabled);
    setSuppliers(prev => {
      const idx = prev.findIndex(s => s.id === supplier.id);
      return idx >= 0 ? prev.map(s => s.id === supplier.id ? supplier : s) : [...prev, supplier];
    });
    setActiveView('suppliers_dashboard');
  };

  const handleSaveMed = async (med: Medication) => {
    await dbService.put(STORES.MEDICATIONS, med);
    playSound('save', soundsEnabled);
    setMeds(prev => {
      const idx = prev.findIndex(m => m.id === med.id);
      return idx >= 0 ? prev.map(m => m.id === med.id ? med : m) : [...prev, med];
    });

    // Add to StockInitial if not already present
    if (stocksInitial.length > 0) {
      const stock = stocksInitial[0]; // Assuming single stock
      const exists = stock.items.some(item => item.name === med.fullNom);
      
      if (!exists) {
        const newItem: MedicationItem = {
          id: crypto.randomUUID(),
          name: med.fullNom,
          quantity: 0,
          unit: 'BOITE'
        };
        const updatedStock = {
          ...stock,
          items: [...stock.items, newItem]
        };
        await handleSaveStockInitial(updatedStock);
      }
    }

    setActiveView('meds_dashboard');
  };

  const handleSaveDCI = async (dci: DCIConfirmation) => {
    await dbService.put(STORES.CONFIRMATIONS, dci);
    playSound('save', soundsEnabled);
    setConfirmations(prev => {
      const idx = prev.findIndex(c => c.id === dci.id);
      return idx >= 0 ? prev.map(c => c.id === dci.id ? dci : c) : [...prev, dci];
    });
    setActiveView('dci_dashboard');
  };

  const handleSavePharmacy = async (info: PharmacyInfo) => {
    await dbService.savePharmacyInfo(info);
    playSound('save', soundsEnabled);
    setPharmacyInfo(info);
  };

  const handleSavePeremption = async (data: Omit<Peremption, 'id' | 'createdAt'>) => {
    const peremption: Peremption = {
      ...data,
      id: currentPeremptionId || crypto.randomUUID(),
      createdAt: currentPeremptionId ? (peremptions.find(p => p.id === currentPeremptionId)?.createdAt || Date.now()) : Date.now()
    };
    
    await dbService.put(STORES.PEREMPTIONS, peremption);
    playSound('save', soundsEnabled);
    setPeremptions(prev => {
      const idx = prev.findIndex(p => p.id === peremption.id);
      return idx >= 0 ? prev.map(p => p.id === peremption.id ? peremption : p) : [...prev, peremption];
    });

    // Sync with Inventory Exits
    const MONTHS = [
      "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
      "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"
    ];
    const reportDate = new Date(peremption.date);
    const monthName = MONTHS[reportDate.getMonth()];
    const year = reportDate.getFullYear().toString();

    // 1. Find existing exits linked to this peremption report
    const existingExits = sorties.filter(s => s.peremptionId === peremption.id);
    
    // 2. Identify items to add/update and items to remove
    const itemIds = new Set(peremption.items.map(i => i.id));
    
    // Exits to remove (those whose item ID is no longer in the peremption items)
    const exitsToRemove = existingExits.filter(s => s.peremptionItemId && !itemIds.has(s.peremptionItemId));
    
    for (const exit of exitsToRemove) {
      await dbService.delete(STORES.SORTIES, exit.id);
    }

    // Exits to add or update
    const newExits: InventoryExit[] = [];
    for (const item of peremption.items) {
      const existingExit = existingExits.find(s => s.peremptionItemId === item.id);
      
      const exitData: InventoryExit = {
        id: existingExit ? existingExit.id : crypto.randomUUID(),
        date: peremption.date,
        month: monthName,
        year: year,
        drugName: item.medicationName,
        quantity: item.quantity,
        reason: "PÉREMPTION",
        createdAt: existingExit ? existingExit.createdAt : Date.now(),
        peremptionId: peremption.id,
        peremptionItemId: item.id
      };
      
      await dbService.put(STORES.SORTIES, exitData);
      newExits.push(exitData);
    }

    // Update sorties state
    setSorties(prev => {
      // Remove deleted exits
      let next = prev.filter(s => !exitsToRemove.some(r => r.id === s.id));
      // Update/Add new exits
      newExits.forEach(exit => {
        const idx = next.findIndex(s => s.id === exit.id);
        if (idx >= 0) next[idx] = exit;
        else next.push(exit);
      });
      return next;
    });

    setActiveView('peremption_dashboard');
  };

  const handleDeletePeremption = async (id: string) => {
    openConfirmationModal(
      "SUPPRIMER LE PV ?",
      "Voulez-vous vraiment supprimer ce PV de péremption ?",
      async () => {
        await dbService.delete(STORES.PEREMPTIONS, id);
        setPeremptions(prev => prev.filter(p => p.id !== id));
        
        // Delete associated inventory exits
        const associatedExits = sorties.filter(s => s.peremptionId === id);
        for (const exit of associatedExits) {
          await dbService.delete(STORES.SORTIES, exit.id);
        }
        setSorties(prev => prev.filter(s => s.peremptionId !== id));
      }
    );
  };

  const handleDeleteOrder = async (id: string) => {
    openConfirmationModal(
      "SUPPRIMER LA COMMANDE ?",
      "Voulez-vous vraiment supprimer cette commande ?",
      async () => {
        await dbService.delete(STORES.ORDERS, id);
        setOrders(orders.filter(o => o.id !== id));
      }
    );
  };

  const handleDeleteSupplier = async (id: string) => {
    openConfirmationModal(
      "SUPPRIMER LE FOURNISSEUR ?",
      "Voulez-vous vraiment supprimer ce fournisseur ?",
      async () => {
        await dbService.delete(STORES.SUPPLIERS, id);
        setSuppliers(prev => prev.filter(s => s.id !== id));
      }
    );
  };

  const handleDeleteMed = async (id: string) => {
    openConfirmationModal(
      "SUPPRIMER LE MÉDICAMENT ?",
      "Voulez-vous vraiment supprimer ce médicament ?",
      async () => {
        await dbService.delete(STORES.MEDICATIONS, id);
        setMeds(prev => prev.filter(m => m.id !== id));
      }
    );
  };

  const handleDeleteDCI = async (id: string) => {
    openConfirmationModal(
      "SUPPRIMER LE DCI ?",
      "Voulez-vous vraiment supprimer ce DCI ?",
      async () => {
        await dbService.delete(STORES.CONFIRMATIONS, id);
        setConfirmations(prev => prev.filter(c => c.id !== id));
      }
    );
  };

  const isDataActive = activeView.includes('supplier') || activeView.includes('med') || activeView.includes('dci') || activeView === 'pharmacy_info';
  const isInventoryActive = activeView.includes('inventory') || activeView.includes('stock_initial');

  const curOrder = orders.find(o => o.id === currentOrderId);
  const curSupplier = suppliers.find(s => s.id === currentSupplierId);
  const curMed = meds.find(m => m.id === currentMedId);
  const curDCI = confirmations.find(c => c.id === currentDCIId);
  const curInventoryEntry = entrees.find(e => e.id === currentInventoryEntryId);
  const curInventoryExit = sorties.find(s => s.id === currentInventoryExitId);
  const curStockInitial = stocksInitial.find(s => s.id === currentStockInitialId);

  const SidebarButton = ({ 
    icon: Icon, 
    label, 
    active, 
    onClick, 
    collapsed, 
    hasSubmenu = false, 
    isOpen = false, 
    isSubmenuItem = false 
  }: any) => (
    <button 
      onClick={(e) => { onClick(e); playSound('click', soundsEnabled); }}
      className={`group relative w-full flex items-center ${isSubmenuItem ? 'justify-start' : 'justify-between'} gap-2 px-3 py-2 rounded-lg transition-colors ${active ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'hover:bg-slate-800 text-slate-400'}`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`${isSubmenuItem ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />
        {!collapsed && <span className="text-sm">{label}</span>}
      </div>
      {!collapsed && hasSubmenu && (
        isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      )}
      
      {collapsed && (
        <div className={`absolute ${language === 'ar' ? 'right-full mr-2' : 'left-full ml-2'} top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[70] shadow-lg border border-slate-700 transition-opacity`}>
          {label}
        </div>
      )}
    </button>
  );

  return (
    <div 
      className={`min-h-screen flex font-sans uppercase transition-all duration-300 ${theme === 'dark' ? 'bg-slate-950' : theme === 'emerald' ? 'bg-emerald-50' : 'bg-slate-50'} ${language === 'ar' ? 'flex-row-reverse' : ''}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <aside className={`${theme === 'dark' ? 'bg-black' : 'bg-slate-900'} text-slate-300 flex-shrink-0 fixed h-full no-print transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} z-[60] ${language === 'ar' ? 'right-0' : 'left-0'}`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <NarcoticPillIcon className="w-8 h-8 text-emerald-500" />
              <h1 className="text-xl font-bold text-white tracking-tighter">{t.appTitle}</h1>
            </div>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-slate-800 rounded-lg"><Menu className="w-6 h-6" /></button>
        </div>
        <nav className={`p-4 flex flex-col h-[calc(100%-72px)] ${isSidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto custom-scrollbar'}`}>
          <div className="flex-1 space-y-2">
            <SidebarButton 
              icon={LayoutDashboard}
              label={t.dashboard}
              active={activeView === 'stats_dashboard'}
              onClick={() => setActiveView('stats_dashboard')}
              collapsed={isSidebarCollapsed}
            />

            <SidebarButton 
              icon={Database}
              label={t.orders}
              active={activeView.includes('order')}
              onClick={() => setActiveView('orders_dashboard')}
              collapsed={isSidebarCollapsed}
            />

            <div className="space-y-1">
              <SidebarButton 
                icon={Package}
                label={t.inventoryPsycho}
                active={isInventoryActive && !isInventoryDropdownOpen}
                onClick={() => setIsInventoryDropdownOpen(!isInventoryDropdownOpen)}
                collapsed={isSidebarCollapsed}
                hasSubmenu={true}
                isOpen={isInventoryDropdownOpen}
              />

              {isInventoryDropdownOpen && !isSidebarCollapsed && (
                <div className={`${language === 'ar' ? 'pr-6' : 'pl-6'} space-y-1 animate-in slide-in-from-top-2 duration-200`}>
                  <button 
                    onClick={() => { setCurrentStockInitialId(null); setActiveView('stock_initial_dashboard'); playSound('click', soundsEnabled); }} 
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${activeView.includes('stock_initial') ? 'text-emerald-400 font-bold bg-white/5' : 'hover:bg-slate-800 text-slate-400'}`}
                  >
                    <History className="w-3.5 h-3.5 shrink-0" />
                    {t.stockInitial}
                  </button>
                  <button 
                    onClick={() => { setCurrentInventoryEntryId(null); setActiveView('inventory_entrees'); playSound('click', soundsEnabled); }} 
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${activeView.includes('inventory_entrees') ? 'text-emerald-400 font-bold bg-white/5' : 'hover:bg-slate-800 text-slate-400'}`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                    {t.entrees}
                  </button>
                  <button 
                    onClick={() => { setCurrentInventoryExitId(null); setActiveView('inventory_sorties'); playSound('click', soundsEnabled); }} 
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${activeView === 'inventory_sorties' ? 'text-emerald-400 font-bold bg-white/5' : 'hover:bg-slate-800 text-slate-400'}`}
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    {t.sorties}
                  </button>
                  <button 
                    onClick={() => { setCurrentPeremptionId(null); setActiveView('peremption_dashboard'); playSound('click', soundsEnabled); }} 
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${activeView.includes('peremption') ? 'text-emerald-400 font-bold bg-white/5' : 'hover:bg-slate-800 text-slate-400'}`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    PV Péremption
                  </button>
                  <button 
                    onClick={() => { setActiveView('inventory_dashboard'); playSound('click', soundsEnabled); }} 
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${activeView === 'inventory_dashboard' ? 'text-emerald-400 font-bold bg-white/5' : 'hover:bg-slate-800 text-slate-400'}`}
                  >
                    <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                    {t.inventaire}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <SidebarButton 
                icon={Layout}
                label={t.data}
                active={isDataActive && !isDataDropdownOpen}
                onClick={() => setIsDataDropdownOpen(!isDataDropdownOpen)}
                collapsed={isSidebarCollapsed}
                hasSubmenu={true}
                isOpen={isDataDropdownOpen}
              />

              {isDataDropdownOpen && !isSidebarCollapsed && (
                <div className={`${language === 'ar' ? 'pr-6' : 'pl-6'} space-y-1 animate-in slide-in-from-top-2 duration-200`}>
                  <button onClick={() => { setActiveView('dci_dashboard'); playSound('click', soundsEnabled); }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${activeView.includes('dci') ? 'text-emerald-400 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}><ClipboardCheck className="w-3.5 h-3.5 shrink-0" />{t.dci}</button>
                  <button onClick={() => { setActiveView('meds_dashboard'); playSound('click', soundsEnabled); }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${activeView.includes('med') ? 'text-emerald-400 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}><Pill className="w-3.5 h-3.5 shrink-0" />{t.drug}</button>
                  <button onClick={() => { setActiveView('suppliers_dashboard'); playSound('click', soundsEnabled); }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${activeView.includes('supplier') ? 'text-emerald-400 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}><Truck className="w-3.5 h-3.5 shrink-0" />{t.supplier}</button>
                  <button onClick={() => { setActiveView('pharmacy_info'); playSound('click', soundsEnabled); }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${activeView === 'pharmacy_info' ? 'text-emerald-400 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}><PharmacySymbolIcon className="w-3.5 h-3.5 shrink-0 text-emerald-500" />{t.pharmacy}</button>
                </div>
              )}
            </div>

            <div className="pt-4 mt-auto border-t border-slate-800 relative space-y-2">
              {!isSidebarCollapsed && <div className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-4">{t.quickActions}</div>}
              
              <SidebarButton 
                icon={Plus}
                label={t.newOrder}
                onClick={() => { setCurrentOrderId(null); setActiveView('new_order'); }}
                collapsed={isSidebarCollapsed}
              />

              <SidebarButton 
                icon={PharmacySymbolIcon}
                label={(t as any).myPharmacy}
                onClick={() => setActiveView('pharmacy_info')}
                collapsed={isSidebarCollapsed}
              />
              <SidebarButton 
                icon={Settings}
                label={t.settings}
                active={activeView === 'settings'}
                onClick={() => setActiveView('settings')}
                collapsed={isSidebarCollapsed}
              />
              <SidebarButton 
                icon={Info}
                label="A PROPOS"
                active={activeView === 'about'}
                onClick={() => setActiveView('about')}
                collapsed={isSidebarCollapsed}
              />
            </div>
          </div>
        </nav>
      </aside>
      <main className={`flex-1 p-8 transition-all duration-300 ${isSidebarCollapsed ? (language === 'ar' ? 'mr-20' : 'ml-20') : (language === 'ar' ? 'mr-64' : 'ml-64')}`}>
        {activeView === 'stats_dashboard' && (
          <StatsDashboard 
            orders={orders} 
            suppliers={suppliers} 
            medications={meds} 
            entrees={entrees} 
            sorties={sorties} 
            stocksInitial={stocksInitial} 
            language={language}
            onNavigate={(view) => setActiveView(view as AppView)}
          />
        )}
        {activeView === 'orders_dashboard' && <OrderDashboard orders={orders} pharmacyInfo={pharmacyInfo} onEdit={(id) => { setCurrentOrderId(id); setActiveView('edit_order'); }} onDelete={handleDeleteOrder} onCreateNew={() => { setCurrentOrderId(null); setActiveView('new_order'); }} />}
        {(activeView === 'new_order' || activeView === 'edit_order') && <OrderForm existingOrder={curOrder || null} orders={orders} suppliers={suppliers} medications={meds} pharmacyInfo={pharmacyInfo} onSave={handleSaveOrder} onCancel={() => setActiveView('orders_dashboard')} language={language} />}
        
        {(activeView === 'inventory_entrees' || activeView === 'edit_inventory_entree') && (
          <EntreesForm 
            existingEntry={curInventoryEntry} 
            allEntrees={entrees} 
            orders={orders}
            suppliers={suppliers} 
            medications={meds} 
            pharmacyInfo={pharmacyInfo} 
            onSave={handleSaveEntrees} 
            onDelete={handleDeleteEntree} 
            onCancel={() => setActiveView('inventory_dashboard')} 
          />
        )}

        {(activeView === 'inventory_sorties' || activeView === 'edit_inventory_sortie') && (
          <SortiesForm 
            existingExit={curInventoryExit} 
            allSorties={sorties}
            medications={meds} 
            pharmacyInfo={pharmacyInfo}
            onSave={handleSaveSorties} 
            onDelete={handleDeleteSortie}
            onCancel={() => setActiveView('inventory_dashboard')} 
          />
        )}

        {activeView === 'peremption_dashboard' && (
          <PeremptionDashboard 
            peremptions={peremptions}
            pharmacyInfo={pharmacyInfo}
            onEdit={(id) => { setCurrentPeremptionId(id); setActiveView('edit_peremption'); }}
            onDelete={handleDeletePeremption}
            onCreateNew={() => { setCurrentPeremptionId(null); setActiveView('new_peremption'); }}
          />
        )}

        {(activeView === 'new_peremption' || activeView === 'edit_peremption') && (
          <PeremptionForm
            initialData={peremptions.find(p => p.id === currentPeremptionId)}
            existingReports={peremptions}
            medications={meds}
            suppliers={suppliers}
            pharmacyInfo={pharmacyInfo}
            onSave={handleSavePeremption}
            onCancel={() => setActiveView('peremption_dashboard')}
          />
        )}

        {activeView === 'inventory_dashboard' && (
          <InventoryDashboard 
            entrees={entrees}
            sorties={sorties} 
            stocksInitial={stocksInitial} 
            medications={meds} 
            pharmacyInfo={pharmacyInfo} 
            onEditEntree={(id) => { setCurrentInventoryEntryId(id); setActiveView('edit_inventory_entree'); }}
            onDeleteEntree={handleDeleteEntree}
            onEditSortie={(id) => { setCurrentInventoryExitId(id); setActiveView('edit_inventory_sortie'); }} 
            onDeleteSortie={handleDeleteSortie} 
          />
        )}
        
        {activeView === 'suppliers_dashboard' && <SupplierDashboard suppliers={suppliers} pharmacyInfo={pharmacyInfo} onEdit={(id) => { setCurrentSupplierId(id); setActiveView('edit_supplier'); }} onDelete={handleDeleteSupplier} onCreateNew={() => { setCurrentSupplierId(null); setActiveView('new_supplier'); }} />}
        {(activeView === 'new_supplier' || activeView === 'edit_supplier') && <SupplierForm existingSupplier={curSupplier} pharmacyInfo={pharmacyInfo} onSave={handleSaveSupplier} onCancel={() => setActiveView('suppliers_dashboard')} language={language} />}

        {activeView === 'meds_dashboard' && <MedicationDashboard medications={meds} pharmacyInfo={pharmacyInfo} onEdit={(id) => { setCurrentMedId(id); setActiveView('edit_med'); }} onDelete={handleDeleteMed} onCreateNew={() => { setCurrentMedId(null); setActiveView('new_med'); }} />}
        {(activeView === 'new_med' || activeView === 'edit_med') && <MedicationForm existingMedication={curMed} medications={meds} confirmations={confirmations} pharmacyInfo={pharmacyInfo} onSave={handleSaveMed} onCancel={() => setActiveView('meds_dashboard')} language={language} />}

        {activeView === 'dci_dashboard' && <DCIDashboard confirmations={confirmations} pharmacyInfo={pharmacyInfo} onEdit={(id) => { setCurrentDCIId(id); setActiveView('edit_dci'); }} onDelete={handleDeleteDCI} onCreateNew={() => { setCurrentDCIId(null); setActiveView('new_dci'); }} />}
        {(activeView === 'new_dci' || activeView === 'edit_dci') && <DCIForm existingConfirmation={curDCI} confirmations={confirmations} pharmacyInfo={pharmacyInfo} onSave={handleSaveDCI} onCancel={() => setActiveView('dci_dashboard')} />}

        {activeView === 'pharmacy_info' && <PharmacyForm existingInfo={pharmacyInfo} onSave={handleSavePharmacy} onCancel={() => setActiveView('orders_dashboard')} language={language} />}

        {activeView === 'stock_initial_dashboard' && <StockInitialDashboard stocks={stocksInitial} medications={meds} confirmations={confirmations} onCreateNew={() => { setCurrentStockInitialId(null); setActiveView('new_stock_initial'); }} onEdit={(id) => { setCurrentStockInitialId(id); setActiveView('edit_stock_initial'); }} onDelete={handleDeleteStockInitial} />}
        {(activeView === 'new_stock_initial' || activeView === 'edit_stock_initial') && <StockInitialForm existingStock={curStockInitial} allStocks={stocksInitial} medications={meds} pharmacyInfo={pharmacyInfo} onSave={handleSaveStockInitial} onCancel={() => setActiveView('stock_initial_dashboard')} />}

        {activeView === 'settings' && (
          <SettingsForm
            language={language}
            onLanguageChange={handleLanguageChange}
            theme={theme}
            onThemeChange={handleThemeChange}
            soundsEnabled={soundsEnabled}
            onSoundsToggle={handleSoundsToggle}
            remindersEnabled={remindersEnabled}
            onRemindersToggle={handleRemindersToggle}
            onExport={handleExport}
            onImport={handleImport}
          />
        )}
        {activeView === 'about' && <AboutDashboard />}
      </main>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};

export default App;

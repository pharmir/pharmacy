
export interface MedicationItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Medication {
  id: string;
  dci: string;
  commercialNom: string;
  forme: string;
  dosage: string;
  conditionnement: string;
  fullNom: string;
}

export interface DCIConfirmation {
  id: string;
  dci: string;
  remarque: 'ORDONNANCE ORDINAIRE' | 'ORDONNANCE 03 SOUCHES';
}

export interface PharmacyInfo {
  name: string;
  address: string;
  nOrdre: string;
  agreement: string;
  nif: string;
  nis: string;
  rc: string;
  tel: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  supplier: string;
  items: MedicationItem[];
  status: 'Draft' | 'Saved' | 'Processed';
  createdAt: number;
}

export interface StockInitial {
  id: string;
  docNumber: string;
  date: string;
  items: MedicationItem[];
  createdAt: number;
}

export interface InventoryEntry {
  id: string;
  year: string;
  month: string;
  supplier: string;
  drugName: string;
  quantity: number;
  date: string;
  createdAt: number;
  orderId?: string;
}

export interface InventoryExit {
  id: string;
  year: string;
  month: string;
  drugName: string;
  quantity: number;
  reason: string;
  date: string;
  createdAt: number;
  peremptionId?: string;
  peremptionItemId?: string;
}

export interface PeremptionItem {
  id: string;
  medicationName: string;
  dci: string;
  supplier: string;
  lotNumber: string;
  expiryDate: string; // MM/YYYY
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  observation: string;
}

export interface Peremption {
  id: string;
  reportNumber: string;
  date: string; // YYYY-MM-DD
  items: PeremptionItem[];
  createdAt: number;
}

export interface MedicationInfo {
  name: string;
  classification: string;
  commonUsage: string;
  sideEffects: string[];
  interactionWarning: string;
}

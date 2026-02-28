
import { Order, Supplier, Medication, DCIConfirmation, PharmacyInfo, InventoryEntry, InventoryExit, StockInitial } from '../types';

const DB_NAME = 'PharmaPsyDB';
const DB_VERSION = 3; // Incremented for Stock Initial store

export const STORES = {
  ORDERS: 'orders',
  SUPPLIERS: 'suppliers',
  MEDICATIONS: 'medications',
  CONFIRMATIONS: 'confirmations',
  PHARMACY: 'pharmacy',
  SETTINGS: 'settings',
  ENTREES: 'inventory_entrees',
  SORTIES: 'inventory_sorties',
  INITIAL: 'inventory_initial',
  PEREMPTIONS: 'inventory_peremptions'
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION + 1);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.ORDERS)) db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.SUPPLIERS)) db.createObjectStore(STORES.SUPPLIERS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.MEDICATIONS)) db.createObjectStore(STORES.MEDICATIONS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.CONFIRMATIONS)) db.createObjectStore(STORES.CONFIRMATIONS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.PHARMACY)) db.createObjectStore(STORES.PHARMACY, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(STORES.ENTREES)) db.createObjectStore(STORES.ENTREES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.SORTIES)) db.createObjectStore(STORES.SORTIES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.INITIAL)) db.createObjectStore(STORES.INITIAL, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.PEREMPTIONS)) db.createObjectStore(STORES.PEREMPTIONS, { keyPath: 'id' });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const dbService = {
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName: string, id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getPharmacyInfo(): Promise<PharmacyInfo | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.PHARMACY, 'readonly');
      const store = transaction.objectStore(STORES.PHARMACY);
      const request = store.get('main');
      request.onsuccess = () => resolve(request.result ? request.result.data : null);
      request.onerror = () => reject(request.error);
    });
  },

  async savePharmacyInfo(info: PharmacyInfo): Promise<void> {
    return this.put(STORES.PHARMACY, { key: 'main', data: info });
  },

  async getSetting<T>(key: string): Promise<T | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SETTINGS, 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  },

  async saveSetting(key: string, value: any): Promise<void> {
    return this.put(STORES.SETTINGS, { key, value });
  },

  async exportDatabase(): Promise<string> {
    const db = await openDB();
    const exportData: any = {};
    
    const storeNames = Array.from(db.objectStoreNames);
    for (const storeName of storeNames) {
      exportData[storeName] = await this.getAll(storeName);
    }
    
    return JSON.stringify(exportData);
  },

  async importDatabase(jsonString: string): Promise<void> {
    const db = await openDB();
    const importData = JSON.parse(jsonString);
    
    for (const storeName in importData) {
      if (db.objectStoreNames.contains(storeName)) {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Clear existing data
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        
        // Add imported data
        for (const item of importData[storeName]) {
          await new Promise<void>((resolve, reject) => {
            const request = store.put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }
    }
  }
};

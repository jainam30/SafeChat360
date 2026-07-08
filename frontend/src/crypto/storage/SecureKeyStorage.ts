export class SecureKeyStorage {
    private dbName = 'SafeChat360_CryptoStorage';
    private storeName = 'private_keys';
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(new Error('Failed to open IndexedDB for crypto storage.'));
            
            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    async storeKey(id: string, key: CryptoKey): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // Storing the CryptoKey directly in IndexedDB.
            // Modern browsers securely store non-extractable CryptoKeys here.
            const request = store.put(key, id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error(`Failed to store key: ${id}`));
        });
    }

    async getKey(id: string): Promise<CryptoKey | null> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = (event) => {
                const key = (event.target as IDBRequest).result as CryptoKey | undefined;
                resolve(key || null);
            };
            request.onerror = () => reject(new Error(`Failed to retrieve key: ${id}`));
        });
    }

    async removeKey(id: string): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error(`Failed to delete key: ${id}`));
        });
    }

    async clearAll(): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to clear keys'));
        });
    }
}

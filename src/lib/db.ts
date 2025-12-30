import { Tournament } from '@/types/tournament';

const DB_NAME = 'BoulePro';
const DB_VERSION = 1;
const STORE_NAME = 'tournaments';

class TournamentDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  async getAllTournaments(): Promise<Tournament[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const tournaments = request.result as Tournament[];
        // Sort by most recent first
        tournaments.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        resolve(tournaments);
      };
    });
  }

  async getTournament(id: string): Promise<Tournament | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async saveTournament(tournament: Tournament): Promise<void> {
    if (!this.db) await this.init();

    tournament.updatedAt = Date.now();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(tournament);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteTournament(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async exportData(): Promise<string> {
    const tournaments = await this.getAllTournaments();
    return JSON.stringify({ tournaments, version: DB_VERSION, exportedAt: Date.now() }, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      if (!data.tournaments || !Array.isArray(data.tournaments)) {
        throw new Error('Invalid data format');
      }

      for (const tournament of data.tournaments) {
        await this.saveTournament(tournament);
      }
    } catch (error) {
      throw new Error('Failed to import data: ' + (error as Error).message);
    }
  }
}

export const tournamentDB = new TournamentDB();

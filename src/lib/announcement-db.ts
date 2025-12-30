import { Announcement } from '@/types/announcement';

const DB_NAME = 'BoulePro';
const DB_VERSION = 2; // Upgraded version
const STORE_NAME = 'announcements';
const READ_STORE_NAME = 'readAnnouncements';

class AnnouncementDB {
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

        // Create announcements store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
        }

        // Create read announcements store
        if (!db.objectStoreNames.contains(READ_STORE_NAME)) {
          db.createObjectStore(READ_STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const announcements = request.result as Announcement[];
        // Sort by newest first
        announcements.sort((a, b) => b.createdAt - a.createdAt);
        resolve(announcements);
      };
    });
  }

  async createAnnouncement(announcement: Announcement): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(announcement);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async markAsRead(announcementId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(READ_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(READ_STORE_NAME);
      const request = store.put({ id: announcementId, readAt: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async isRead(announcementId: string): Promise<boolean> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(READ_STORE_NAME, 'readonly');
      const store = transaction.objectStore(READ_STORE_NAME);
      const request = store.get(announcementId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(!!request.result);
    });
  }

  async getUnreadCount(): Promise<number> {
    const announcements = await this.getAllAnnouncements();
    let unreadCount = 0;

    for (const announcement of announcements) {
      const isRead = await this.isRead(announcement.id);
      if (!isRead) unreadCount++;
    }

    return unreadCount;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const announcementDB = new AnnouncementDB();

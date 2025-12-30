import { Announcement } from '@/types/announcement';

export const announcementAPI = {
  async getAllAnnouncements(): Promise<Announcement[]> {
    const response = await fetch('/api/announcements');
    if (!response.ok) throw new Error('Failed to load announcements');
    return response.json();
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>): Promise<Announcement> {
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcement),
    });
    if (!response.ok) throw new Error('Failed to create announcement');
    return response.json();
  },

  async markAsRead(announcementId: string, userId: string = 'user'): Promise<void> {
    const response = await fetch('/api/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: announcementId, userId }),
    });
    if (!response.ok) throw new Error('Failed to mark as read');
  },

  async isRead(announcementId: string, userId: string = 'user'): Promise<boolean> {
    const announcements = await this.getAllAnnouncements();
    const announcement = announcements.find(a => a.id === announcementId);
    if (!announcement) return false;
    return announcement.readBy.includes(userId);
  },

  async getUnreadCount(userId: string = 'user'): Promise<number> {
    const announcements = await this.getAllAnnouncements();
    return announcements.filter(a => !a.readBy.includes(userId)).length;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const response = await fetch(`/api/announcements?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete announcement');
  },
};

export interface Announcement {
  id: string;
  title: string;
  message: string;
  tournamentId?: string; // Om meddelandet är för en specifik turnering
  tournamentName?: string;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: number;
  readBy: string[]; // Lista av användare som läst (för framtida multi-user)
}

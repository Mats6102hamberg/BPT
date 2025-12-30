'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { announcementAPI } from '@/lib/announcement-api';
import { Announcement } from '@/types/announcement';
import { useTournamentStore } from '@/stores/tournament-store';

export default function TavlingsledningenPage() {
  const router = useRouter();
  const { tournaments, loadTournaments } = useTournamentStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    tournamentId: '',
    priority: 'normal' as 'normal' | 'important' | 'urgent',
  });

  // PIN-kod för tävlingsledningen (kan ändras efter behov)
  const ADMIN_PIN = '1234';

  useEffect(() => {
    loadData();
    loadTournaments();
  }, [loadTournaments]);

  const loadData = async () => {
    const data = await announcementAPI.getAllAnnouncements();
    setAnnouncements(data);

    // Mark all as read when viewing
    for (const announcement of data) {
      await announcementAPI.markAsRead(announcement.id);
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setIsAdminMode(true);
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Fel PIN-kod. Endast tävlingsledningen har tillgång.');
      setPinInput('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
  };

  const handleAdminButtonClick = () => {
    if (isAdminMode) {
      handleAdminLogout();
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) return;

    const tournament = tournaments.find(t => t.id === newAnnouncement.tournamentId);

    await announcementAPI.createAnnouncement({
      title: newAnnouncement.title.trim(),
      message: newAnnouncement.message.trim(),
      tournamentId: newAnnouncement.tournamentId || undefined,
      tournamentName: tournament?.name,
      priority: newAnnouncement.priority,
    });

    await loadData();

    setNewAnnouncement({
      title: '',
      message: '',
      tournamentId: '',
      priority: 'normal',
    });
    setIsCreateModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Är du säker på att du vill radera detta meddelande?')) {
      await announcementAPI.deleteAnnouncement(id);
      await loadData();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'from-red-500 to-red-600';
      case 'important':
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { text: '🚨 BRÅDSKANDE', color: 'bg-red-100 text-red-800 border-red-300' };
      case 'important':
        return { text: '⚠️ VIKTIGT', color: 'bg-orange-100 text-orange-800 border-orange-300' };
      default:
        return { text: '📢 INFO', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-600 to-emerald-500">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-white/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                🚨 Tävlingsledningen
              </h1>
              <p className="text-slate-600 mt-2">
                Viktig information från tävlingsledningen
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleAdminButtonClick}
                variant={isAdminMode ? 'danger' : 'secondary'}
              >
                {isAdminMode ? '👁️ Visa meddelanden' : '🔐 Tävlingsledning'}
              </Button>
              <Button onClick={() => router.push('/')}>← Tillbaka</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Admin Mode */}
        {isAdminMode ? (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300">
              <CardHeader>
                <CardTitle className="text-red-800">⚙️ Admin-panel</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="danger"
                  size="lg"
                  className="w-full"
                >
                  ➕ Skapa nytt meddelande
                </Button>
              </CardContent>
            </Card>

            {/* Existing Announcements in Admin */}
            <Card>
              <CardHeader>
                <CardTitle>Publicerade meddelanden ({announcements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <div className="text-center py-12 text-slate-600">
                    Inga meddelanden publicerade ännu
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement) => {
                      const badge = getPriorityBadge(announcement.priority);
                      return (
                        <div
                          key={announcement.id}
                          className="p-4 border border-slate-200 rounded-xl bg-white"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex gap-3 items-center mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                                  {badge.text}
                                </span>
                                {announcement.tournamentName && (
                                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                                    📌 {announcement.tournamentName}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-slate-800">{announcement.title}</h3>
                              <p className="text-sm text-slate-600 mt-1">
                                {new Date(announcement.createdAt).toLocaleString('sv-SE')}
                              </p>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(announcement.id)}
                            >
                              🗑️
                            </Button>
                          </div>
                          <p className="text-slate-700 whitespace-pre-wrap">{announcement.message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Public View */
          <div className="space-y-6">
            {announcements.length === 0 ? (
              <Card>
                <CardContent className="py-20 text-center">
                  <div className="text-6xl mb-4">📢</div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">
                    Inga meddelanden just nu
                  </h3>
                  <p className="text-slate-600">
                    Det finns inga meddelanden från tävlingsledningen för tillfället.
                  </p>
                </CardContent>
              </Card>
            ) : (
              announcements.map((announcement) => {
                const badge = getPriorityBadge(announcement.priority);
                const gradientColor = getPriorityColor(announcement.priority);

                return (
                  <Card
                    key={announcement.id}
                    className={`overflow-hidden border-2 ${
                      announcement.priority === 'urgent'
                        ? 'border-red-400 shadow-xl shadow-red-200'
                        : announcement.priority === 'important'
                        ? 'border-orange-400 shadow-lg shadow-orange-200'
                        : 'border-blue-400'
                    }`}
                  >
                    <div className={`h-2 bg-gradient-to-r ${gradientColor}`} />
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex gap-3 items-center mb-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${badge.color}`}>
                          {badge.text}
                        </span>
                        {announcement.tournamentName && (
                          <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold border border-slate-300">
                            📌 {announcement.tournamentName}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-3xl">{announcement.title}</CardTitle>
                      <p className="text-sm text-slate-600 mt-2">
                        Publicerat: {new Date(announcement.createdAt).toLocaleString('sv-SE')}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-lg text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {announcement.message}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* PIN Code Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPinInput('');
          setPinError('');
        }}
        title="🔐 Tävlingsledning - Inloggning"
        size="sm"
      >
        <div className="space-y-6">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
            <p className="text-amber-900 font-semibold text-center">
              Endast för tävlingsledningen
            </p>
            <p className="text-amber-700 text-sm text-center mt-1">
              Deltagare kan bara läsa meddelanden
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              PIN-kod
            </label>
            <Input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Ange PIN-kod"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePinSubmit();
                }
              }}
              className="text-center text-2xl tracking-widest"
            />
            {pinError && (
              <p className="text-red-600 text-sm mt-2 font-semibold">❌ {pinError}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handlePinSubmit}
              className="flex-1"
              disabled={!pinInput}
            >
              Logga in
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsPinModalOpen(false);
                setPinInput('');
                setPinError('');
              }}
              className="flex-1"
            >
              Avbryt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Skapa nytt meddelande"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Prioritet
            </label>
            <select
              value={newAnnouncement.priority}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as any })
              }
              className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">📢 Normal - Information</option>
              <option value="important">⚠️ Viktigt - Uppmärksamhet krävs</option>
              <option value="urgent">🚨 Brådskande - Akut information</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tävling (valfritt)
            </label>
            <select
              value={newAnnouncement.tournamentId}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, tournamentId: e.target.value })
              }
              className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alla tävlingar</option>
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Rubrik *
            </label>
            <Input
              value={newAnnouncement.title}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
              }
              placeholder="T.ex. Tidändring för finalen"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Meddelande *
            </label>
            <textarea
              value={newAnnouncement.message}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, message: e.target.value })
              }
              placeholder="Skriv ditt meddelande här..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreateAnnouncement}
              className="flex-1"
              disabled={!newAnnouncement.title.trim() || !newAnnouncement.message.trim()}
            >
              Publicera meddelande
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1"
            >
              Avbryt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

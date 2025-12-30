'use client';

import { useEffect, useState } from 'react';
import { useTournamentStore } from '@/stores/tournament-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Tournament, TournamentSettings } from '@/types/tournament';
import { announcementAPI } from '@/lib/announcement-api';
import Link from 'next/link';

export default function Dashboard() {
  const { tournaments, loadTournaments, createTournament, deleteTournament } = useTournamentStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<TournamentSettings>({
    teamType: 'dubbel',
    ageCategory: 'öppen',
    swissRounds: 3,
    teamsPerPool: 3,
  });

  // Admin PIN
  const ADMIN_PIN = '1234';

  useEffect(() => {
    loadTournaments();
    loadUnreadCount();
  }, [loadTournaments]);

  const loadUnreadCount = async () => {
    const count = await announcementAPI.getUnreadCount();
    setUnreadCount(count);
  };

  const handlePinSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setIsAdminMode(true);
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Fel PIN-kod. Kontakta tävlingsledningen.');
      setPinInput('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
  };

  const handleCreateTournament = async () => {
    if (!tournamentName.trim()) return;

    await createTournament({
      name: tournamentName.trim(),
      date: new Date().toLocaleDateString('sv-SE'),
      teams: [],
      matches: [],
      settings,
      currentPhase: 'setup',
      currentRound: 0,
    });

    setTournamentName('');
    setIsCreateModalOpen(false);
  };

  const handleDeleteTournament = async (id: string, name: string) => {
    if (window.confirm(`Är du säker på att du vill radera "${name}"?`)) {
      await deleteTournament(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-600 to-emerald-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white">
        {/* Animated Background Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-8 py-20 text-center">
          <div className="text-7xl mb-6 animate-bounce-slow">🏆</div>
          <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Boule Pro Tävlingar
          </h1>
          <p className="text-2xl mb-10 text-blue-100 font-light">
            Swiss System • Monrad • Pool-spel med professionell utskrift
          </p>

          <div className="flex gap-6 justify-center flex-wrap">
            <Link href="/tavlingsledningen">
              <Button
                size="lg"
                className={`text-xl px-10 relative ${
                  unreadCount > 0
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse shadow-xl shadow-red-500/50'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                }`}
              >
                🚨 Tävlingsledningen
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm border-2 border-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/resultat">
              <Button
                size="lg"
                className="text-xl px-10 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                🏆 Resultat
              </Button>
            </Link>
            {isAdminMode ? (
              <>
                <Button
                  size="lg"
                  variant="success"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-xl px-10"
                >
                  🚀 Skapa Ny Tävling
                </Button>
                <Button
                  size="lg"
                  variant="danger"
                  onClick={handleAdminLogout}
                  className="text-xl px-10"
                >
                  🔓 Logga ut Admin
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setIsPinModalOpen(true)}
                className="text-xl px-10 bg-white/20 text-white hover:bg-white/30"
              >
                🔐 Admin
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent mb-4">
              🔍 Tidigare Tävlingar
            </h2>
            <p className="text-xl text-slate-600">
              Hantera professionella boule-turneringar med avancerade funktioner
            </p>
          </div>

          {tournaments.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-dashed border-cyan-400">
              <div className="text-8xl mb-6 animate-pulse">🏆</div>
              <h3 className="text-3xl font-bold text-blue-900 mb-4">Välkommen till Boule Pro!</h3>
              <p className="text-lg text-blue-700 mb-8 max-w-md mx-auto">
                Skapa din första professionella turnering med avancerade utskriftsmöjligheter och automatisk Swiss System-parning.
              </p>
              <Button
                size="lg"
                onClick={() => setIsCreateModalOpen(true)}
                className="text-lg"
              >
                ✨ Skapa Din Första Tävling
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <Card
                  key={tournament.id}
                  className="hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500" />

                  <Link href={`/tournament/${tournament.id}`}>
                    <CardHeader>
                      <CardTitle className="group-hover:scale-105 transition-transform">
                        {tournament.name}
                      </CardTitle>
                      <p className="text-slate-600 font-medium">📅 {tournament.date}</p>

                      <div className="flex gap-2 flex-wrap mt-3">
                        <span className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-300">
                          {tournament.settings.teamType.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-xs font-semibold border border-blue-300">
                          {tournament.settings.ageCategory}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tournament.currentPhase === 'setup'
                              ? 'bg-slate-200 text-slate-700'
                              : tournament.currentPhase === 'swiss'
                              ? 'bg-amber-200 text-amber-800'
                              : tournament.currentPhase === 'cup'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-emerald-200 text-emerald-800'
                          }`}
                        >
                          {tournament.currentPhase === 'setup'
                            ? '⚙️ Förberedelse'
                            : tournament.currentPhase === 'swiss'
                            ? `⚡ Swiss R${tournament.currentRound}`
                            : tournament.currentPhase === 'cup'
                            ? '🏆 Cup'
                            : '✅ Avslutad'}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex gap-6 text-slate-700 font-medium">
                        <span className="flex items-center gap-2">
                          👥 {tournament.teams.length} lag
                        </span>
                        <span className="flex items-center gap-2">
                          🎯 {tournament.matches.filter((m) => m.isCompleted).length}/
                          {tournament.matches.length}
                        </span>
                      </div>
                    </CardContent>
                  </Link>

                  {isAdminMode && (
                    <div className="px-6 pb-6">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteTournament(tournament.id, tournament.name);
                        }}
                        className="w-full"
                      >
                        🗑️ Radera
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Tournament Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Skapa ny tävling"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tävlingsnamn
            </label>
            <Input
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="T.ex. Sommar-cupen 2024"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Lagtyp</label>
            <select
              value={settings.teamType}
              onChange={(e) =>
                setSettings({ ...settings, teamType: e.target.value as any })
              }
              className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="singel">Singel (1 spelare)</option>
              <option value="dubbel">Dubbel (2 spelare)</option>
              <option value="trippel">Trippel (3 spelare)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ålderskategori
            </label>
            <select
              value={settings.ageCategory}
              onChange={(e) =>
                setSettings({ ...settings, ageCategory: e.target.value as any })
              }
              className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="öppen">Öppen (alla åldrar)</option>
              <option value="V55">Veteran 55+ (V55)</option>
              <option value="V65">Veteran 65+ (V65)</option>
              <option value="V75">Veteran 75+ (V75)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Swiss-ronder
              </label>
              <select
                value={settings.swissRounds}
                onChange={(e) =>
                  setSettings({ ...settings, swissRounds: parseInt(e.target.value) })
                }
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="2">2 ronder</option>
                <option value="3">3 ronder</option>
                <option value="4">4 ronder</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Lag per pool
              </label>
              <select
                value={settings.teamsPerPool}
                onChange={(e) =>
                  setSettings({ ...settings, teamsPerPool: parseInt(e.target.value) })
                }
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="3">3 lag</option>
                <option value="4">4 lag</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreateTournament} className="flex-1" disabled={!tournamentName.trim()}>
              Skapa tävling
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

      {/* Admin PIN Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPinInput('');
          setPinError('');
        }}
        title="🔐 Admin-inloggning"
        size="sm"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
            <p className="text-blue-900 font-semibold text-center">
              Endast för tävlingsledningen
            </p>
            <p className="text-blue-700 text-sm text-center mt-1">
              Administrera tävlingar och inställningar
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

      {/* Instructions Modal */}
      <Modal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        title="📖 Instruktioner för Boule Pro Tävlingar"
      >
        <div className="space-y-6 text-slate-700">
          <div>
            <h3 className="text-lg font-bold text-teal-600 mb-3">🏆 Välkommen till Boule Pro!</h3>
            <p className="leading-relaxed">
              Detta system hjälper dig att organisera professionella bouletävlingar med Swiss System och Cup-spel.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-teal-600 mb-3">🎯 Så här kommer du igång:</h3>
            <ol className="list-decimal pl-6 space-y-2 leading-relaxed">
              <li><strong>Skapa en ny tävling</strong> - Klicka på "Ny tävling" och fyll i grundinformation</li>
              <li><strong>Lägg till lag</strong> - Registrera alla deltagande lag med spelare</li>
              <li><strong>Starta Swiss-ronder</strong> - Systemet parar automatiskt ihop lagen</li>
              <li><strong>Registrera resultat</strong> - Fyll i matchresultat efter varje rond</li>
              <li><strong>Spela cup-final</strong> - De bästa lagen går vidare till slutspel</li>
              <li><strong>Skriv ut resultat</strong> - Professionella utskrifter för anslagstavla</li>
            </ol>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-800 mb-2">💡 Pro-tips:</h4>
            <ul className="text-sm text-emerald-700 space-y-1 pl-5 list-disc">
              <li>Använd <strong>Swiss System</strong> för rättvisa matcher</li>
              <li>Kör <strong>3-4 ronder</strong> för bästa ranking</li>
              <li>Data sparas <strong>automatiskt</strong> i webbläsaren</li>
            </ul>
          </div>

          <Button onClick={() => setIsInstructionsOpen(false)} className="w-full">
            Förstått!
          </Button>
        </div>
      </Modal>
    </div>
  );
}

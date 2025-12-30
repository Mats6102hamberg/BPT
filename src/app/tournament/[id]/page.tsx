'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTournamentStore } from '@/stores/tournament-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Player, Match } from '@/types/tournament';
import { getRankedTeams } from '@/lib/swiss-system';

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const {
    currentTournament,
    selectTournament,
    addTeam,
    removeTeam,
    startSwissRound,
    registerMatchResult,
  } = useTournamentStore();

  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState<Player[]>([{ name: '' }, { name: '' }]);
  const [contactInfo, setContactInfo] = useState('');
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');

  useEffect(() => {
    if (tournamentId) {
      selectTournament(tournamentId);
    }
  }, [tournamentId, selectTournament]);

  useEffect(() => {
    if (currentTournament) {
      const playerCount =
        currentTournament.settings.teamType === 'singel'
          ? 1
          : currentTournament.settings.teamType === 'dubbel'
          ? 2
          : 3;
      setPlayers(Array.from({ length: playerCount }, () => ({ name: '' })));
    }
  }, [currentTournament?.settings.teamType]);

  if (!currentTournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-emerald-500 flex items-center justify-center">
        <div className="text-white text-2xl">Laddar turnering...</div>
      </div>
    );
  }

  const handleAddTeam = async () => {
    if (!teamName.trim() || !players.some((p) => p.name.trim())) return;

    await addTeam(tournamentId, {
      name: teamName.trim(),
      players: players.filter((p) => p.name.trim()),
      contactInfo,
    });

    setTeamName('');
    setPlayers(Array.from({ length: players.length }, () => ({ name: '' })));
    setContactInfo('');
    setIsAddTeamModalOpen(false);
  };

  const handleRemoveTeam = async (teamId: string, teamName: string) => {
    if (window.confirm(`Vill du ta bort laget "${teamName}"?`)) {
      await removeTeam(tournamentId, teamId);
    }
  };

  const handleStartSwissRound = async () => {
    if (currentTournament.teams.length < 4) {
      alert('Du behöver minst 4 lag för att starta Swiss-ronder');
      return;
    }

    if (
      window.confirm(
        `Starta Swiss rond ${currentTournament.currentRound + 1}? Detta kommer att generera automatiska parningar.`
      )
    ) {
      await startSwissRound(tournamentId);
    }
  };

  const handleRegisterResult = async () => {
    if (!selectedMatch || !team1Score || !team2Score) return;

    const score1 = parseInt(team1Score);
    const score2 = parseInt(team2Score);

    if (isNaN(score1) || isNaN(score2) || score1 === score2) {
      alert('Ogiltiga poäng. Det måste finnas en vinnare.');
      return;
    }

    const winnerId = score1 > score2 ? selectedMatch.team1Id : selectedMatch.team2Id;

    await registerMatchResult(tournamentId, selectedMatch.id, winnerId, score1, score2);

    setSelectedMatch(null);
    setTeam1Score('');
    setTeam2Score('');
    setIsMatchModalOpen(false);
  };

  const rankedTeams = getRankedTeams(currentTournament.teams);
  const currentRoundMatches = currentTournament.matches.filter(
    (m) => m.round === currentTournament.currentRound
  );

  const getTeamName = (teamId: string) => {
    return currentTournament.teams.find((t) => t.id === teamId)?.name || 'Okänt lag';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-600 to-emerald-500">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-white/50 shadow-xl">
        <div className="max-w-6xl mx-auto px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => router.push('/')}>
              ← Tillbaka
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                {currentTournament.name}
              </h1>
              <p className="text-slate-600">
                📅 {currentTournament.date} • {currentTournament.settings.teamType} •{' '}
                {currentTournament.settings.ageCategory}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => window.print()}>
              🖨️ Skriv ut
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-cyan-400">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">👥</div>
              <h3 className="text-4xl font-bold text-blue-900">{currentTournament.teams.length}</h3>
              <p className="text-blue-700 font-medium">Lag anmälda</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-400">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">🎯</div>
              <h3 className="text-4xl font-bold text-emerald-900">
                {currentTournament.matches.filter((m) => m.isCompleted).length}/
                {currentTournament.matches.length}
              </h3>
              <p className="text-emerald-700 font-medium">Matcher spelade</p>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br border-2 ${
              currentTournament.currentPhase === 'setup'
                ? 'from-slate-50 to-slate-100 border-slate-400'
                : currentTournament.currentPhase === 'swiss'
                ? 'from-amber-50 to-yellow-50 border-amber-400'
                : 'from-orange-50 to-red-50 border-orange-400'
            }`}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">
                {currentTournament.currentPhase === 'setup'
                  ? '⚙️'
                  : currentTournament.currentPhase === 'swiss'
                  ? '⚡'
                  : '🏆'}
              </div>
              <h3
                className={`text-2xl font-bold ${
                  currentTournament.currentPhase === 'setup'
                    ? 'text-slate-800'
                    : currentTournament.currentPhase === 'swiss'
                    ? 'text-amber-900'
                    : 'text-orange-900'
                }`}
              >
                {currentTournament.currentPhase === 'setup'
                  ? 'Förberedelse'
                  : currentTournament.currentPhase === 'swiss'
                  ? `Swiss R${currentTournament.currentRound}`
                  : 'Cup-spel'}
              </h3>
              <p
                className={`font-medium ${
                  currentTournament.currentPhase === 'setup'
                    ? 'text-slate-700'
                    : currentTournament.currentPhase === 'swiss'
                    ? 'text-amber-700'
                    : 'text-orange-700'
                }`}
              >
                Aktuell fas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Button
            size="lg"
            variant="success"
            onClick={() => setIsAddTeamModalOpen(true)}
            className="h-32 flex-col gap-2"
          >
            <div className="text-4xl">👥</div>
            <div className="font-bold">Lägg till lag</div>
            <div className="text-sm opacity-90">Registrera deltagande lag</div>
          </Button>

          <Button
            size="lg"
            onClick={handleStartSwissRound}
            disabled={currentTournament.teams.length < 4}
            className="h-32 flex-col gap-2 bg-gradient-to-r from-amber-500 to-orange-600 disabled:from-slate-400 disabled:to-slate-500"
          >
            <div className="text-4xl">⚡</div>
            <div className="font-bold">
              {currentTournament.currentPhase === 'setup' ? 'Starta Swiss' : 'Nästa rond'}
            </div>
            <div className="text-sm opacity-90">
              {currentTournament.teams.length < 4
                ? 'Behöver minst 4 lag'
                : 'Automatisk parning'}
            </div>
          </Button>

          <Button
            size="lg"
            onClick={() => {
              /* Show matches modal */
            }}
            className="h-32 flex-col gap-2"
          >
            <div className="text-4xl">🎯</div>
            <div className="font-bold">Se matcher</div>
            <div className="text-sm opacity-90">Alla matcher & resultat</div>
          </Button>
        </div>

        {/* Current Round Matches */}
        {currentRoundMatches.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Matcher - Rond {currentTournament.currentRound}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentRoundMatches.map((match) => {
                  const team1 = currentTournament.teams.find((t) => t.id === match.team1Id);
                  const team2 = currentTournament.teams.find((t) => t.id === match.team2Id);

                  return (
                    <div
                      key={match.id}
                      className={`p-4 rounded-xl border-2 ${
                        match.isCompleted
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="font-bold text-lg">{team1?.name}</span>
                            {match.isCompleted && (
                              <span className="text-2xl font-bold text-blue-600">
                                {match.team1Score}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg">{team2?.name}</span>
                            {match.isCompleted && (
                              <span className="text-2xl font-bold text-blue-600">
                                {match.team2Score}
                              </span>
                            )}
                          </div>
                        </div>

                        {!match.isCompleted && (
                          <Button
                            onClick={() => {
                              setSelectedMatch(match);
                              setIsMatchModalOpen(true);
                            }}
                          >
                            Registrera resultat
                          </Button>
                        )}
                        {match.isCompleted && (
                          <div className="text-emerald-600 font-bold text-sm">
                            ✓ Klar - Vinnare: {getTeamName(match.winnerId!)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ranking Table */}
        {rankedTeams.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 px-4">#</th>
                      <th className="text-left py-3 px-4">Lag</th>
                      <th className="text-center py-3 px-4">Vinster</th>
                      <th className="text-center py-3 px-4">Förluster</th>
                      <th className="text-center py-3 px-4">Poäng</th>
                      <th className="text-center py-3 px-4">Buchholz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedTeams.map((team, index) => (
                      <tr
                        key={team.id}
                        className={`border-b border-slate-200 ${
                          index < 3 ? 'bg-amber-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-lg">
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                          {index > 2 && index + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold">{team.name}</td>
                        <td className="text-center py-3 px-4">{team.wins}</td>
                        <td className="text-center py-3 px-4">{team.losses}</td>
                        <td className="text-center py-3 px-4 font-bold text-blue-600">
                          {team.points}
                        </td>
                        <td className="text-center py-3 px-4 text-slate-600">
                          {team.buchholz}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams List */}
        <Card>
          <CardHeader>
            <CardTitle>Anmälda lag ({currentTournament.teams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {currentTournament.teams.length === 0 ? (
              <div className="text-center py-12 bg-blue-50 rounded-xl border-2 border-dashed border-blue-300">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-2xl font-bold text-blue-900 mb-2">
                  Inga lag anmälda ännu
                </h3>
                <p className="text-blue-700 mb-6">
                  Börja med att lägga till lag för att kunna starta turneringen.
                </p>
                <Button size="lg" onClick={() => setIsAddTeamModalOpen(true)}>
                  ➕ Lägg till första laget
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentTournament.teams.map((team, index) => (
                  <div
                    key={team.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg">
                        {index + 1}. {team.name}
                      </h4>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveTeam(team.id, team.name)}
                      >
                        ✕
                      </Button>
                    </div>
                    <div className="text-sm text-slate-600">
                      <strong>Spelare:</strong> {team.players.map((p) => p.name).join(', ')}
                    </div>
                    {team.contactInfo && (
                      <div className="text-sm text-slate-600 mt-1">
                        <strong>Kontakt:</strong> {team.contactInfo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Team Modal */}
      <Modal
        isOpen={isAddTeamModalOpen}
        onClose={() => setIsAddTeamModalOpen(false)}
        title="Lägg till nytt lag"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Lagnamn *
            </label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="T.ex. Boule Stjärnorna"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Spelare *
            </label>
            {players.map((player, index) => (
              <div key={index} className="mb-3">
                <Input
                  value={player.name}
                  onChange={(e) => {
                    const newPlayers = [...players];
                    newPlayers[index] = { ...newPlayers[index], name: e.target.value };
                    setPlayers(newPlayers);
                  }}
                  placeholder={`Spelare ${index + 1}`}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Kontaktinfo (valfritt)
            </label>
            <Input
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="T.ex. telefon eller e-post"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleAddTeam}
              className="flex-1"
              disabled={!teamName.trim() || !players.some((p) => p.name.trim())}
            >
              Lägg till lag
            </Button>
            <Button variant="secondary" onClick={() => setIsAddTeamModalOpen(false)} className="flex-1">
              Avbryt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Register Match Result Modal */}
      <Modal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        title="Registrera matchresultat"
      >
        {selectedMatch && (
          <div className="space-y-6">
            <div className="bg-slate-100 p-4 rounded-xl">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <div className="font-bold text-lg mb-2">{getTeamName(selectedMatch.team1Id)}</div>
                  <Input
                    type="number"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(e.target.value)}
                    placeholder="Poäng"
                    className="text-center text-2xl font-bold"
                    min="0"
                  />
                </div>

                <div className="text-center text-3xl font-bold text-slate-400">VS</div>

                <div className="text-center">
                  <div className="font-bold text-lg mb-2">{getTeamName(selectedMatch.team2Id)}</div>
                  <Input
                    type="number"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(e.target.value)}
                    placeholder="Poäng"
                    className="text-center text-2xl font-bold"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleRegisterResult}
                className="flex-1"
                disabled={!team1Score || !team2Score}
              >
                Spara resultat
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsMatchModalOpen(false);
                  setSelectedMatch(null);
                  setTeam1Score('');
                  setTeam2Score('');
                }}
                className="flex-1"
              >
                Avbryt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

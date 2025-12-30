'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/stores/tournament-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tournament, Team } from '@/types/tournament';
import { getRankedTeams } from '@/lib/swiss-system';

export default function ResultatPage() {
  const router = useRouter();
  const { tournaments, loadTournaments } = useTournamentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  // Filtrera turneringar baserat på sökning
  const filteredTournaments = tournaments.filter((tournament) => {
    const query = searchQuery.toLowerCase();

    // Sök i turneringsnamn
    if (tournament.name.toLowerCase().includes(query)) return true;

    // Sök i lagnamn
    if (tournament.teams.some(team => team.name.toLowerCase().includes(query))) return true;

    // Sök i spelarnamn
    if (tournament.teams.some(team =>
      team.players.some(player => player.name.toLowerCase().includes(query))
    )) return true;

    return false;
  });

  const getTournamentWinner = (tournament: Tournament) => {
    if (tournament.teams.length === 0) return null;
    const ranked = getRankedTeams(tournament.teams);
    return ranked[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-600 to-emerald-500">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-white/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                🏆 Resultat
              </h1>
              <p className="text-slate-600 mt-2">
                Sök och hitta resultat från alla turneringar
              </p>
            </div>
            <Button onClick={() => router.push('/')}>
              ← Tillbaka
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="🔍 Sök efter turnering, lag eller spelare..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-lg h-14"
                />
              </div>
              {searchQuery && (
                <Button variant="secondary" onClick={() => setSearchQuery('')}>
                  Rensa
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-slate-600 mt-3">
                Hittade <strong>{filteredTournaments.length}</strong> tävling(ar)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-cyan-400">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">🏆</div>
              <h3 className="text-4xl font-bold text-blue-900">{tournaments.length}</h3>
              <p className="text-blue-700 font-medium">Totalt antal tävlingar</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-400">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">👥</div>
              <h3 className="text-4xl font-bold text-emerald-900">
                {tournaments.reduce((sum, t) => sum + t.teams.length, 0)}
              </h3>
              <p className="text-emerald-700 font-medium">Totalt antal lag</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-400">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-3">🎯</div>
              <h3 className="text-4xl font-bold text-amber-900">
                {tournaments.reduce((sum, t) => sum + t.matches.filter(m => m.isCompleted).length, 0)}
              </h3>
              <p className="text-amber-700 font-medium">Spelade matcher</p>
            </CardContent>
          </Card>
        </div>

        {/* Tournaments List */}
        {filteredTournaments.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-slate-700 mb-2">
                {searchQuery ? 'Inga resultat hittades' : 'Inga tävlingar ännu'}
              </h3>
              <p className="text-slate-600">
                {searchQuery
                  ? `Kunde inte hitta någon tävling, lag eller spelare som matchar "${searchQuery}"`
                  : 'Skapa din första tävling för att se resultat här!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredTournaments.map((tournament) => {
              const winner = getTournamentWinner(tournament);
              const rankedTeams = getRankedTeams(tournament.teams);
              const isExpanded = selectedTournament === tournament.id;

              return (
                <Card key={tournament.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{tournament.name}</CardTitle>
                        <div className="flex gap-4 text-sm text-slate-600">
                          <span>📅 {tournament.date}</span>
                          <span>👥 {tournament.teams.length} lag</span>
                          <span>
                            🎯 {tournament.matches.filter(m => m.isCompleted).length}/{tournament.matches.length} matcher
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                            {tournament.settings.teamType.toUpperCase()}
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {tournament.settings.ageCategory}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tournament.currentPhase === 'setup' ? 'bg-slate-200 text-slate-700' :
                            tournament.currentPhase === 'swiss' ? 'bg-amber-200 text-amber-800' :
                            tournament.currentPhase === 'cup' ? 'bg-orange-200 text-orange-800' :
                            'bg-emerald-200 text-emerald-800'
                          }`}>
                            {tournament.currentPhase === 'setup' ? '⚙️ Förberedelse' :
                             tournament.currentPhase === 'swiss' ? `⚡ Swiss R${tournament.currentRound}` :
                             tournament.currentPhase === 'cup' ? '🏆 Cup' : '✅ Avslutad'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setSelectedTournament(isExpanded ? null : tournament.id)}
                          variant="secondary"
                        >
                          {isExpanded ? 'Dölj' : 'Visa'} resultat
                        </Button>
                        <Button onClick={() => router.push(`/tournament/${tournament.id}`)}>
                          Öppna
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Winner Badge */}
                  {winner && tournament.currentPhase === 'finished' && (
                    <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-b border-amber-200 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">🥇</div>
                        <div>
                          <div className="font-bold text-amber-900">Vinnare</div>
                          <div className="text-lg font-semibold text-amber-800">
                            {winner.name} ({winner.points} poäng)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded Results */}
                  {isExpanded && (
                    <CardContent className="pt-6">
                      {rankedTeams.length === 0 ? (
                        <div className="text-center py-8 text-slate-600">
                          Inga lag anmälda ännu
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-slate-300">
                                <th className="text-left py-3 px-4">Placering</th>
                                <th className="text-left py-3 px-4">Lag</th>
                                <th className="text-left py-3 px-4">Spelare</th>
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
                                  } ${
                                    searchQuery && (
                                      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      team.players.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    ) ? 'bg-blue-100' : ''
                                  }`}
                                >
                                  <td className="py-3 px-4 font-bold text-lg">
                                    {index === 0 && '🥇'}
                                    {index === 1 && '🥈'}
                                    {index === 2 && '🥉'}
                                    {index > 2 && (index + 1)}
                                  </td>
                                  <td className="py-3 px-4 font-semibold">{team.name}</td>
                                  <td className="py-3 px-4 text-sm text-slate-600">
                                    {team.players.map(p => p.name).join(', ')}
                                  </td>
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
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/stores/tournament-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tournament, Team, Match } from '@/types/tournament';

interface MatchWithContext {
  match: Match;
  tournament: Tournament;
  team: Team;
  opponent: Team | null;
  isNextMatch: boolean;
  estimatedTime?: string;
}

export default function MinaMatcherPage() {
  const router = useRouter();
  const { tournaments, loadTournaments } = useTournamentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState<MatchWithContext[]>([]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatches([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const foundMatches: MatchWithContext[] = [];

    tournaments.forEach((tournament) => {
      // Hitta lag som matchar sökningen
      const matchingTeams = tournament.teams.filter((team) => {
        // Sök i lagnamn
        if (team.name.toLowerCase().includes(query)) return true;

        // Sök i spelarnamn
        if (team.players.some(player => player.name.toLowerCase().includes(query))) return true;

        return false;
      });

      // Hitta alla matcher för matchande lag
      matchingTeams.forEach((team) => {
        tournament.matches.forEach((match) => {
          // Kolla om laget är med i matchen
          if (match.team1Id === team.id || match.team2Id === team.id) {
            const isTeam1 = match.team1Id === team.id;
            const opponentId = isTeam1 ? match.team2Id : match.team1Id;
            const opponent = tournament.teams.find(t => t.id === opponentId) || null;

            foundMatches.push({
              match,
              tournament,
              team,
              opponent,
              isNextMatch: false, // Kommer uppdateras nedan
            });
          }
        });
      });
    });

    // Sortera matcher: ofullständiga först (nästa match), sedan fullständiga
    foundMatches.sort((a, b) => {
      // Ofullständiga matcher först
      if (!a.match.isCompleted && b.match.isCompleted) return -1;
      if (a.match.isCompleted && !b.match.isCompleted) return 1;

      // Inom ofullständiga: sortera efter rond
      if (!a.match.isCompleted && !b.match.isCompleted) {
        return a.match.round - b.match.round;
      }

      // Inom fullständiga: sortera efter rond (senaste först)
      return b.match.round - a.match.round;
    });

    // Markera första ofullständiga matchen som "nästa match"
    if (foundMatches.length > 0 && !foundMatches[0].match.isCompleted) {
      foundMatches[0].isNextMatch = true;

      // Beräkna uppskattad tid baserat på rond och tidigare matcher
      const tournament = foundMatches[0].tournament;
      const completedMatchesInRound = tournament.matches.filter(
        m => m.round === foundMatches[0].match.round && m.isCompleted
      ).length;
      const totalMatchesInRound = tournament.matches.filter(
        m => m.round === foundMatches[0].match.round
      ).length;

      if (completedMatchesInRound === 0) {
        foundMatches[0].estimatedTime = 'Påbörjas snart';
      } else if (completedMatchesInRound < totalMatchesInRound / 2) {
        foundMatches[0].estimatedTime = 'Inom 15-30 min';
      } else {
        foundMatches[0].estimatedTime = 'Inom 5-15 min';
      }
    }

    setMatches(foundMatches);
  }, [searchQuery, tournaments]);

  const getMatchResult = (match: Match, team: Team) => {
    if (!match.isCompleted) return null;

    const isTeam1 = match.team1Id === team.id;
    const teamScore = isTeam1 ? match.team1Score : match.team2Score;
    const opponentScore = isTeam1 ? match.team2Score : match.team1Score;
    const isWinner = match.winnerId === team.id;

    return {
      teamScore,
      opponentScore,
      isWinner,
    };
  };

  const nextMatch = matches.find(m => m.isNextMatch);
  const upcomingMatches = matches.filter(m => !m.match.isCompleted && !m.isNextMatch);
  const completedMatches = matches.filter(m => m.match.isCompleted);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-600 to-blue-500">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-white/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
                🎯 Mina Matcher
              </h1>
              <p className="text-slate-600 mt-2">
                Sök efter ditt lag eller namn för att hitta dina matcher
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
        <Card className="mb-8 border-4 border-emerald-400 shadow-2xl">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="🔍 Skriv ditt lagnamn eller spelarnamn (t.ex. 'Lag 5' eller 'Mats')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-lg h-16 border-2 border-emerald-300 focus:border-emerald-500"
                  autoFocus
                />
              </div>
              {searchQuery && (
                <Button variant="secondary" onClick={() => setSearchQuery('')} className="h-16">
                  Rensa
                </Button>
              )}
            </div>
            {searchQuery && matches.length > 0 && (
              <p className="text-sm text-slate-600 mt-3">
                Hittade <strong>{matches.length}</strong> match(er) för "{searchQuery}"
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {!searchQuery ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="text-7xl mb-6">🎯</div>
              <h3 className="text-3xl font-bold text-slate-700 mb-3">
                Sök efter dina matcher
              </h3>
              <p className="text-lg text-slate-600">
                Skriv ditt lagnamn eller spelarnamn i sökrutan ovan
              </p>
            </CardContent>
          </Card>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="text-7xl mb-6">❌</div>
              <h3 className="text-3xl font-bold text-slate-700 mb-3">
                Inga matcher hittades
              </h3>
              <p className="text-lg text-slate-600">
                Kunde inte hitta några matcher för "{searchQuery}"
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* NEXT MATCH - Highlighted */}
            {nextMatch && (
              <Card className="border-8 border-green-500 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 animate-pulse">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <span className="text-5xl">🎯</span>
                    <span>DIN NÄSTA MATCH!</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Court Number */}
                    <div className="text-center">
                      <div className="text-sm text-slate-600 mb-2 font-semibold">BANA</div>
                      <div className="text-7xl font-black text-green-600">
                        {nextMatch.match.courtNumber || '?'}
                      </div>
                      {!nextMatch.match.courtNumber && (
                        <div className="text-sm text-slate-500 mt-2">Ej tilldelad ännu</div>
                      )}
                    </div>

                    {/* Match Info */}
                    <div className="text-center">
                      <div className="text-sm text-slate-600 mb-2 font-semibold">MOTSTÅNDARE</div>
                      <div className="text-3xl font-bold text-slate-800 mb-2">
                        {nextMatch.opponent?.name || 'Okänd motståndare'}
                      </div>
                      {nextMatch.opponent && (
                        <div className="text-sm text-slate-600">
                          {nextMatch.opponent.players.map(p => p.name).join(', ')}
                        </div>
                      )}
                      <div className="mt-4 text-lg text-slate-700">
                        <span className="font-semibold">Rond:</span> {nextMatch.match.round}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-center">
                      <div className="text-sm text-slate-600 mb-2 font-semibold">UPPSKATTAD TID</div>
                      <div className="text-3xl font-bold text-emerald-600">
                        {nextMatch.estimatedTime || 'Snart'}
                      </div>
                      <div className="mt-4 text-sm text-slate-600">
                        {nextMatch.tournament.name}
                      </div>
                    </div>
                  </div>

                  {/* Your Team */}
                  <div className="mt-6 pt-6 border-t border-green-200 text-center">
                    <div className="text-sm text-slate-600 mb-2">DITT LAG</div>
                    <div className="text-2xl font-bold text-slate-800">
                      {nextMatch.team.name}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {nextMatch.team.players.map(p => p.name).join(', ')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Matches */}
            {upcomingMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>⏳</span>
                  <span>Kommande matcher ({upcomingMatches.length})</span>
                </h2>
                <div className="space-y-4">
                  {upcomingMatches.map((matchCtx, index) => (
                    <Card key={`${matchCtx.match.id}-${index}`} className="border-2 border-blue-300">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="text-sm text-slate-600 mb-1">
                              {matchCtx.tournament.name} - Rond {matchCtx.match.round}
                            </div>
                            <div className="text-xl font-bold">
                              {matchCtx.team.name} vs {matchCtx.opponent?.name || 'Okänd'}
                            </div>
                            {matchCtx.match.courtNumber && (
                              <div className="text-lg text-blue-600 mt-2">
                                🎯 Bana {matchCtx.match.courtNumber}
                              </div>
                            )}
                          </div>
                          <Button onClick={() => router.push(`/tournament/${matchCtx.tournament.id}`)}>
                            Öppna tävling
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Matches */}
            {completedMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>✅</span>
                  <span>Spelade matcher ({completedMatches.length})</span>
                </h2>
                <div className="space-y-4">
                  {completedMatches.map((matchCtx, index) => {
                    const result = getMatchResult(matchCtx.match, matchCtx.team);
                    return (
                      <Card key={`${matchCtx.match.id}-${index}`} className={`border-2 ${result?.isWinner ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="text-sm text-slate-600 mb-1">
                                {matchCtx.tournament.name} - Rond {matchCtx.match.round}
                              </div>
                              <div className="text-xl font-bold flex items-center gap-3">
                                <span>{matchCtx.team.name}</span>
                                <span className="text-2xl font-black px-4 py-1 bg-white rounded-lg">
                                  {result?.teamScore} - {result?.opponentScore}
                                </span>
                                <span>{matchCtx.opponent?.name || 'Okänd'}</span>
                                <span className="text-2xl">
                                  {result?.isWinner ? '🏆' : '❌'}
                                </span>
                              </div>
                              {matchCtx.match.courtNumber && (
                                <div className="text-sm text-slate-600 mt-2">
                                  Bana {matchCtx.match.courtNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { Team, Match, Tournament } from '@/types/tournament';
import { generateId } from './utils';

/**
 * Generate pairings for a Swiss System round using the Monrad system.
 * Teams are sorted by points (and Buchholz as tiebreaker), then paired top vs top.
 * Avoids rematches when possible.
 */
export function generateSwissPairings(tournament: Tournament): Match[] {
  const teams = [...tournament.teams];
  const round = tournament.currentRound + 1;

  // Sort teams by points (descending), then by Buchholz (descending)
  teams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.buchholz - a.buchholz;
  });

  const matches: Match[] = [];
  const paired = new Set<string>();

  // Pair teams from top to bottom
  for (let i = 0; i < teams.length; i++) {
    if (paired.has(teams[i].id)) continue;

    const team1 = teams[i];
    let opponent: Team | null = null;

    // Find best opponent (closest in ranking that hasn't been faced before)
    for (let j = i + 1; j < teams.length; j++) {
      if (paired.has(teams[j].id)) continue;

      const team2 = teams[j];

      // Check if they've already played each other
      if (!team1.opponents.includes(team2.id)) {
        opponent = team2;
        break;
      }
    }

    // If no opponent found (all have been faced), pair with closest anyway
    if (!opponent) {
      for (let j = i + 1; j < teams.length; j++) {
        if (!paired.has(teams[j].id)) {
          opponent = teams[j];
          break;
        }
      }
    }

    if (opponent) {
      matches.push({
        id: generateId(),
        round,
        team1Id: team1.id,
        team2Id: opponent.id,
        isCompleted: false,
      });

      paired.add(team1.id);
      paired.add(opponent.id);
    } else if (teams.length % 2 !== 0 && i === teams.length - 1) {
      // Odd number of teams - last team gets a bye (automatic win)
      // We'll handle this by giving them a win against a "bye" opponent
      // For now, skip this team (they get a free point handled elsewhere)
    }
  }

  return matches;
}

/**
 * Update team records after a match is completed
 */
export function updateTeamRecords(tournament: Tournament, match: Match): Tournament {
  if (!match.isCompleted || !match.winnerId) return tournament;

  const teams = tournament.teams.map(team => {
    if (team.id === match.team1Id || team.id === match.team2Id) {
      const isWinner = team.id === match.winnerId;
      const opponentId = team.id === match.team1Id ? match.team2Id : match.team1Id;

      return {
        ...team,
        wins: isWinner ? team.wins + 1 : team.wins,
        losses: isWinner ? team.losses : team.losses + 1,
        points: isWinner ? team.points + 2 : team.points + 1, // 2 for win, 1 for loss
        opponents: [...team.opponents, opponentId],
      };
    }
    return team;
  });

  return {
    ...tournament,
    teams: calculateBuchholz(teams, tournament.matches),
  };
}

/**
 * Calculate Buchholz scores for all teams
 * Buchholz = sum of points of all opponents faced
 */
export function calculateBuchholz(teams: Team[], matches: Match[]): Team[] {
  return teams.map(team => {
    let buchholz = 0;

    // Get all opponents this team has faced
    team.opponents.forEach(opponentId => {
      const opponent = teams.find(t => t.id === opponentId);
      if (opponent) {
        buchholz += opponent.points;
      }
    });

    return {
      ...team,
      buchholz,
    };
  });
}

/**
 * Get ranked teams sorted by points and Buchholz
 */
export function getRankedTeams(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Split teams into A and B tournaments after Swiss rounds
 * Returns { aTournament: top 50%, bTournament: bottom 50% }
 */
export function splitIntoABTournaments(tournament: Tournament): {
  aTournament: Team[];
  bTournament: Team[];
} {
  const ranked = getRankedTeams(tournament.teams);
  const splitPoint = Math.ceil(ranked.length / 2);

  return {
    aTournament: ranked.slice(0, splitPoint),
    bTournament: ranked.slice(splitPoint),
  };
}

/**
 * Get next power of 2 for bracket size
 * Example: 7 teams -> 8, 15 teams -> 16
 */
function getNextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Generate cup matches for a single tournament (A or B)
 * Handles BYE (walkover) for odd bracket sizes
 * Returns matches for the first round of cup play
 */
export function generateCupMatches(
  tournament: Tournament,
  teams: Team[],
  cupType: 'A' | 'B'
): Match[] {
  if (teams.length < 2) return [];

  const matches: Match[] = [];
  const bracketSize = getNextPowerOf2(teams.length);
  const byeCount = bracketSize - teams.length;

  // Determine round number (cup rounds start after swiss)
  const cupRound = tournament.currentRound + 1;

  // Top seeds get BYEs if needed
  let teamIndex = byeCount; // Start pairing after BYE teams

  // Pair remaining teams
  for (let i = 0; i < Math.floor((teams.length - byeCount) / 2); i++) {
    const team1 = teams[teamIndex];
    const team2 = teams[teamIndex + 1];

    matches.push({
      id: generateId(),
      round: cupRound,
      team1Id: team1.id,
      team2Id: team2.id,
      isCompleted: false,
      cupType, // Mark which tournament this match belongs to
    } as any); // We'll extend the Match type

    teamIndex += 2;
  }

  return matches;
}

/**
 * Generate next round of cup matches based on previous round winners
 */
export function generateNextCupRound(
  tournament: Tournament,
  previousMatches: Match[],
  cupType: 'A' | 'B'
): Match[] {
  const winners = previousMatches
    .filter((m) => m.isCompleted && m.winnerId)
    .map((m) => tournament.teams.find((t) => t.id === m.winnerId))
    .filter((t): t is Team => t !== undefined);

  if (winners.length < 2) return [];

  const matches: Match[] = [];
  const cupRound = tournament.currentRound + 1;

  for (let i = 0; i < Math.floor(winners.length / 2); i++) {
    matches.push({
      id: generateId(),
      round: cupRound,
      team1Id: winners[i * 2].id,
      team2Id: winners[i * 2 + 1].id,
      isCompleted: false,
      cupType,
    } as any);
  }

  return matches;
}

/**
 * Check if cup tournament is complete
 */
export function isCupComplete(matches: Match[], cupType: 'A' | 'B'): boolean {
  const cupMatches = matches.filter((m: any) => m.cupType === cupType);
  if (cupMatches.length === 0) return false;

  // Cup is complete when there's only one winner left
  const lastRound = Math.max(...cupMatches.map((m) => m.round));
  const lastRoundMatches = cupMatches.filter((m) => m.round === lastRound);

  return lastRoundMatches.length === 1 && lastRoundMatches[0].isCompleted;
}

/**
 * Get cup winner for A or B tournament
 */
export function getCupWinner(
  tournament: Tournament,
  matches: Match[],
  cupType: 'A' | 'B'
): Team | null {
  const cupMatches = matches.filter((m: any) => m.cupType === cupType);
  if (cupMatches.length === 0) return null;

  const lastRound = Math.max(...cupMatches.map((m) => m.round));
  const finalMatch = cupMatches.find((m) => m.round === lastRound && m.isCompleted);

  if (!finalMatch || !finalMatch.winnerId) return null;

  return tournament.teams.find((t) => t.id === finalMatch.winnerId) || null;
}

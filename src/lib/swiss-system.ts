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
 * Generate Cup bracket from top teams after Swiss rounds
 */
export function generateCupBracket(teams: Team[], numTeams: number = 8): Team[] {
  const ranked = getRankedTeams(teams);
  return ranked.slice(0, Math.min(numTeams, ranked.length));
}

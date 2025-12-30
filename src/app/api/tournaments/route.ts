import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError, generateId } from '@/lib/db-client';
import { Tournament } from '@/types/tournament';

// GET all tournaments
export async function GET() {
  try {
    const tournamentsResult = await sql`
      SELECT * FROM tournaments
      ORDER BY created_at DESC
    `;

    const tournaments: Tournament[] = [];

    for (const tournamentRow of tournamentsResult.rows) {
      // Get teams for this tournament
      const teamsResult = await sql`
        SELECT * FROM teams
        WHERE tournament_id = ${tournamentRow.id}
        ORDER BY points DESC, buchholz DESC
      `;

      // Get matches for this tournament
      const matchesResult = await sql`
        SELECT * FROM matches
        WHERE tournament_id = ${tournamentRow.id}
        ORDER BY round, created_at
      `;

      const tournament: Tournament = {
        id: tournamentRow.id,
        name: tournamentRow.name,
        date: tournamentRow.date,
        settings: tournamentRow.settings,
        currentPhase: tournamentRow.current_phase,
        currentRound: tournamentRow.current_round,
        teams: teamsResult.rows.map(team => ({
          id: team.id,
          name: team.name,
          players: team.players,
          contactInfo: team.contact_info,
          wins: team.wins,
          losses: team.losses,
          points: team.points,
          buchholz: team.buchholz,
          opponents: team.opponents,
        })),
        matches: matchesResult.rows.map(match => ({
          id: match.id,
          round: match.round,
          team1Id: match.team1_id,
          team2Id: match.team2_id,
          team1Score: match.team1_score,
          team2Score: match.team2_score,
          isCompleted: match.is_completed,
          winnerId: match.winner_id,
        })),
      };

      tournaments.push(tournament);
    }

    return NextResponse.json(tournaments);
  } catch (error) {
    handleDbError(error);
  }
}

// POST create new tournament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, settings, currentPhase, currentRound } = body;

    const id = generateId();

    await sql`
      INSERT INTO tournaments (id, name, date, settings, current_phase, current_round)
      VALUES (${id}, ${name}, ${date}, ${JSON.stringify(settings)}, ${currentPhase}, ${currentRound})
    `;

    const tournament: Tournament = {
      id,
      name,
      date,
      settings,
      currentPhase,
      currentRound,
      teams: [],
      matches: [],
    };

    return NextResponse.json(tournament);
  } catch (error) {
    handleDbError(error);
  }
}

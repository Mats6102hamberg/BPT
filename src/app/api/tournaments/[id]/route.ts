import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError } from '@/lib/db-client';

// GET single tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournamentResult = await sql`
      SELECT * FROM tournaments WHERE id = ${id}
    `;

    if (tournamentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const tournamentRow = tournamentResult.rows[0];

    // Get teams
    const teamsResult = await sql`
      SELECT * FROM teams
      WHERE tournament_id = ${id}
      ORDER BY points DESC, buchholz DESC
    `;

    // Get matches
    const matchesResult = await sql`
      SELECT * FROM matches
      WHERE tournament_id = ${id}
      ORDER BY round, created_at
    `;

    const tournament = {
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
        cupType: match.cup_type || undefined,
      })),
    };

    return NextResponse.json(tournament);
  } catch (error) {
    handleDbError(error);
  }
}

// PATCH update tournament
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { currentPhase, currentRound } = body;

    await sql`
      UPDATE tournaments
      SET current_phase = ${currentPhase},
          current_round = ${currentRound}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    handleDbError(error);
  }
}

// DELETE tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // CASCADE will automatically delete teams and matches
    await sql`DELETE FROM tournaments WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    handleDbError(error);
  }
}

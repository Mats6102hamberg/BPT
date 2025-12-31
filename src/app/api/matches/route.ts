import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError, generateId } from '@/lib/db-client';

// POST create new match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, round, team1Id, team2Id, cupType, courtNumber } = body;

    const id = generateId();

    await sql`
      INSERT INTO matches (
        id, tournament_id, round, team1_id, team2_id,
        is_completed, cup_type, court_number
      )
      VALUES (
        ${id}, ${tournamentId}, ${round}, ${team1Id}, ${team2Id},
        false, ${cupType || null}, ${courtNumber || null}
      )
    `;

    const match = {
      id,
      round,
      team1Id,
      team2Id,
      isCompleted: false,
      cupType: cupType || undefined,
      courtNumber: courtNumber || undefined,
    };

    return NextResponse.json(match);
  } catch (error) {
    handleDbError(error);
  }
}

// PATCH update match result
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, team1Score, team2Score, winnerId, isCompleted } = body;

    await sql`
      UPDATE matches
      SET team1_score = ${team1Score},
          team2_score = ${team2Score},
          winner_id = ${winnerId || null},
          is_completed = ${isCompleted}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    handleDbError(error);
  }
}

// DELETE match
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
    }

    await sql`DELETE FROM matches WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    handleDbError(error);
  }
}

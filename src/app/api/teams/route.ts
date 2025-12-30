import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError, generateId } from '@/lib/db-client';

// POST create new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, name, players, contactInfo } = body;

    const id = generateId();

    await sql`
      INSERT INTO teams (
        id, tournament_id, name, players, contact_info,
        wins, losses, points, buchholz, opponents
      )
      VALUES (
        ${id}, ${tournamentId}, ${name}, ${JSON.stringify(players)}, ${contactInfo || null},
        0, 0, 0, 0, '[]'::jsonb
      )
    `;

    const team = {
      id,
      name,
      players,
      contactInfo,
      wins: 0,
      losses: 0,
      points: 0,
      buchholz: 0,
      opponents: [],
    };

    return NextResponse.json(team);
  } catch (error) {
    handleDbError(error);
  }
}

// PATCH update team
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, wins, losses, points, buchholz, opponents } = body;

    await sql`
      UPDATE teams
      SET wins = ${wins},
          losses = ${losses},
          points = ${points},
          buchholz = ${buchholz},
          opponents = ${JSON.stringify(opponents)}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    handleDbError(error);
  }
}

// DELETE team
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    await sql`DELETE FROM teams WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    handleDbError(error);
  }
}

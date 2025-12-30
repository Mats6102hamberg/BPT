import { NextRequest, NextResponse } from 'next/server';
import { sql, handleDbError, generateId } from '@/lib/db-client';

// GET all announcements
export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM announcements
      ORDER BY created_at DESC
    `;

    const announcements = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      message: row.message,
      tournamentId: row.tournament_id,
      tournamentName: row.tournament_name,
      priority: row.priority,
      createdAt: row.created_at,
      readBy: row.read_by,
    }));

    return NextResponse.json(announcements);
  } catch (error) {
    handleDbError(error);
  }
}

// POST create new announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, tournamentId, tournamentName, priority } = body;

    const id = generateId();
    const createdAt = Date.now();

    await sql`
      INSERT INTO announcements (
        id, title, message, tournament_id, tournament_name,
        priority, created_at, read_by
      )
      VALUES (
        ${id}, ${title}, ${message},
        ${tournamentId || null}, ${tournamentName || null},
        ${priority}, ${createdAt}, '[]'::jsonb
      )
    `;

    const announcement = {
      id,
      title,
      message,
      tournamentId,
      tournamentName,
      priority,
      createdAt,
      readBy: [],
    };

    return NextResponse.json(announcement);
  } catch (error) {
    handleDbError(error);
  }
}

// PATCH mark announcement as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId = 'user' } = body;

    // Get current readBy array
    const result = await sql`
      SELECT read_by FROM announcements WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const currentReadBy = result.rows[0].read_by || [];

    // Add userId if not already present
    if (!currentReadBy.includes(userId)) {
      const updatedReadBy = [...currentReadBy, userId];

      await sql`
        UPDATE announcements
        SET read_by = ${JSON.stringify(updatedReadBy)}
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    handleDbError(error);
  }
}

// DELETE announcement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
    }

    await sql`DELETE FROM announcements WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    handleDbError(error);
  }
}

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Test database connection
    const result = await sql`SELECT NOW() as current_time`;

    // Check if tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    // Count records in each table
    let counts: any = {};
    try {
      const tournamentCount = await sql`SELECT COUNT(*) as count FROM tournaments`;
      counts.tournaments = tournamentCount.rows[0].count;
    } catch {
      counts.tournaments = 'Table not found';
    }

    try {
      const announcementCount = await sql`SELECT COUNT(*) as count FROM announcements`;
      counts.announcements = announcementCount.rows[0].count;
    } catch {
      counts.announcements = 'Table not found';
    }

    return NextResponse.json({
      status: 'ok',
      database_time: result.rows[0].current_time,
      tables: tables.rows.map(t => t.table_name),
      record_counts: counts,
      message: 'Database connection successful!',
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Database connection failed!',
      },
      { status: 500 }
    );
  }
}

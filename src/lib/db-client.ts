import { sql } from '@vercel/postgres';

export { sql };

// Helper function to handle database errors
export function handleDbError(error: unknown): never {
  console.error('Database error:', error);
  throw new Error(error instanceof Error ? error.message : 'Database operation failed');
}

// Helper to generate IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

import { create } from 'zustand';
import { Tournament, Team, Match } from '@/types/tournament';
import { tournamentDB } from '@/lib/db';
import { generateSwissPairings, updateTeamRecords } from '@/lib/swiss-system';

interface TournamentStore {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTournaments: () => Promise<void>;
  createTournament: (tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Tournament>;
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  selectTournament: (id: string | null) => Promise<void>;

  // Team actions
  addTeam: (tournamentId: string, team: Omit<Team, 'id' | 'wins' | 'losses' | 'points' | 'buchholz' | 'opponents'>) => Promise<void>;
  removeTeam: (tournamentId: string, teamId: string) => Promise<void>;

  // Match actions
  startSwissRound: (tournamentId: string) => Promise<void>;
  registerMatchResult: (tournamentId: string, matchId: string, winnerId: string, team1Score: number, team2Score: number) => Promise<void>;

  // Utility
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;
}

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  tournaments: [],
  currentTournament: null,
  isLoading: false,
  error: null,

  loadTournaments: async () => {
    set({ isLoading: true, error: null });
    try {
      const tournaments = await tournamentDB.getAllTournaments();
      set({ tournaments, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createTournament: async (tournamentData) => {
    set({ isLoading: true, error: null });
    try {
      const now = Date.now();
      const tournament: Tournament = {
        ...tournamentData,
        id: now.toString(),
        createdAt: now,
        updatedAt: now,
      };

      await tournamentDB.saveTournament(tournament);
      set((state) => ({
        tournaments: [tournament, ...state.tournaments],
        isLoading: false,
      }));

      return tournament;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateTournament: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const tournament = await tournamentDB.getTournament(id);
      if (!tournament) throw new Error('Tournament not found');

      const updated = { ...tournament, ...updates, updatedAt: Date.now() };
      await tournamentDB.saveTournament(updated);

      set((state) => ({
        tournaments: state.tournaments.map((t) => (t.id === id ? updated : t)),
        currentTournament: state.currentTournament?.id === id ? updated : state.currentTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteTournament: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await tournamentDB.deleteTournament(id);
      set((state) => ({
        tournaments: state.tournaments.filter((t) => t.id !== id),
        currentTournament: state.currentTournament?.id === id ? null : state.currentTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  selectTournament: async (id) => {
    if (!id) {
      set({ currentTournament: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const tournament = await tournamentDB.getTournament(id);
      set({ currentTournament: tournament, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addTeam: async (tournamentId, teamData) => {
    set({ isLoading: true, error: null });
    try {
      const tournament = await tournamentDB.getTournament(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      const team: Team = {
        ...teamData,
        id: Date.now().toString(),
        wins: 0,
        losses: 0,
        points: 0,
        buchholz: 0,
        opponents: [],
      };

      const updated = {
        ...tournament,
        teams: [...tournament.teams, team],
        updatedAt: Date.now(),
      };

      await tournamentDB.saveTournament(updated);

      set((state) => ({
        tournaments: state.tournaments.map((t) => (t.id === tournamentId ? updated : t)),
        currentTournament: state.currentTournament?.id === tournamentId ? updated : state.currentTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  removeTeam: async (tournamentId, teamId) => {
    set({ isLoading: true, error: null });
    try {
      const tournament = await tournamentDB.getTournament(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      const updated = {
        ...tournament,
        teams: tournament.teams.filter((t) => t.id !== teamId),
        updatedAt: Date.now(),
      };

      await tournamentDB.saveTournament(updated);

      set((state) => ({
        tournaments: state.tournaments.map((t) => (t.id === tournamentId ? updated : t)),
        currentTournament: state.currentTournament?.id === tournamentId ? updated : state.currentTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  startSwissRound: async (tournamentId) => {
    set({ isLoading: true, error: null });
    try {
      const tournament = await tournamentDB.getTournament(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      const newMatches = generateSwissPairings(tournament);
      const updated = {
        ...tournament,
        matches: [...tournament.matches, ...newMatches],
        currentRound: tournament.currentRound + 1,
        currentPhase: 'swiss' as const,
        updatedAt: Date.now(),
      };

      await tournamentDB.saveTournament(updated);

      set((state) => ({
        tournaments: state.tournaments.map((t) => (t.id === tournamentId ? updated : t)),
        currentTournament: state.currentTournament?.id === tournamentId ? updated : state.currentTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  registerMatchResult: async (tournamentId, matchId, winnerId, team1Score, team2Score) => {
    set({ isLoading: true, error: null });
    try {
      const tournament = await tournamentDB.getTournament(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      const matchIndex = tournament.matches.findIndex((m) => m.id === matchId);
      if (matchIndex === -1) throw new Error('Match not found');

      const updatedMatch: Match = {
        ...tournament.matches[matchIndex],
        team1Score,
        team2Score,
        winnerId,
        isCompleted: true,
      };

      const matches = [...tournament.matches];
      matches[matchIndex] = updatedMatch;

      let updated = { ...tournament, matches };
      updated = updateTeamRecords(updated, updatedMatch);
      updated.updatedAt = Date.now();

      await tournamentDB.saveTournament(updated);

      set((state) => ({
        tournaments: state.tournaments.map((t) => (t.id === tournamentId ? updated : t)),
        currentTournament: state.currentTournament?.id === tournamentId ? updated : state.currentTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  exportData: async () => {
    return tournamentDB.exportData();
  },

  importData: async (jsonData) => {
    set({ isLoading: true, error: null });
    try {
      await tournamentDB.importData(jsonData);
      await get().loadTournaments();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));

import { create } from 'zustand';
import { Tournament, Team, Match } from '@/types/tournament';
import { generateSwissPairings, updateTeamRecords } from '@/lib/swiss-system';

interface TournamentStore {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTournaments: () => Promise<void>;
  createTournament: (tournament: Omit<Tournament, 'id'>) => Promise<Tournament>;
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
      const response = await fetch('/api/tournaments');
      if (!response.ok) throw new Error('Failed to load tournaments');
      const tournaments = await response.json();
      set({ tournaments, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createTournament: async (tournamentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tournamentData),
      });

      if (!response.ok) throw new Error('Failed to create tournament');
      const tournament = await response.json();

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
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update tournament');

      // Reload tournaments to get fresh data
      await get().loadTournaments();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteTournament: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete tournament');

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
      const response = await fetch(`/api/tournaments/${id}`);
      if (!response.ok) throw new Error('Failed to load tournament');
      const tournament = await response.json();
      set({ currentTournament: tournament, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addTeam: async (tournamentId, teamData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...teamData, tournamentId }),
      });

      if (!response.ok) throw new Error('Failed to add team');

      // Reload tournament to get fresh data
      await get().selectTournament(tournamentId);
      await get().loadTournaments();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  removeTeam: async (tournamentId, teamId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/teams?id=${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove team');

      // Reload tournament to get fresh data
      await get().selectTournament(tournamentId);
      await get().loadTournaments();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  startSwissRound: async (tournamentId) => {
    set({ isLoading: true, error: null });
    try {
      // Get current tournament
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) throw new Error('Failed to load tournament');
      const tournament = await response.json();

      // Generate pairings
      const newMatches = generateSwissPairings(tournament);

      // Create matches in database
      for (const match of newMatches) {
        await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournamentId,
            round: match.round,
            team1Id: match.team1Id,
            team2Id: match.team2Id,
          }),
        });
      }

      // Update tournament phase and round
      await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPhase: 'swiss',
          currentRound: tournament.currentRound + 1,
        }),
      });

      // Reload tournament
      await get().selectTournament(tournamentId);
      await get().loadTournaments();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  registerMatchResult: async (tournamentId, matchId, winnerId, team1Score, team2Score) => {
    set({ isLoading: true, error: null });
    try {
      // Get current tournament
      const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`);
      if (!tournamentResponse.ok) throw new Error('Failed to load tournament');
      const tournament = await tournamentResponse.json();

      // Find the match
      const match = tournament.matches.find((m: Match) => m.id === matchId);
      if (!match) throw new Error('Match not found');

      // Update match
      await fetch('/api/matches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: matchId,
          team1Score,
          team2Score,
          winnerId,
          isCompleted: true,
        }),
      });

      // Update team records
      const updatedMatch: Match = {
        ...match,
        team1Score,
        team2Score,
        winnerId,
        isCompleted: true,
      };

      const updatedTournament = updateTeamRecords(tournament, updatedMatch);

      // Update all teams
      for (const team of updatedTournament.teams) {
        await fetch('/api/teams', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: team.id,
            wins: team.wins,
            losses: team.losses,
            points: team.points,
            buchholz: team.buchholz,
            opponents: team.opponents,
          }),
        });
      }

      // Reload tournament
      await get().selectTournament(tournamentId);
      await get().loadTournaments();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  exportData: async () => {
    const tournaments = get().tournaments;
    return JSON.stringify(tournaments, null, 2);
  },

  importData: async (jsonData) => {
    set({ isLoading: true, error: null });
    try {
      const tournaments = JSON.parse(jsonData);

      // Import each tournament
      for (const tournamentData of tournaments) {
        // Create tournament
        const response = await fetch('/api/tournaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: tournamentData.name,
            date: tournamentData.date,
            settings: tournamentData.settings,
            currentPhase: tournamentData.currentPhase,
            currentRound: tournamentData.currentRound,
          }),
        });

        if (!response.ok) continue;
        const tournament = await response.json();

        // Add teams
        for (const team of tournamentData.teams) {
          await fetch('/api/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tournamentId: tournament.id,
              name: team.name,
              players: team.players,
              contactInfo: team.contactInfo,
            }),
          });
        }

        // Note: Matches would need to be recreated through swiss rounds
      }

      await get().loadTournaments();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));

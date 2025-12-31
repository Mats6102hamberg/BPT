export type TeamType = 'singel' | 'dubbel' | 'trippel';
export type AgeCategory = 'öppen' | 'V55' | 'V65' | 'V75';
export type TournamentPhase = 'setup' | 'swiss' | 'cup' | 'finished';

export interface Player {
  name: string;
  licenseNumber?: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  contactInfo?: string;
  wins: number;
  losses: number;
  points: number;
  buchholz: number;
  opponents: string[]; // Team IDs of opponents faced
}

export interface Match {
  id: string;
  round: number;
  team1Id: string;
  team2Id: string;
  team1Score?: number;
  team2Score?: number;
  isCompleted: boolean;
  winnerId?: string;
  cupType?: 'A' | 'B'; // For cup matches (A or B tournament)
  courtNumber?: string; // Court/field number (bannummer)
}

export interface TournamentSettings {
  teamType: TeamType;
  ageCategory: AgeCategory;
  swissRounds: number;
  teamsPerPool: number;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  teams: Team[];
  matches: Match[];
  settings: TournamentSettings;
  currentPhase: TournamentPhase;
  currentRound: number;
  createdAt?: number;
  updatedAt?: number;
}

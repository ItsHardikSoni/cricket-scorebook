export type WicketType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'run_out'
  | 'stumped'
  | 'hit_wicket'
  | 'retired_hurt'
  | 'retired_out'
  | 'obstructing_the_field';

export type ExtraType = 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'penalty';

export type ShotDirection =
  | 'third_man'
  | 'point'
  | 'cover'
  | 'mid_off'
  | 'straight'
  | 'mid_on'
  | 'mid_wicket'
  | 'fine_leg';

export type MatchFormat = 'T10' | 'T20' | 'ODI' | 'Custom';

export type TossDecision = 'bat' | 'bowl';

export type MatchStatus = 'upcoming' | 'innings1' | 'innings_break' | 'innings2' | 'completed' | 'abandoned';

export interface Player {
  id: string;
  name: string;
  role?: 'batsman' | 'bowler' | 'all_rounder' | 'wicketkeeper';
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isWicketkeeper?: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color?: string;
  players: Player[];
  createdAt: number;
}

export interface WicketDetails {
  playerOutId: string;
  wicketType: WicketType;
  bowlerId: string;
  fielderId?: string; // For caught / stumped / run out
  runOutRunsCompleted?: number; // Runs completed before run out
  description?: string;
}

export interface Delivery {
  id: string;
  matchId: string;
  inningsIndex: 1 | 2;
  overIndex: number; // 0-based over number (e.g. 0 for 1st over)
  ballInOver: number; // 1-based legal ball number or delivery index
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runsBat: number; // Runs off the bat (0, 1, 2, 3, 4, 6)
  extraRuns: number; // 1 for wide/no_ball plus any extra
  extraType?: ExtraType;
  shotDirection?: ShotDirection;
  isLegal: boolean; // false for wide and no_ball
  wicket?: WicketDetails;
  timestamp: number;
}

export interface InningsState {
  teamBattingId: string;
  teamBowlingId: string;
  deliveries: Delivery[];
  currentStrikerId: string;
  currentNonStrikerId: string;
  currentBowlerId: string;
  isCompleted: boolean;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  overs: string;
  playerId: string;
  playerName: string;
}

export interface BatterScorecard {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalText: string;
  isBatting: boolean;
}

export interface BowlerScorecard {
  playerId: string;
  playerName: string;
  overs: string; // e.g. "3.2"
  legalBalls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  wides: number;
  noBalls: number;
}

export interface ExtrasBreakdown {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalty: number;
  total: number;
}

export interface CalculatedInnings {
  totalRuns: number;
  totalWickets: number;
  totalLegalBalls: number;
  oversFormatted: string; // e.g. "14.2"
  runRate: number;
  extras: ExtrasBreakdown;
  batters: BatterScorecard[];
  bowlers: BowlerScorecard[];
  fallOfWickets: FallOfWicket[];
  currentOverDeliveries: Delivery[];
  isAllOut: boolean;
}

export interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  team1PlayingXI: string[]; // Player IDs
  team2PlayingXI: string[]; // Player IDs
  format: MatchFormat;
  overs: number;
  venue: string;
  date: string;
  tossWinnerId: string;
  tossDecision: TossDecision;
  status: MatchStatus;
  innings1: InningsState;
  innings2?: InningsState;
  target?: number;
  result?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  darkMode: boolean;
  defaultFormat: MatchFormat;
  defaultOvers: number;
  confirmWicket: boolean;
  soundVibration: boolean;
}

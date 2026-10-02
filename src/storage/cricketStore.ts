import { Colors } from '@/constants/colors';
import { calculateInnings, determineNextStrike } from '@/engine/scoringEngine';
import {
  AppSettings,
  Delivery,
  ExtraType,
  InningsState,
  Match,
  MatchStatus,
  Player,
  Team,
  WicketDetails,
} from '@/types/cricket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEYS = {
  TEAMS: '@cricket_teams_v1',
  MATCHES: '@cricket_matches_v1',
  ACTIVE_MATCH_ID: '@cricket_active_match_id_v1',
  SETTINGS: '@cricket_settings_v1',
};

const LEGACY_SAMPLE_MATCH_ID = 'match_sample_1';
const LEGACY_SAMPLE_TEAM_IDS = new Set(['team_muzaffarpur', 'team_patna', 'team_delhi']);

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  defaultFormat: 'T20',
  defaultOvers: 20,
  confirmWicket: true,
  soundVibration: true,
};

interface CricketState {
  teams: Team[];
  matches: Match[];
  activeMatchId: string | null;
  settings: AppSettings;
  isInitialized: boolean;

  // Lifecycle
  initStore: () => Promise<void>;
  resetAllData: () => Promise<void>;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;

  // Team Actions
  createTeam: (teamData: { name: string; shortName: string; color?: string; players: Omit<Player, 'id'>[] }) => Promise<Team>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addPlayerToTeam: (teamId: string, player: Omit<Player, 'id'>) => Promise<void>;
  removePlayerFromTeam: (teamId: string, playerId: string) => Promise<void>;

  // Match Actions
  setActiveMatch: (matchId: string | null) => Promise<void>;
  createMatch: (params: {
    team1Id: string;
    team2Id: string;
    team1PlayingXI: string[];
    team2PlayingXI: string[];
    format: Match['format'];
    overs: number;
    venue: string;
    date: string;
    tossWinnerId: string;
    tossDecision: Match['tossDecision'];
    strikerId: string;
    nonStrikerId: string;
    bowlerId: string;
  }) => Promise<Match>;

  deleteMatch: (matchId: string) => Promise<void>;
  finishMatch: (matchId: string, customResult?: string) => Promise<void>;

  // Live Scoring Actions
  recordDelivery: (params: {
    runsBat: number;
    extraRuns: number;
    extraType?: ExtraType;
    isLegal: boolean;
    wicket?: WicketDetails;
    newBatsmanId?: string;
  }) => Promise<{ overCompleted: boolean; inningsEnded: boolean; matchEnded: boolean }>;

  undoLastDelivery: () => Promise<void>;
  swapStrike: () => Promise<void>;
  setBowler: (bowlerId: string) => Promise<void>;
  setStriker: (strikerId: string) => Promise<void>;
  setNonStriker: (nonStrikerId: string) => Promise<void>;
  startSecondInnings: (strikerId: string, nonStrikerId: string, bowlerId: string) => Promise<void>;

  // Selectors
  getActiveMatch: () => Match | undefined;
  getTeamById: (id: string) => Team | undefined;
  getPlayerById: (id: string) => Player | undefined;
}

export const useCricketStore = create<CricketState>((set, get) => ({
  teams: [],
  matches: [],
  activeMatchId: null,
  settings: DEFAULT_SETTINGS,
  isInitialized: false,

  initStore: async () => {
    try {
      const [storedTeams, storedMatches, storedActiveId, storedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TEAMS),
        AsyncStorage.getItem(STORAGE_KEYS.MATCHES),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MATCH_ID),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      const loadedTeams: Team[] = storedTeams ? JSON.parse(storedTeams) : [];
      const loadedMatches: Match[] = storedMatches ? JSON.parse(storedMatches) : [];
      const matches = loadedMatches.filter((match) => match.id !== LEGACY_SAMPLE_MATCH_ID);
      const referencedTeamIds = new Set(matches.flatMap((match) => [match.team1Id, match.team2Id]));
      const teams = loadedTeams.filter(
        (team) => !LEGACY_SAMPLE_TEAM_IDS.has(team.id) || referencedTeamIds.has(team.id)
      );
      const requestedActiveMatchId: string | null = storedActiveId ? JSON.parse(storedActiveId) : null;
      const isActiveMatch = (match: Match) =>
        match.status === 'innings1' || match.status === 'innings2' || match.status === 'innings_break';
      const activeMatchId =
        matches.find((match) => match.id === requestedActiveMatchId && isActiveMatch(match))?.id ||
        matches.find(isActiveMatch)?.id ||
        null;
      const settings: AppSettings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams)),
        AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches)),
        AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH_ID, JSON.stringify(activeMatchId)),
        AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)),
      ]);

      set({
        teams,
        matches,
        activeMatchId,
        settings,
        isInitialized: true,
      });
    } catch (e) {
      console.error('Failed to initialize cricket store:', e);
      set({
        teams: [],
        matches: [],
        activeMatchId: null,
        settings: DEFAULT_SETTINGS,
        isInitialized: true,
      });
    }
  },

  resetAllData: async () => {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify([])),
      AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify([])),
      AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH_ID, JSON.stringify(null)),
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS)),
    ]);

    set({
      teams: [],
      matches: [],
      activeMatchId: null,
      settings: DEFAULT_SETTINGS,
    });
  },

  updateSettings: async (updates) => {
    const current = get().settings;
    const newSettings = { ...current, ...updates };
    set({ settings: newSettings });
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  },

  createTeam: async ({ name, shortName, color, players }) => {
    const newTeamId = `team_${Date.now()}`;
    const newTeam: Team = {
      id: newTeamId,
      name,
      shortName: shortName.toUpperCase(),
      color: color || Colors.primary,
      createdAt: Date.now(),
      players: players.map((p, idx) => ({
        ...p,
        id: `p_${newTeamId}_${idx + 1}`,
      })),
    };

    const updatedTeams = [newTeam, ...get().teams];
    set({ teams: updatedTeams });
    await AsyncStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updatedTeams));
    return newTeam;
  },

  updateTeam: async (teamId, updates) => {
    const updatedTeams = get().teams.map((t) => (t.id === teamId ? { ...t, ...updates } : t));
    set({ teams: updatedTeams });
    await AsyncStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updatedTeams));
  },

  deleteTeam: async (teamId) => {
    const updatedTeams = get().teams.filter((t) => t.id !== teamId);
    set({ teams: updatedTeams });
    await AsyncStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updatedTeams));
  },

  addPlayerToTeam: async (teamId, player) => {
    const updatedTeams = get().teams.map((t) => {
      if (t.id === teamId) {
        const newPlayer: Player = {
          ...player,
          id: `p_${teamId}_${Date.now()}`,
        };
        return { ...t, players: [...t.players, newPlayer] };
      }
      return t;
    });
    set({ teams: updatedTeams });
    await AsyncStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updatedTeams));
  },

  removePlayerFromTeam: async (teamId, playerId) => {
    const updatedTeams = get().teams.map((t) => {
      if (t.id === teamId) {
        return { ...t, players: t.players.filter((p) => p.id !== playerId) };
      }
      return t;
    });
    set({ teams: updatedTeams });
    await AsyncStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updatedTeams));
  },

  setActiveMatch: async (matchId) => {
    set({ activeMatchId: matchId });
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH_ID, JSON.stringify(matchId));
  },

  createMatch: async (params) => {
    const matchId = `match_${Date.now()}`;
    const battingFirstId =
      (params.tossWinnerId === params.team1Id && params.tossDecision === 'bat') ||
      (params.tossWinnerId === params.team2Id && params.tossDecision === 'bowl')
        ? params.team1Id
        : params.team2Id;

    const bowlingFirstId = battingFirstId === params.team1Id ? params.team2Id : params.team1Id;

    const initialInnings: InningsState = {
      teamBattingId: battingFirstId,
      teamBowlingId: bowlingFirstId,
      deliveries: [],
      currentStrikerId: params.strikerId,
      currentNonStrikerId: params.nonStrikerId,
      currentBowlerId: params.bowlerId,
      isCompleted: false,
    };

    const newMatch: Match = {
      id: matchId,
      team1Id: params.team1Id,
      team2Id: params.team2Id,
      team1PlayingXI: params.team1PlayingXI,
      team2PlayingXI: params.team2PlayingXI,
      format: params.format,
      overs: params.overs,
      venue: params.venue.trim(),
      date: params.date.trim(),
      tossWinnerId: params.tossWinnerId,
      tossDecision: params.tossDecision,
      status: 'innings1',
      innings1: initialInnings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedMatches = [newMatch, ...get().matches];
    set({ matches: updatedMatches, activeMatchId: matchId });
    await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updatedMatches));
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH_ID, JSON.stringify(matchId));
    return newMatch;
  },

  deleteMatch: async (matchId) => {
    const updatedMatches = get().matches.filter((m) => m.id !== matchId);
    const newActiveId = get().activeMatchId === matchId ? null : get().activeMatchId;
    set({ matches: updatedMatches, activeMatchId: newActiveId });
    await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updatedMatches));
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH_ID, JSON.stringify(newActiveId));
  },

  finishMatch: async (matchId, customResult) => {
    const match = get().matches.find((m) => m.id === matchId);
    if (!match) return;

    let result = customResult;
    if (!result) {
      result = 'Match Concluded';
    }

    const updatedMatches = get().matches.map((m) =>
      m.id === matchId ? { ...m, status: 'completed' as MatchStatus, result, updatedAt: Date.now() } : m
    );
    set({ matches: updatedMatches });
    await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updatedMatches));
  },

  recordDelivery: async ({ runsBat, extraRuns, extraType, isLegal, wicket, newBatsmanId }) => {
    const state = get();
    const match = state.getActiveMatch();
    if (!match) return { overCompleted: false, inningsEnded: false, matchEnded: false };

    const isInnings1 = match.status === 'innings1' || (match.status === 'innings_break' && !match.innings2);
    const currentInnings = isInnings1 ? match.innings1 : match.innings2;
    if (!currentInnings) return { overCompleted: false, inningsEnded: false, matchEnded: false };

    const battingTeamId = currentInnings.teamBattingId;
    const bowlingTeamId = currentInnings.teamBowlingId;
    const battingTeam = state.getTeamById(battingTeamId);
    const bowlingTeam = state.getTeamById(bowlingTeamId);

    // Calculate legal balls in current over before this ball
    let currentOverLegalBallsBefore = 0;
    const currentOverIdx = Math.floor(
      currentInnings.deliveries.filter((d) => d.isLegal).length / 6
    );
    const deliveriesInThisOverBefore = currentInnings.deliveries.filter(
      (d) => d.overIndex === currentOverIdx && d.isLegal
    );
    currentOverLegalBallsBefore = deliveriesInThisOverBefore.length;

    const deliveryId = `d_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDelivery: Delivery = {
      id: deliveryId,
      matchId: match.id,
      inningsIndex: isInnings1 ? 1 : 2,
      overIndex: currentOverIdx,
      ballInOver: currentOverLegalBallsBefore + (isLegal ? 1 : 0),
      strikerId: currentInnings.currentStrikerId,
      nonStrikerId: currentInnings.currentNonStrikerId,
      bowlerId: currentInnings.currentBowlerId,
      runsBat,
      extraRuns,
      extraType,
      isLegal,
      wicket,
      timestamp: Date.now(),
    };

    const newDeliveries = [...currentInnings.deliveries, newDelivery];

    // Determine new strike rotation
    const strikeResult = determineNextStrike(
      currentInnings.currentStrikerId,
      currentInnings.currentNonStrikerId,
      runsBat,
      extraRuns,
      extraType,
      isLegal,
      currentOverLegalBallsBefore,
      wicket?.wicketType,
      wicket?.playerOutId,
      newBatsmanId
    );

    const updatedInnings: InningsState = {
      ...currentInnings,
      deliveries: newDeliveries,
      currentStrikerId: strikeResult.strikerId,
      currentNonStrikerId: strikeResult.nonStrikerId,
    };

    // Calculate updated innings to test end of innings / match
    const battingPlayers = battingTeam?.players || [];
    const bowlingPlayers = bowlingTeam?.players || [];
    const calc = calculateInnings(
      updatedInnings,
      battingPlayers,
      bowlingPlayers,
      match.overs,
      match.team1PlayingXI.length || 11
    );

    let inningsEnded = false;
    let matchEnded = false;
    let updatedStatus: MatchStatus = match.status;
    let matchResult = match.result;
    let target = match.target;

    const oversFinished = calc.totalLegalBalls >= match.overs * 6;

    if (isInnings1) {
      if (calc.isAllOut || oversFinished) {
        inningsEnded = true;
        updatedInnings.isCompleted = true;
        updatedStatus = 'innings_break';
        target = calc.totalRuns + 1;
      }
    } else {
      // Innings 2
      const targetScore = match.target || 0;
      if (calc.totalRuns >= targetScore && targetScore > 0) {
        // Chasing team won!
        matchEnded = true;
        inningsEnded = true;
        updatedInnings.isCompleted = true;
        updatedStatus = 'completed';
        const battingXICount = battingTeam?.players.length || match.team1PlayingXI.length || 11;
        const wicketsRemaining = Math.max(0, battingXICount - calc.totalWickets - 1);
        matchResult = `${battingTeam?.name || 'Chasing team'} won by ${wicketsRemaining} wicket${wicketsRemaining === 1 ? '' : 's'}`;
      } else if (calc.isAllOut || oversFinished) {
        matchEnded = true;
        inningsEnded = true;
        updatedInnings.isCompleted = true;
        updatedStatus = 'completed';

        if (calc.totalRuns === targetScore - 1) {
          matchResult = 'Match Tied';
        } else {
          const runsShort = targetScore - calc.totalRuns;
          matchResult = `${bowlingTeam?.name || 'Defending team'} won by ${runsShort} run${runsShort === 1 ? '' : 's'}`;
        }
      }
    }

    const updatedMatch: Match = {
      ...match,
      status: updatedStatus,
      result: matchResult,
      target,
      updatedAt: Date.now(),
      innings1: isInnings1 ? updatedInnings : match.innings1,
      innings2: !isInnings1 ? updatedInnings : match.innings2,
    };

    const updatedMatches = state.matches.map((m) => (m.id === match.id ? updatedMatch : m));
    set({ matches: updatedMatches });
    await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updatedMatches));

    return {
      overCompleted: strikeResult.overCompleted,
      inningsEnded,
      matchEnded,
    };
  },

  undoLastDelivery: async () => {
    const state = get();
    const match = state.getActiveMatch();
    if (!match) return;

    const isInnings1 = match.status === 'innings1' || (match.status === 'innings_break' && !match.innings2);
    const currentInnings = isInnings1 ? match.innings1 : match.innings2;
    if (!currentInnings || currentInnings.deliveries.length === 0) return;

    const newDeliveries = currentInnings.deliveries.slice(0, -1);
    const lastDelivery = currentInnings.deliveries[currentInnings.deliveries.length - 1];

    // Restore previous striker/non-striker/bowler
    const restoredStrikerId = lastDelivery.strikerId;
    const restoredNonStrikerId = lastDelivery.nonStrikerId;
    const restoredBowlerId = lastDelivery.bowlerId;

    const updatedInnings: InningsState = {
      ...currentInnings,
      deliveries: newDeliveries,
      currentStrikerId: restoredStrikerId,
      currentNonStrikerId: restoredNonStrikerId,
      currentBowlerId: restoredBowlerId,
      isCompleted: false,
    };

    // Revert match status if it had completed or paused
    const updatedStatus: MatchStatus = isInnings1 ? 'innings1' : 'innings2';

    const updatedMatch: Match = {
      ...match,
      status: updatedStatus,
      result: undefined,
      updatedAt: Date.now(),
      innings1: isInnings1 ? updatedInnings : match.innings1,
      innings2: !isInnings1 ? updatedInnings : match.innings2,
    };

    const updatedMatches = state.matches.map((m) => (m.id === match.id ? updatedMatch : m));
    set({ matches: updatedMatches });
    await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updatedMatches));
  },

  swapStrike: async () => {
    const state = get();
    const match = state.getActiveMatch();
    if (!match) return;

    const isInnings1 = match.status === 'innings1' || (match.status === 'innings_break' && !match.innings2);
    const currentInnings = isInnings1 ? match.innings1 : match.innings2;
    if (!currentInnings) return;

    const updatedInnings: InningsState = {
      ...currentInnings,
      currentStrikerId: currentInnings.currentNonStrikerId,
      currentNonStrikerId: currentInnings.currentStrikerId,
    };

    const updatedMatch: Match = {
      ...match,
      innings1: isInnings1 ? updatedInnings : match.innings1,
      innings2: !isInnings1 ? updatedInnings : match.innings2,
      updatedAt: Date.now(),
    };

    const updatedMatches = state.matches.map((m) => (m.id === match.id ? updatedMatch : m));
    set({ matches: updatedMatches });
    await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updatedMatches));
  },

  setBowler: async (bowlerId) => {
    const state = get();
    const match = state.getActiveMatch();
    if (!match) return;

    const isInnings1 = match.status === 'innings1' || (match.status === 'innings_break' && !match.innings2);
    const currentInnings = isInnings1 ? match.innings1 : match.innings2;
    if (!currentInnings) return;

    const updatedInnings: InningsState = {
      ...currentInnings,
      currentBowlerId: bowlerId,
    };

    const updatedMatch: Match = {
      ...match,
      innings1: isInnings1 ? updatedInnings : match.innings1,
      innings2: !isInnings1 ? updatedInnings : match.innings2,
      updatedAt: Date.now(),
    };

    const updatedMatches = state.matches.map((m) => (m.id === match.id ? updatedMatch : m));
    set({ matches: updatedMatches });
    await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updatedMatches));
  },

  setStriker: async (strikerId) => {
    const state = get();
    const match = state.getActiveMatch();
    if (!match) return;

    const isInnings1 = match.status === 'innings1' || (match.status === 'innings_break' && !match.innings2);
    const currentInnings = isInnings1 ? match.innings1 : match.innings2;
    if (!currentInnings) return;

    const updatedInnings: InningsState = {
      ...currentInnings,
      currentStrikerId: strikerId,
    };

    const updatedMatch: Match = {
      ...match,
      innings1: isInnings1 ? updatedInnings : match.innings1,
      innings2: !isInnings1 ? updatedInnings : match.innings2,
      updatedAt: Date.now(),
    };

    const updatedMatches = state.matches.map((m) => (m.id === match.id ? updatedMatch : m));
    set({ matches: updatedMatches });
    await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updatedMatches));
  },

  setNonStriker: async (nonStrikerId) => {
    const state = get();
    const match = state.getActiveMatch();
    if (!match) return;

    const isInnings1 = match.status === 'innings1' || (match.status === 'innings_break' && !match.innings2);
    const currentInnings = isInnings1 ? match.innings1 : match.innings2;
    if (!currentInnings) return;

    const updatedInnings: InningsState = {
      ...currentInnings,
      currentNonStrikerId: nonStrikerId,
    };

    const updatedMatch: Match = {
      ...match,
      innings1: isInnings1 ? updatedInnings : match.innings1,
      innings2: !isInnings1 ? updatedInnings : match.innings2,
      updatedAt: Date.now(),
    };

    const updatedMatches = state.matches.map((m) => (m.id === match.id ? updatedMatch : m));
    set({ matches: updatedMatches });
    await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updatedMatches));
  },

  startSecondInnings: async (strikerId, nonStrikerId, bowlerId) => {
    const state = get();
    const match = state.getActiveMatch();
    if (!match) return;

    // Batting and bowling swap
    const teamBattingId = match.innings1.teamBowlingId;
    const teamBowlingId = match.innings1.teamBattingId;

    const innings2: InningsState = {
      teamBattingId,
      teamBowlingId,
      deliveries: [],
      currentStrikerId: strikerId,
      currentNonStrikerId: nonStrikerId,
      currentBowlerId: bowlerId,
      isCompleted: false,
    };

    const updatedMatch: Match = {
      ...match,
      status: 'innings2',
      innings2,
      updatedAt: Date.now(),
    };

    const updatedMatches = state.matches.map((m) => (m.id === match.id ? updatedMatch : m));
    set({ matches: updatedMatches });
    await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updatedMatches));
  },

  getActiveMatch: () => {
    const { matches, activeMatchId } = get();
    if (!activeMatchId) return undefined;
    return matches.find((m) => m.id === activeMatchId);
  },

  getTeamById: (id) => {
    return get().teams.find((t) => t.id === id);
  },

  getPlayerById: (id) => {
    for (const team of get().teams) {
      const p = team.players.find((pl) => pl.id === id);
      if (p) return p;
    }
    return undefined;
  },
}));

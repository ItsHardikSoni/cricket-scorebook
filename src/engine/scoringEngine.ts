import {
  CalculatedInnings,
  Delivery,
  ExtrasBreakdown,
  FallOfWicket,
  BatterScorecard,
  BowlerScorecard,
  InningsState,
  Player,
  WicketType,
} from '@/types/cricket';

export function formatOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

export function calculateRunRate(runs: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  const overs = legalBalls / 6;
  return Number((runs / overs).toFixed(2));
}

export function calculateEconomy(runs: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  const overs = legalBalls / 6;
  return Number((runs / overs).toFixed(2));
}

export function calculateStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return Number(((runs / balls) * 100).toFixed(2));
}

export function isBowlerWicket(wicketType: WicketType): boolean {
  switch (wicketType) {
    case 'bowled':
    case 'caught':
    case 'lbw':
    case 'stumped':
    case 'hit_wicket':
      return true;
    default:
      return false; // run_out, retired_hurt, retired_out, obstructing_the_field
  }
}

export function getDismissalDescription(
  wicketType: WicketType,
  bowlerName: string,
  fielderName?: string
): string {
  switch (wicketType) {
    case 'bowled':
      return `b ${bowlerName}`;
    case 'caught':
      return fielderName ? `c ${fielderName} b ${bowlerName}` : `c & b ${bowlerName}`;
    case 'lbw':
      return `lbw b ${bowlerName}`;
    case 'stumped':
      return fielderName ? `st ${fielderName} b ${bowlerName}` : `st b ${bowlerName}`;
    case 'run_out':
      return fielderName ? `run out (${fielderName})` : `run out`;
    case 'hit_wicket':
      return `hit wicket b ${bowlerName}`;
    case 'retired_hurt':
      return `retired hurt`;
    case 'retired_out':
      return `retired out`;
    case 'obstructing_the_field':
      return `obstructing the field`;
    default:
      return 'out';
  }
}

export function calculateInnings(
  innings: InningsState,
  battingPlayers: Player[],
  bowlingPlayers: Player[],
  totalOversLimit: number = 20,
  playingXICount: number = 11
): CalculatedInnings {
  const deliveries = innings.deliveries;
  const playerMap = new Map<string, Player>();
  battingPlayers.forEach((p) => playerMap.set(p.id, p));
  bowlingPlayers.forEach((p) => playerMap.set(p.id, p));

  let totalRuns = 0;
  let totalWickets = 0;
  let totalLegalBalls = 0;

  const extras: ExtrasBreakdown = {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    penalty: 0,
    total: 0,
  };

  const batterMap = new Map<string, BatterScorecard>();
  const bowlerMap = new Map<string, BowlerScorecard>();
  const fallOfWickets: FallOfWicket[] = [];

  // Track over-by-over runs conceded for maidens
  // Map key: `${bowlerId}-${overIndex}` => runs conceded to bowler
  const bowlerOverRuns = new Map<string, { legalBalls: number; bowlerRuns: number }>();

  // Ensure current striker & non-striker are in batter map
  if (innings.currentStrikerId && playerMap.has(innings.currentStrikerId)) {
    const p = playerMap.get(innings.currentStrikerId)!;
    batterMap.set(p.id, {
      playerId: p.id,
      playerName: p.name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
      dismissalText: 'not out',
      isBatting: true,
    });
  }

  if (innings.currentNonStrikerId && playerMap.has(innings.currentNonStrikerId)) {
    const p = playerMap.get(innings.currentNonStrikerId)!;
    batterMap.set(p.id, {
      playerId: p.id,
      playerName: p.name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
      dismissalText: 'not out',
      isBatting: true,
    });
  }

  // Ensure current bowler is in bowler map
  if (innings.currentBowlerId && playerMap.has(innings.currentBowlerId)) {
    const p = playerMap.get(innings.currentBowlerId)!;
    bowlerMap.set(p.id, {
      playerId: p.id,
      playerName: p.name,
      overs: '0.0',
      legalBalls: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      economy: 0,
      wides: 0,
      noBalls: 0,
    });
  }

  // Process deliveries in order
  for (const delivery of deliveries) {
    const deliveryRuns = delivery.runsBat + delivery.extraRuns;
    totalRuns += deliveryRuns;

    if (delivery.isLegal) {
      totalLegalBalls += 1;
    }

    // Extras
    if (delivery.extraType) {
      extras.total += delivery.extraRuns;
      if (delivery.extraType === 'wide') extras.wides += delivery.extraRuns;
      else if (delivery.extraType === 'no_ball') extras.noBalls += delivery.extraRuns;
      else if (delivery.extraType === 'bye') extras.byes += delivery.extraRuns;
      else if (delivery.extraType === 'leg_bye') extras.legByes += delivery.extraRuns;
      else if (delivery.extraType === 'penalty') extras.penalty += delivery.extraRuns;
    }

    // Batter stats
    const striker = playerMap.get(delivery.strikerId);
    const strikerName = striker ? striker.name : 'Striker';
    let bRecord = batterMap.get(delivery.strikerId);
    if (!bRecord) {
      bRecord = {
        playerId: delivery.strikerId,
        playerName: strikerName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
        dismissalText: 'not out',
        isBatting: false,
      };
      batterMap.set(delivery.strikerId, bRecord);
    }

    // Balls faced count: all deliveries EXCEPT wides
    if (delivery.extraType !== 'wide') {
      bRecord.balls += 1;
    }

    // Runs off the bat (even on no ball, runsBat is credited to batsman)
    bRecord.runs += delivery.runsBat;
    if (delivery.runsBat === 4) bRecord.fours += 1;
    if (delivery.runsBat === 6) bRecord.sixes += 1;
    bRecord.strikeRate = calculateStrikeRate(bRecord.runs, bRecord.balls);

    // Bowler stats
    const bowler = playerMap.get(delivery.bowlerId);
    const bowlerName = bowler ? bowler.name : 'Bowler';
    let bwRecord = bowlerMap.get(delivery.bowlerId);
    if (!bwRecord) {
      bwRecord = {
        playerId: delivery.bowlerId,
        playerName: bowlerName,
        overs: '0.0',
        legalBalls: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        economy: 0,
        wides: 0,
        noBalls: 0,
      };
      bowlerMap.set(delivery.bowlerId, bwRecord);
    }

    if (delivery.isLegal) {
      bwRecord.legalBalls += 1;
    }

    if (delivery.extraType === 'wide') {
      bwRecord.wides += 1;
    }
    if (delivery.extraType === 'no_ball') {
      bwRecord.noBalls += 1;
    }

    // Runs charged to bowler: bat runs + wides + no-balls. (Byes and Leg Byes are NOT charged to bowler).
    let runsChargedToBowler = delivery.runsBat;
    if (delivery.extraType === 'wide' || delivery.extraType === 'no_ball') {
      runsChargedToBowler += delivery.extraRuns;
    }
    bwRecord.runsConceded += runsChargedToBowler;

    // Track for maidens
    const overKey = `${delivery.bowlerId}-${delivery.overIndex}`;
    const overStats = bowlerOverRuns.get(overKey) || { legalBalls: 0, bowlerRuns: 0 };
    if (delivery.isLegal) {
      overStats.legalBalls += 1;
    }
    overStats.bowlerRuns += runsChargedToBowler;
    bowlerOverRuns.set(overKey, overStats);

    // Wicket handling
    if (delivery.wicket) {
      const w = delivery.wicket;
      if (w.wicketType !== 'retired_hurt') {
        totalWickets += 1;
      }

      // Check if bowler gets credit
      if (isBowlerWicket(w.wicketType)) {
        bwRecord.wickets += 1;
      }

      const outPlayer = playerMap.get(w.playerOutId);
      const outPlayerName = outPlayer ? outPlayer.name : 'Batsman';
      const fielder = w.fielderId ? playerMap.get(w.fielderId) : undefined;
      const fielderName = fielder ? fielder.name : undefined;

      let outBatter = batterMap.get(w.playerOutId);
      if (!outBatter) {
        outBatter = {
          playerId: w.playerOutId,
          playerName: outPlayerName,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isOut: true,
          dismissalText: 'out',
          isBatting: false,
        };
        batterMap.set(w.playerOutId, outBatter);
      }

      outBatter.isOut = w.wicketType !== 'retired_hurt';
      outBatter.dismissalText = getDismissalDescription(w.wicketType, bowlerName, fielderName);
      outBatter.isBatting = false;

      // Add to Fall of Wickets
      if (w.wicketType !== 'retired_hurt') {
        fallOfWickets.push({
          wicketNumber: totalWickets,
          score: totalRuns,
          overs: formatOvers(totalLegalBalls),
          playerId: w.playerOutId,
          playerName: outPlayerName,
        });
      }
    }
  }

  // Calculate maidens for each bowler
  for (const [key, val] of bowlerOverRuns.entries()) {
    if (val.legalBalls === 6 && val.bowlerRuns === 0) {
      const bowlerId = key.split('-')[0];
      const bw = bowlerMap.get(bowlerId);
      if (bw) {
        bw.maidens += 1;
      }
    }
  }

  // Finalize bowler overs and economy
  for (const bw of bowlerMap.values()) {
    bw.overs = formatOvers(bw.legalBalls);
    bw.economy = calculateEconomy(bw.runsConceded, bw.legalBalls);
  }

  // Mark current batters
  const currentStriker = batterMap.get(innings.currentStrikerId);
  if (currentStriker && !currentStriker.isOut) {
    currentStriker.isBatting = true;
  }
  const currentNonStriker = batterMap.get(innings.currentNonStrikerId);
  if (currentNonStriker && !currentNonStriker.isOut) {
    currentNonStriker.isBatting = true;
  }

  // Determine current over deliveries
  // Current over index is based on totalLegalBalls: Math.floor(totalLegalBalls / 6)
  // If an over just completed with 6 legal balls and no new balls yet, it's the completed over or newly starting
  const currentOverIndex = Math.floor(totalLegalBalls / 6);
  // Get all deliveries from the current over
  // Find where the current over began: the deliveries since totalLegalBalls reached currentOverIndex * 6
  let legalBallsSeen = 0;
  const targetLegalBallsStart = currentOverIndex * 6;
  const currentOverDeliveries: Delivery[] = [];

  for (const del of deliveries) {
    if (legalBallsSeen >= targetLegalBallsStart) {
      currentOverDeliveries.push(del);
    }
    if (del.isLegal) {
      legalBallsSeen += 1;
    }
  }

  const maxWickets = playingXICount - 1;
  const isAllOut = totalWickets >= maxWickets;

  return {
    totalRuns,
    totalWickets,
    totalLegalBalls,
    oversFormatted: formatOvers(totalLegalBalls),
    runRate: calculateRunRate(totalRuns, totalLegalBalls),
    extras,
    batters: Array.from(batterMap.values()),
    bowlers: Array.from(bowlerMap.values()),
    fallOfWickets,
    currentOverDeliveries,
    isAllOut,
  };
}

export function determineNextStrike(
  currentStrikerId: string,
  currentNonStrikerId: string,
  runsBat: number,
  extraRuns: number,
  extraType?: string,
  isLegal: boolean = true,
  legalBallsInOverBefore: number = 0,
  wicketType?: WicketType,
  wicketPlayerOutId?: string,
  newBatsmanId?: string
): {
  strikerId: string;
  nonStrikerId: string;
  overCompleted: boolean;
} {
  let striker = currentStrikerId;
  let nonStriker = currentNonStrikerId;

  // Total runs scored by running
  let runningRuns = 0;
  if (!extraType) {
    runningRuns = runsBat;
  } else if (extraType === 'bye' || extraType === 'leg_bye') {
    runningRuns = extraRuns;
  } else if (extraType === 'no_ball') {
    runningRuns = runsBat; // runs hit off the no ball
  } else if (extraType === 'wide') {
    // on a wide, extraRuns includes 1 (wide penalty) + any runs run (e.g. 1+1=2)
    runningRuns = Math.max(0, extraRuns - 1);
  }

  // Handle wicket replacement first if applicable
  if (wicketType && wicketPlayerOutId && newBatsmanId) {
    if (wicketPlayerOutId === striker) {
      striker = newBatsmanId;
    } else if (wicketPlayerOutId === nonStriker) {
      nonStriker = newBatsmanId;
    }
  }

  // If odd runs were run, rotate strike
  if (runningRuns % 2 === 1) {
    const temp = striker;
    striker = nonStriker;
    nonStriker = temp;
  }

  // Check if legal ball completed the over (6 legal balls)
  const newLegalBalls = isLegal ? legalBallsInOverBefore + 1 : legalBallsInOverBefore;
  const overCompleted = isLegal && newLegalBalls === 6;

  if (overCompleted) {
    // End of over: switch strike for the new over!
    const temp = striker;
    striker = nonStriker;
    nonStriker = temp;
  }

  return {
    strikerId: striker,
    nonStrikerId: nonStriker,
    overCompleted,
  };
}

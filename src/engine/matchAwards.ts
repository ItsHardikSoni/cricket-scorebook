import { calculateInnings } from '@/engine/scoringEngine';
import { Match, Team } from '@/types/cricket';

export interface MatchAward {
  title: 'Man of the Match' | 'Best Batsman' | 'Best Bowler';
  playerName: string;
  teamName: string;
  reason: string;
}

interface PlayerImpact {
  playerId: string;
  playerName: string;
  teamId: string;
  runs: number;
  wickets: number;
  maidens: number;
  runsConceded: number;
}

export function calculateMatchAwards(match: Match, team1: Team, team2: Team): MatchAward[] {
  const innings = [match.innings1, ...(match.innings2 ? [match.innings2] : [])];
  const batters: { playerName: string; teamName: string; runs: number; balls: number; strikeRate: number }[] = [];
  const bowlers: { playerName: string; teamName: string; wickets: number; runsConceded: number; overs: string; economy: number }[] = [];
  const impactByPlayer = new Map<string, PlayerImpact>();

  for (const inningsState of innings) {
    const battingTeam = inningsState.teamBattingId === team1.id ? team1 : team2;
    const bowlingTeam = inningsState.teamBowlingId === team1.id ? team1 : team2;
    const calculated = calculateInnings(
      inningsState,
      battingTeam.players,
      bowlingTeam.players,
      match.overs,
      match.team1PlayingXI.length || 11
    );

    for (const batter of calculated.batters) {
      if (batter.balls === 0 && batter.runs === 0) continue;
      batters.push({ ...batter, teamName: battingTeam.name });
      const impact = impactByPlayer.get(batter.playerId) || {
        playerId: batter.playerId,
        playerName: batter.playerName,
        teamId: battingTeam.id,
        runs: 0,
        wickets: 0,
        maidens: 0,
        runsConceded: 0,
      };
      impact.runs += batter.runs;
      impactByPlayer.set(batter.playerId, impact);
    }

    for (const bowler of calculated.bowlers) {
      if (bowler.legalBalls === 0 && bowler.runsConceded === 0 && bowler.wickets === 0) continue;
      bowlers.push({ ...bowler, teamName: bowlingTeam.name });
      const impact = impactByPlayer.get(bowler.playerId) || {
        playerId: bowler.playerId,
        playerName: bowler.playerName,
        teamId: bowlingTeam.id,
        runs: 0,
        wickets: 0,
        maidens: 0,
        runsConceded: 0,
      };
      impact.wickets += bowler.wickets;
      impact.maidens += bowler.maidens;
      impact.runsConceded += bowler.runsConceded;
      impactByPlayer.set(bowler.playerId, impact);
    }
  }

  const bestBatter = [...batters].sort(
    (left, right) => right.runs - left.runs || right.strikeRate - left.strikeRate || right.balls - left.balls
  )[0];
  const bestBowler = [...bowlers].sort(
    (left, right) => right.wickets - left.wickets || left.economy - right.economy || left.runsConceded - right.runsConceded
  )[0];
  const bestPerformer = [...impactByPlayer.values()]
    .map((player) => ({ ...player, impactScore: player.runs + player.wickets * 20 + player.maidens * 10 }))
    .sort(
      (left, right) =>
        right.impactScore - left.impactScore ||
        right.wickets - left.wickets ||
        right.runs - left.runs ||
        right.maidens - left.maidens ||
        left.runsConceded - right.runsConceded
    )[0];

  const awards: MatchAward[] = [];
  if (bestPerformer && bestPerformer.impactScore > 0) {
    const contributions = [
      bestPerformer.runs > 0 ? `${bestPerformer.runs} runs` : '',
      bestPerformer.wickets > 0 ? `${bestPerformer.wickets} wicket${bestPerformer.wickets === 1 ? '' : 's'}` : '',
      bestPerformer.maidens > 0 ? `${bestPerformer.maidens} maiden${bestPerformer.maidens === 1 ? '' : 's'}` : '',
    ].filter(Boolean);
    const team = bestPerformer.teamId === team1.id ? team1 : team2;
    awards.push({
      title: 'Man of the Match',
      playerName: bestPerformer.playerName,
      teamName: team.name,
      reason: `${contributions.join(', ')}; impact score ${bestPerformer.impactScore} (runs + 20 per wicket + 10 per maiden).`,
    });
  }

  if (bestBatter) {
    awards.push({
      title: 'Best Batsman',
      playerName: bestBatter.playerName,
      teamName: bestBatter.teamName,
      reason: `Top scorer with ${bestBatter.runs} runs from ${bestBatter.balls} balls at a strike rate of ${bestBatter.strikeRate.toFixed(2)}.`,
    });
  }

  if (bestBowler) {
    awards.push({
      title: 'Best Bowler',
      playerName: bestBowler.playerName,
      teamName: bestBowler.teamName,
      reason: `Took ${bestBowler.wickets} wicket${bestBowler.wickets === 1 ? '' : 's'} for ${bestBowler.runsConceded} runs in ${bestBowler.overs} overs (economy ${bestBowler.economy.toFixed(2)}).`,
    });
  }

  return awards;
}
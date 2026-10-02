import { SHOT_DIRECTIONS } from '@/constants/shotDirections';
import { calculateMatchAwards } from '@/engine/matchAwards';
import { calculateInnings } from '@/engine/scoringEngine';
import { Delivery, InningsState, Match, Team } from '@/types/cricket';

interface Partnership {
  wicketNumber: number;
  batter1Id: string;
  batter2Id: string;
  batter1Name: string;
  batter2Name: string;
  batter1Runs: number;
  batter2Runs: number;
  runs: number;
  balls: number;
}

interface OverSummary {
  over: number;
  runs: number;
  wickets: number;
  total: number;
}

function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function calculatePartnerships(deliveries: Delivery[], playerNames: Map<string, string>): Partnership[] {
  const partnerships: Partnership[] = [];
  let current: Partnership & { key: string } | undefined;
  let wicketNumber = 1;

  for (const delivery of deliveries) {
    const pair = [delivery.strikerId, delivery.nonStrikerId].sort();
    const pairKey = pair.join(':');
    if (current && current.key !== pairKey) {
      const { key: _key, ...partnership } = current;
      partnerships.push(partnership);
      current = undefined;
    }

    if (!current) {
      current = {
        key: pairKey,
        wicketNumber,
        batter1Id: delivery.strikerId,
        batter2Id: delivery.nonStrikerId,
        batter1Name: playerNames.get(delivery.strikerId) || 'Batter',
        batter2Name: playerNames.get(delivery.nonStrikerId) || 'Batter',
        batter1Runs: 0,
        batter2Runs: 0,
        runs: 0,
        balls: 0,
      };
    }

    current.runs += delivery.runsBat + delivery.extraRuns;
    if (delivery.extraType !== 'wide') current.balls += 1;
    if (delivery.strikerId === current.batter1Id) {
      current.batter1Runs += delivery.runsBat;
    } else if (delivery.strikerId === current.batter2Id) {
      current.batter2Runs += delivery.runsBat;
    }

    if (delivery.wicket) {
      const { key: _key, ...partnership } = current;
      partnerships.push(partnership);
      current = undefined;
      if (delivery.wicket.wicketType !== 'retired_hurt') wicketNumber += 1;
    }
  }

  if (current) {
    const { key: _key, ...partnership } = current;
    partnerships.push(partnership);
  }
  return partnerships;
}

function calculateOvers(deliveries: Delivery[]): OverSummary[] {
  const overs = new Map<number, { runs: number; wickets: number }>();
  for (const delivery of deliveries) {
    const score = overs.get(delivery.overIndex) || { runs: 0, wickets: 0 };
    score.runs += delivery.runsBat + delivery.extraRuns;
    if (delivery.wicket && delivery.wicket.wicketType !== 'retired_hurt') score.wickets += 1;
    overs.set(delivery.overIndex, score);
  }

  let total = 0;
  return [...overs.entries()]
    .sort(([left], [right]) => left - right)
    .map(([over, score]) => {
      total += score.runs;
      return { over: over + 1, ...score, total };
    });
}

function renderTable(headers: string[], rows: string[][]): string {
  const header = headers.map((value) => `<th>${escapeHtml(value)}</th>`).join('');
  const body = rows.length
    ? rows.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')
    : `<tr><td class="empty" colspan="${headers.length}">No data recorded</td></tr>`;
  return `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderWagonWheel(deliveries: Delivery[]): string {
  const shots = deliveries.filter((delivery) => delivery.shotDirection && delivery.runsBat > 0);
  if (shots.length === 0) return '<p class="muted">No shot directions were recorded for this innings.</p>';

  const lines = shots.map((delivery) => {
    const direction = SHOT_DIRECTIONS.find((item) => item.value === delivery.shotDirection);
    if (!direction) return '';
    const radians = (direction.angle * Math.PI) / 180;
    const x = 100 + Math.cos(radians) * 74;
    const y = 100 + Math.sin(radians) * 74;
    const color = delivery.runsBat >= 6 ? '#047857' : delivery.runsBat >= 4 ? '#f59e0b' : '#64748b';
    return `<line x1="100" y1="100" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="${delivery.runsBat >= 4 ? 2.5 : 1.5}" opacity="0.72" />`;
  }).join('');

  return `<div class="wagon"><svg viewBox="0 0 200 200" role="img" aria-label="Wagon wheel of recorded shots"><circle cx="100" cy="100" r="86" fill="#f1f5f9" stroke="#cbd5e1"/><circle cx="100" cy="100" r="54" fill="none" stroke="#cbd5e1"/><path d="M14 100h172M100 14v172" stroke="#cbd5e1" stroke-width="1"/>${lines}<circle cx="100" cy="100" r="4" fill="#047857"/></svg><p class="muted">${shots.length} mapped shots · RUN · <span class="four">4 runs</span> · <span class="six">6 runs</span></p></div>`;
}

function renderInnings(
  inningsNumber: number,
  innings: InningsState,
  battingTeam: Team,
  bowlingTeam: Team,
  match: Match
): string {
  const battingPlayers = battingTeam.players || [];
  const bowlingPlayers = bowlingTeam.players || [];
  const playingXICount = battingTeam.id === match.team1Id
    ? match.team1PlayingXI.length || 11
    : match.team2PlayingXI.length || 11;
  const calc = calculateInnings(innings, battingPlayers, bowlingPlayers, match.overs, playingXICount);
  const playerNames = new Map(battingPlayers.map((player) => [player.id, player.name]));
  const partnerships = calculatePartnerships(innings.deliveries, playerNames);
  const overs = calculateOvers(innings.deliveries);
  const maxRuns = Math.max(1, ...overs.map((over) => over.runs));
  const overRows = overs.map((over) => [
    String(over.over),
    String(over.runs),
    over.wickets ? `${over.wickets}W` : '-',
    String(over.total),
  ]);
  const overGraph = overs.map((over) =>
    `<div class="over-item"><span>Ov ${over.over}</span><div class="bar-track"><div class="bar" style="width:${Math.max(3, (over.runs / maxRuns) * 100)}%"></div></div><strong>${over.runs}</strong></div>`
  ).join('');
  const extras = calc.extras;
  const extrasSummary = `B ${extras.byes}, LB ${extras.legByes}, W ${extras.wides}, NB ${extras.noBalls}, Penalty ${extras.penalty}`;

  return `
    <section class="innings">
      <div class="innings-heading">
        <div><p class="eyebrow">INNINGS ${inningsNumber}</p><h2>${escapeHtml(battingTeam.name)}</h2><p class="muted">Batting vs ${escapeHtml(bowlingTeam.name)}</p></div>
        <div class="innings-score">${calc.totalRuns}/${calc.totalWickets}<small>${calc.oversFormatted} overs</small></div>
      </div>
      <div class="metrics"><span>Run rate <strong>${calc.runRate.toFixed(2)}</strong></span><span>Extras <strong>${extras.total}</strong></span><span>${escapeHtml(extrasSummary)}</span></div>
      <h3>Batting</h3>
      ${renderTable(
        ['Batter', 'Dismissal', 'R', 'B', '4s', '6s', 'SR'],
        calc.batters.map((batter) => [
          `${batter.playerName}${batter.isBatting ? ' *' : ''}`,
          batter.dismissalText,
          String(batter.runs),
          String(batter.balls),
          String(batter.fours),
          String(batter.sixes),
          batter.strikeRate.toFixed(1),
        ])
      )}
      <h3>Bowling</h3>
      ${renderTable(
        ['Bowler', 'O', 'M', 'R', 'W', 'Econ'],
        calc.bowlers.map((bowler) => [
          bowler.playerName,
          bowler.overs,
          String(bowler.maidens),
          String(bowler.runsConceded),
          String(bowler.wickets),
          bowler.economy.toFixed(2),
        ])
      )}
      <h3>Partnerships</h3>
      ${renderTable(
        ['Wicket', 'Batter 1', 'Runs', 'Batter 2', 'Runs', 'Stand', 'Balls'],
        partnerships.map((partnership) => [
          String(partnership.wicketNumber),
          partnership.batter1Name,
          String(partnership.batter1Runs),
          partnership.batter2Name,
          String(partnership.batter2Runs),
          String(partnership.runs),
          String(partnership.balls),
        ])
      )}
      <h3>Fall of wickets</h3>
      ${renderTable(
        ['Wicket', 'Score', 'Batter', 'Overs'],
        calc.fallOfWickets.map((wicket) => [
          String(wicket.wicketNumber),
          `${wicket.score}/${wicket.wicketNumber}`,
          wicket.playerName,
          wicket.overs,
        ])
      )}
      <h3>Runs per over</h3>
      <div class="over-graph">${overGraph || '<p class="muted">No over data recorded</p>'}</div>
      ${renderTable(['Over', 'Runs', 'Wickets', 'Total'], overRows)}
      <h3>Wagon wheel</h3>
      ${renderWagonWheel(innings.deliveries)}
    </section>`;
}

export function buildMatchPdfHtml(match: Match, team1: Team, team2: Team): string {
  const teamById = new Map([[team1.id, team1], [team2.id, team2]]);
  const getTeam = (id: string) => teamById.get(id) || {
    id,
    name: 'Unknown team',
    shortName: 'UNK',
    players: [],
    createdAt: 0,
  };
  const innings = [match.innings1, ...(match.innings2 ? [match.innings2] : [])];
  const tossWinner = getTeam(match.tossWinnerId);
  const status = match.status.replace('_', ' ').toUpperCase();
  const awards = match.status === 'completed' ? calculateMatchAwards(match, team1, team2) : [];
  const matchTitle = `${team1.name} vs ${team2.name}`;
  const inningsReports = innings.map((state, index) =>
    renderInnings(index + 1, state, getTeam(state.teamBattingId), getTeam(state.teamBowlingId), match)
  ).join('');
  const playingEleven = [team1, team2].map((team) => {
    const selectedIds = team.id === match.team1Id ? match.team1PlayingXI : match.team2PlayingXI;
    const players = team.players.filter((player) => selectedIds.includes(player.id));
    return `<div><strong>${escapeHtml(team.name)}:</strong> ${escapeHtml(players.length ? players.map((player) => player.name).join(', ') : 'Not recorded')}</div>`;
  }).join('');
  const awardsSection = awards.length
    ? `<section><h3>Match awards</h3>${renderTable(
      ['Award', 'Player', 'Team', 'Reason'],
      awards.map((award) => [award.title, award.playerName, award.teamName, award.reason])
    )}</section>`
    : '';

  return `<!doctype html>
  <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(matchTitle)} scorecard</title>
  <style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#17211c;font-size:10px;margin:0}h1{font-size:24px;margin:0 0 6px}h2{font-size:18px;margin:3px 0}h3{font-size:12px;text-transform:uppercase;margin:18px 0 6px;padding-bottom:4px;border-bottom:1px solid #d9e2dc}.report-header{padding:0 0 14px;border-bottom:3px solid #047857}.eyebrow{font-size:9px;font-weight:700;letter-spacing:1px;color:#047857;margin:0}.subtitle,.muted{color:#637268}.subtitle{font-size:11px;margin:0}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:14px}.meta div,.metrics span{background:#f1f5f9;padding:7px;border-radius:4px}.meta strong{display:block;color:#637268;font-size:8px;text-transform:uppercase;margin-bottom:3px}.playing{margin-top:10px;line-height:1.6}.innings{padding-top:18px}.innings+.innings{page-break-before:always}.innings-heading{display:flex;justify-content:space-between;align-items:center}.innings-score{font-size:26px;font-weight:800;text-align:right;color:#047857}.innings-score small{display:block;font-size:10px;color:#637268;font-weight:400}.metrics{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.metrics span{font-size:9px}.metrics strong{margin-left:4px}table{width:100%;border-collapse:collapse;margin:0 0 10px;table-layout:auto}th{text-align:left;background:#eaf3ee;color:#34483b;font-size:8px;text-transform:uppercase;padding:6px 5px}td{padding:6px 5px;border-bottom:1px solid #e4eae6;vertical-align:top}tbody tr:nth-child(even){background:#fafcfb}.empty{text-align:center;color:#637268;padding:10px}.bar-track{height:7px;background:#e3ece6;border-radius:4px;flex:1;overflow:hidden}.bar{height:100%;background:#047857;border-radius:4px}.over-graph{display:flex;gap:8px;align-items:center;margin:0 0 10px}.over-item{display:flex;flex-direction:column;gap:4px;align-items:center;min-width:44px}.over-item span{font-size:8px;color:#637268}.over-item strong{font-size:9px}.wagon{text-align:center}.wagon svg{width:190px;height:190px}.wagon p{font-size:9px}.four{color:#f59e0b;font-weight:bold}.six{color:#047857;font-weight:bold}.footer{margin-top:18px;border-top:1px solid #d9e2dc;padding-top:8px;color:#637268;font-size:8px}@media print{thead{display:table-header-group}tr{break-inside:avoid}h3{break-after:avoid}.wagon{break-inside:avoid}}
  </style></head><body>
    <header class="report-header"><p class="eyebrow">CRICKET SCOREBOOK</p><h1>${escapeHtml(matchTitle)}</h1><p class="subtitle">${escapeHtml(match.venue || 'Venue not specified')} · ${escapeHtml(match.date || 'Date not specified')}</p>
      <div class="meta"><div><strong>Format</strong>${escapeHtml(match.format)} · ${escapeHtml(match.overs)} overs</div><div><strong>Status</strong>${escapeHtml(status)}</div><div><strong>Toss</strong>${escapeHtml(tossWinner.name)} chose to ${escapeHtml(match.tossDecision)}</div>${match.result ? `<div><strong>Result</strong>${escapeHtml(match.result)}</div>` : ''}${match.target ? `<div><strong>Target</strong>${escapeHtml(match.target)}</div>` : ''}</div>
      <div class="playing"><p class="eyebrow">PLAYING XI</p>${playingEleven}</div>
    </header>
    ${awardsSection}
    ${inningsReports}
    <footer class="footer">Generated by Cricket Scorebook · ${escapeHtml(new Date().toLocaleDateString())}</footer>
  </body></html>`;
}
import { MatchAwardsSection } from '@/components/MatchAwardsSection';
import { Colors } from '@/constants/colors';
import { SHOT_DIRECTIONS } from '@/constants/shotDirections';
import { calculateMatchAwards } from '@/engine/matchAwards';
import { calculateInnings } from '@/engine/scoringEngine';
import { Delivery, Match, Team } from '@/types/cricket';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OverScoreAnalytics {
  overNumber: number;
  runs: number;
  wickets: number;
  cumulativeRuns: number;
}

interface PartnershipAnalytics {
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

function calculateScoreByOver(deliveries: Delivery[]): OverScoreAnalytics[] {
  const overStats = new Map<number, { runs: number; wickets: number }>();
  for (const delivery of deliveries) {
    const stats = overStats.get(delivery.overIndex) || { runs: 0, wickets: 0 };
    stats.runs += delivery.runsBat + delivery.extraRuns;
    if (delivery.wicket && delivery.wicket.wicketType !== 'retired_hurt') stats.wickets += 1;
    overStats.set(delivery.overIndex, stats);
  }

  let cumulativeRuns = 0;
  return [...overStats.entries()]
    .sort(([leftOver], [rightOver]) => leftOver - rightOver)
    .map(([overIndex, stats]) => {
      cumulativeRuns += stats.runs;
      return { overNumber: overIndex + 1, ...stats, cumulativeRuns };
    });
}

function calculatePartnerships(deliveries: Delivery[], playerNames: Map<string, string>): PartnershipAnalytics[] {
  const partnerships: PartnershipAnalytics[] = [];
  let current: (PartnershipAnalytics & { pairKey: string }) | null = null;

  const finishPartnership = () => {
    if (!current) return;
    const { pairKey: _pairKey, ...partnership } = current;
    partnerships.push(partnership);
    current = null;
  };

  for (const delivery of deliveries) {
    const pairKey = [delivery.strikerId, delivery.nonStrikerId].sort().join(':');
    if (current && current.pairKey !== pairKey) finishPartnership();

    if (!current) {
      current = {
        pairKey,
        wicketNumber: partnerships.length + 1,
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
    if (delivery.strikerId === current.batter1Id) current.batter1Runs += delivery.runsBat;
    else if (delivery.strikerId === current.batter2Id) current.batter2Runs += delivery.runsBat;

    if (delivery.wicket) finishPartnership();
  }

  finishPartnership();
  return partnerships;
}

const WAGON_WHEEL_SIZE = 240;
const WAGON_WHEEL_CENTER = WAGON_WHEEL_SIZE / 2;
const WAGON_WHEEL_RADIUS = 66;
const WAGON_WHEEL_LABEL_RADIUS = 88;

interface ScorecardViewProps {
  match: Match;
  team1: Team;
  team2: Team;
  isDarkMode?: boolean;
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({
  match,
  team1,
  team2,
  isDarkMode = false,
}) => {
  const [selectedInnings, setSelectedInnings] = useState<1 | 2>(
    match.status === 'innings2' || (match.status === 'completed' && match.innings2) ? 2 : 1
  );

  const bgCard = isDarkMode ? Colors.darkBg : Colors.white;
  const textPrimary = isDarkMode ? Colors.white : Colors.secondary;
  const textSecondary = isDarkMode ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDarkMode ? Colors.darkBorder : Colors.lightBorder;
  const headerBg = isDarkMode ? Colors.secondary : Colors.white;
  const accentCol = isDarkMode ? Colors.accentDark : Colors.accent;

  // Innings 1 calculation
  const innings1BattingTeam = match.innings1.teamBattingId === team1.id ? team1 : team2;
  const innings1BowlingTeam = match.innings1.teamBowlingId === team1.id ? team1 : team2;
  const calc1 = calculateInnings(
    match.innings1,
    innings1BattingTeam.players,
    innings1BowlingTeam.players,
    match.overs,
    match.team1PlayingXI.length || 11
  );

  // Innings 2 calculation (if exists)
  let calc2 = null;
  let innings2BattingTeam = null;
  let innings2BowlingTeam = null;
  if (match.innings2) {
    innings2BattingTeam = match.innings2.teamBattingId === team1.id ? team1 : team2;
    innings2BowlingTeam = match.innings2.teamBowlingId === team1.id ? team1 : team2;
    calc2 = calculateInnings(
      match.innings2,
      innings2BattingTeam.players,
      innings2BowlingTeam.players,
      match.overs,
      match.team1PlayingXI.length || 11
    );
  }

  const activeCalc = selectedInnings === 1 ? calc1 : calc2 || calc1;
  const activeBattingTeam = selectedInnings === 1 ? innings1BattingTeam : innings2BattingTeam || innings1BattingTeam;
  const activeInnings = selectedInnings === 1 ? match.innings1 : match.innings2 || match.innings1;
  const tossWinner = match.tossWinnerId === team1.id ? team1 : team2;
  const matchAwards = match.status === 'completed' ? calculateMatchAwards(match, team1, team2) : [];
  const scoreByOver = calculateScoreByOver(activeInnings.deliveries);
  const maxRunsInOver = Math.max(1, ...scoreByOver.map((over) => over.runs));
  const activePlayerNames = new Map(activeBattingTeam.players.map((player) => [player.id, player.name]));
  const partnerships = calculatePartnerships(activeInnings.deliveries, activePlayerNames);
  const bestPartnership = partnerships.reduce<PartnershipAnalytics | undefined>(
    (best, partnership) => !best || partnership.runs > best.runs ? partnership : best,
    undefined
  );
  const wagonWheelShots = activeInnings.deliveries.filter(
    (delivery) => delivery.shotDirection && delivery.runsBat > 0
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {match.status === 'completed' && <MatchAwardsSection awards={matchAwards} isDarkMode={isDarkMode} />}

      {/* Innings Selector Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: isDarkMode ? Colors.secondary : Colors.lightBg }]}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            selectedInnings === 1 && {
              backgroundColor: bgCard,
              borderColor: borderCol,
              borderWidth: 1,
            },
          ]}
          onPress={() => setSelectedInnings(1)}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: selectedInnings === 1 ? accentCol : textSecondary,
                fontWeight: selectedInnings === 1 ? '700' : '500',
              },
            ]}
          >
            1st Inn ({innings1BattingTeam.shortName || innings1BattingTeam.name})
          </Text>
        </TouchableOpacity>

        {match.innings2 && (
          <TouchableOpacity
            style={[
              styles.tabBtn,
              selectedInnings === 2 && {
                backgroundColor: bgCard,
                borderColor: borderCol,
                borderWidth: 1,
              },
            ]}
            onPress={() => setSelectedInnings(2)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedInnings === 2 ? accentCol : textSecondary,
                  fontWeight: selectedInnings === 2 ? '700' : '500',
                },
              ]}
            >
              2nd Inn ({innings2BattingTeam?.shortName || innings2BattingTeam?.name})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Innings Summary Banner */}
      <View style={[styles.summaryBanner, { backgroundColor: bgCard, borderColor: borderCol }]}>
        <Text style={[styles.bannerTeam, { color: textPrimary }]}>{activeBattingTeam.name}</Text>
        <View style={styles.summaryStats}>
          <Text style={[styles.bannerScore, { color: textPrimary }]}>
            {activeCalc.totalRuns}/{activeCalc.totalWickets}
          </Text>
          <View style={styles.summaryMetrics}>
            <Text style={[styles.bannerMetric, { color: textSecondary }]}>OV {activeCalc.oversFormatted}</Text>
            <Text style={[styles.bannerMetric, { color: textSecondary }]}>RR {activeCalc.runRate.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.tossBanner, { backgroundColor: isDarkMode ? Colors.darkBg : Colors.lightHighlight, borderColor: borderCol }]}>
        <Ionicons name="flag-outline" size={18} color={Colors.primary} />
        <View style={styles.tossDetails}>
          <Text style={[styles.tossTitle, { color: textSecondary }]}>TOSS DECISION</Text>
          <Text style={[styles.tossText, { color: textPrimary }]}>
            {tossWinner.name} won the toss and elected to {match.tossDecision === 'bat' ? 'bat' : 'bowl'} first.
          </Text>
        </View>
      </View>

      {/* Batting Scorecard Table */}
      <View style={[styles.tableCard, { backgroundColor: bgCard, borderColor: borderCol }]}>
        <View style={[styles.tableHeader, { backgroundColor: headerBg }]}>
          <Text style={[styles.thBatter, { color: textSecondary }]}>BATSMAN</Text>
          <Text style={[styles.thStat, { color: textSecondary }]}>R</Text>
          <Text style={[styles.thStat, { color: textSecondary }]}>B</Text>
          <Text style={[styles.thStat, { color: textSecondary }]}>4s</Text>
          <Text style={[styles.thStat, { color: textSecondary }]}>6s</Text>
          <Text style={[styles.thSr, { color: textSecondary }]}>SR</Text>
        </View>

        {activeCalc.batters.map((b) => (
          <View key={b.playerId} style={[styles.tableRow, { borderBottomColor: borderCol }]}>
            <View style={styles.tdBatter}>
              <Text style={[styles.batterName, { color: textPrimary }]}>
                {b.playerName}
                {b.isBatting ? ' *' : ''}
              </Text>
              <Text style={[styles.dismissalText, { color: textSecondary }]}>
                {b.dismissalText}
              </Text>
            </View>
            <Text style={[styles.tdStatBold, { color: textPrimary }]}>{b.runs}</Text>
            <Text style={[styles.tdStat, { color: textSecondary }]}>{b.balls}</Text>
            <Text style={[styles.tdStat, { color: textSecondary }]}>{b.fours}</Text>
            <Text style={[styles.tdStat, { color: textSecondary }]}>{b.sixes}</Text>
            <Text style={[styles.tdSr, { color: textSecondary }]}>{b.strikeRate.toFixed(1)}</Text>
          </View>
        ))}

        {/* Extras Row */}
        <View style={[styles.extrasRow, { borderBottomColor: borderCol }]}>
          <Text style={[styles.extrasLabel, { color: textSecondary }]}>
            Extras ({activeCalc.extras.total})
          </Text>
          <Text style={[styles.extrasDetail, { color: textSecondary }]}>
            b {activeCalc.extras.byes}, lb {activeCalc.extras.legByes}, w {activeCalc.extras.wides}, nb {activeCalc.extras.noBalls}
          </Text>
        </View>

        {/* Total Score Row */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: textPrimary }]}>TOTAL</Text>
          <Text style={[styles.totalValue, { color: textPrimary }]}>
            {activeCalc.totalRuns}/{activeCalc.totalWickets} ({activeCalc.oversFormatted} Ov, RR: {activeCalc.runRate.toFixed(2)})
          </Text>
        </View>
      </View>

      <View style={[styles.analyticsCard, { backgroundColor: bgCard, borderColor: borderCol, marginTop: 14 }]}>
        <View style={styles.partnershipHeading}>
          <Text style={[styles.sectionTitle, { color: textSecondary, marginBottom: 0 }]}>PARTNERSHIPS</Text>
          {bestPartnership && (
            <Text style={[styles.bestPartnershipLabel, { color: accentCol }]}>BEST {bestPartnership.runs}</Text>
          )}
        </View>
        {partnerships.length === 0 ? (
          <Text style={[styles.analyticsEmptyText, { color: textSecondary }]}>Partnerships appear after the first delivery.</Text>
        ) : (
          partnerships.map((partnership) => {
            const batter1Share = partnership.runs > 0 ? (partnership.batter1Runs / partnership.runs) * 100 : 0;
            const batter2Share = partnership.runs > 0 ? (partnership.batter2Runs / partnership.runs) * 100 : 0;
            return (
              <View
                key={`${partnership.wicketNumber}-${partnership.batter1Id}-${partnership.batter2Id}`}
                style={[styles.partnershipRow, { borderBottomColor: borderCol }]}
              >
                <View style={styles.partnershipMeta}>
                  <Text style={[styles.partnershipWicket, { color: textSecondary }]}>WKT {partnership.wicketNumber}</Text>
                  <Text style={[styles.partnershipTotal, { color: textPrimary }]}>
                    {partnership.runs} ({partnership.balls})
                  </Text>
                </View>
                <View style={styles.partnershipNames}>
                  <Text numberOfLines={1} style={[styles.partnershipBatter, { color: textPrimary }]}>
                    {partnership.batter1Name} {partnership.batter1Runs}
                  </Text>
                  <Text numberOfLines={1} style={[styles.partnershipBatter, { color: Colors.extraBg }]}>
                    {partnership.batter2Name} {partnership.batter2Runs}
                  </Text>
                </View>
                <View style={[styles.partnershipTrack, { backgroundColor: isDarkMode ? Colors.secondary : Colors.lightBg }]}>
                  <View style={[styles.partnershipShareOne, { width: `${batter1Share}%`, backgroundColor: Colors.primary }]} />
                  <View style={[styles.partnershipShareTwo, { width: `${batter2Share}%`, backgroundColor: Colors.extraBg }]} />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Bowling Scorecard Table */}
      <View style={[styles.tableCard, { backgroundColor: bgCard, borderColor: borderCol, marginTop: 14 }]}>
        <View style={[styles.tableHeader, { backgroundColor: headerBg }]}>
          <Text style={[styles.thBatter, { color: textSecondary }]}>BOWLER</Text>
          <Text style={[styles.thStat, { color: textSecondary }]}>O</Text>
          <Text style={[styles.thStat, { color: textSecondary }]}>M</Text>
          <Text style={[styles.thStat, { color: textSecondary }]}>R</Text>
          <Text style={[styles.thStat, { color: textSecondary }]}>W</Text>
          <Text style={[styles.thSr, { color: textSecondary }]}>ECON</Text>
        </View>

        {activeCalc.bowlers.map((bw) => (
          <View key={bw.playerId} style={[styles.tableRow, { borderBottomColor: borderCol }]}>
            <View style={styles.tdBatter}>
              <Text style={[styles.batterName, { color: textPrimary }]}>{bw.playerName}</Text>
            </View>
            <Text style={[styles.tdStat, { color: textPrimary }]}>{bw.overs}</Text>
            <Text style={[styles.tdStat, { color: textSecondary }]}>{bw.maidens}</Text>
            <Text style={[styles.tdStat, { color: textSecondary }]}>{bw.runsConceded}</Text>
            <Text style={[styles.tdStatBold, { color: Colors.accent }]}>{bw.wickets}</Text>
            <Text style={[styles.tdSr, { color: textSecondary }]}>{bw.economy.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Fall of Wickets */}
      {activeCalc.fallOfWickets.length > 0 && (
        <View style={[styles.fowCard, { backgroundColor: bgCard, borderColor: borderCol, marginTop: 14 }]}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>WICKET FALL ANALYTICS</Text>
          <View style={styles.fowList}>
            {activeCalc.fallOfWickets.map((fow) => (
              <View key={fow.wicketNumber} style={styles.fowItem}>
                <Text style={[styles.fowScore, { color: textPrimary }]}>
                  {fow.score}-{fow.wicketNumber}
                </Text>
                <Text style={[styles.fowDetails, { color: textSecondary }]}>
                  ({fow.playerName}, {fow.overs} ov)
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.analyticsCard, { backgroundColor: bgCard, borderColor: borderCol, marginTop: 14 }]}>
        <View style={styles.partnershipHeading}>
          <Text style={[styles.sectionTitle, { color: textSecondary, marginBottom: 0 }]}>WAGON WHEEL</Text>
          <Text style={[styles.chartCount, { color: textSecondary }]}>{wagonWheelShots.length} shots</Text>
        </View>
        {wagonWheelShots.length === 0 && (
          <Text style={[styles.analyticsEmptyText, { color: textSecondary }]}>
            Choose a shot direction before scoring runs to map it here.
          </Text>
        )}
        <View
          style={[
            styles.wagonWheelField,
            { backgroundColor: isDarkMode ? Colors.darkBgDark : Colors.lightBgSoft, borderColor: borderCol },
          ]}
        >
          <View style={[styles.wagonWheelRing, { borderColor: borderCol }]} />
          <View style={[styles.wagonWheelCrosshair, styles.wagonWheelHorizontal, { backgroundColor: borderCol }]} />
          <View style={[styles.wagonWheelCrosshair, styles.wagonWheelVertical, { backgroundColor: borderCol }]} />
          {wagonWheelShots.map((delivery) => {
            const direction = SHOT_DIRECTIONS.find((item) => item.value === delivery.shotDirection);
            if (!direction) return null;
            const radians = (direction.angle * Math.PI) / 180;
            const left = WAGON_WHEEL_CENTER + Math.cos(radians) * WAGON_WHEEL_RADIUS / 2 - WAGON_WHEEL_RADIUS / 2;
            const top = WAGON_WHEEL_CENTER + Math.sin(radians) * WAGON_WHEEL_RADIUS / 2 - 1;
            const shotColor = delivery.runsBat >= 6
              ? (isDarkMode ? Colors.accentDark : Colors.primary)
              : delivery.runsBat >= 4
                ? Colors.boundaryBg
                : Colors.neutral;
            return (
              <View
                key={delivery.id}
                style={[
                  styles.wagonWheelShot,
                  {
                    width: WAGON_WHEEL_RADIUS,
                    height: delivery.runsBat >= 4 ? 3 : 2,
                    left,
                    top,
                    backgroundColor: shotColor,
                    transform: [{ rotate: `${direction.angle}deg` }],
                  },
                ]}
              />
            );
          })}
          {SHOT_DIRECTIONS.map((direction) => {
            const radians = (direction.angle * Math.PI) / 180;
            return (
              <Text
                key={direction.value}
                style={[
                  styles.wagonWheelDirection,
                  {
                    left: WAGON_WHEEL_CENTER + Math.cos(radians) * WAGON_WHEEL_LABEL_RADIUS - 30,
                    top: WAGON_WHEEL_CENTER + Math.sin(radians) * WAGON_WHEEL_LABEL_RADIUS - 7,
                    color: textSecondary,
                  },
                ]}
              >
                {direction.shortLabel}
              </Text>
            );
          })}
          <View style={[styles.wagonWheelCenter, { backgroundColor: accentCol, borderColor: bgCard }]} />
        </View>
        <View style={styles.wagonWheelLegend}>
          <Text style={[styles.wagonWheelLegendText, { color: Colors.neutral }]}>RUN</Text>
          <Text style={[styles.wagonWheelLegendText, { color: Colors.boundaryBg }]}>4</Text>
          <Text style={[styles.wagonWheelLegendText, { color: isDarkMode ? Colors.accentDark : Colors.primary }]}>6</Text>
        </View>
      </View>

      <View style={[styles.analyticsCard, { backgroundColor: bgCard, borderColor: borderCol, marginTop: 14 }]}>
        <Text style={[styles.sectionTitle, { color: textSecondary }]}>MANHATTAN / RUNS PER OVER</Text>
        {scoreByOver.length === 0 ? (
          <Text style={[styles.analyticsEmptyText, { color: textSecondary }]}>No deliveries scored yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.manhattanColumns}>
            {scoreByOver.map((over) => (
              <View key={over.overNumber} style={styles.manhattanColumn}>
                <Text style={[styles.manhattanRuns, { color: textPrimary }]}>{over.runs}</Text>
                <View style={[styles.manhattanTrack, { backgroundColor: isDarkMode ? Colors.secondary : Colors.lightBg }]}>
                  <View
                    style={[
                      styles.manhattanBar,
                      {
                        height: `${Math.max(4, (over.runs / maxRunsInOver) * 100)}%`,
                        backgroundColor: Colors.primary,
                      },
                    ]}
                  />
                </View>
                <View style={styles.manhattanOverLabel}>
                  <Text style={[styles.manhattanOverText, { color: textSecondary }]}>{over.overNumber}</Text>
                  {over.wickets > 0 && (
                    <Text style={[styles.manhattanWickets, { color: Colors.wicketRedText }]}>{over.wickets}W</Text>
                  )}
                </View>
                <Text style={[styles.manhattanCumulative, { color: textSecondary }]}>{over.cumulativeRuns}</Text>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={[styles.manhattanLegend, { borderTopColor: borderCol }]}>
          <Text style={[styles.analyticsLegendText, { color: textSecondary }]}>RUNS</Text>
          <Text style={[styles.analyticsLegendText, { color: Colors.wicketRedText }]}>WICKETS</Text>
          <Text style={[styles.analyticsLegendText, { color: textSecondary }]}>CUMULATIVE SCORE</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
  },
  summaryBanner: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  tossBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  tossDetails: {
    flex: 1,
  },
  tossTitle: {
    fontSize: 10,
    fontWeight: '800',
  },
  tossText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  analyticsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  analyticsEmptyText: {
    fontSize: 13,
    paddingVertical: 8,
  },
  chartCount: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
  },
  partnershipHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestPartnershipLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 10,
  },
  partnershipRow: {
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  partnershipMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  partnershipWicket: {
    fontSize: 10,
    fontWeight: '700',
  },
  partnershipTotal: {
    fontSize: 12,
    fontWeight: '800',
  },
  partnershipNames: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  partnershipBatter: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  partnershipTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  partnershipShareOne: {
    height: '100%',
  },
  partnershipShareTwo: {
    height: '100%',
  },
  analyticsRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  analyticsOver: {
    width: 42,
    fontSize: 11,
    fontWeight: '700',
  },
  analyticsTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  analyticsBar: {
    height: '100%',
    borderRadius: 4,
  },
  analyticsRuns: {
    width: 24,
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '700',
  },
  analyticsTotal: {
    width: 34,
    fontSize: 12,
    textAlign: 'right',
  },
  analyticsWickets: {
    minWidth: 22,
    fontSize: 11,
    textAlign: 'right',
    fontWeight: '800',
  },
  analyticsLegend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    paddingTop: 8,
  },
  analyticsLegendText: {
    fontSize: 9,
    fontWeight: '700',
  },
  wagonWheelField: {
    width: WAGON_WHEEL_SIZE,
    height: WAGON_WHEEL_SIZE,
    alignSelf: 'center',
    borderRadius: WAGON_WHEEL_SIZE / 2,
    borderWidth: 1,
    overflow: 'hidden',
  },
  wagonWheelRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    left: WAGON_WHEEL_CENTER - 74,
    top: WAGON_WHEEL_CENTER - 74,
    borderRadius: 74,
    borderWidth: StyleSheet.hairlineWidth,
  },
  wagonWheelCrosshair: {
    position: 'absolute',
    opacity: 0.55,
  },
  wagonWheelHorizontal: {
    width: 164,
    height: StyleSheet.hairlineWidth,
    left: WAGON_WHEEL_CENTER - 82,
    top: WAGON_WHEEL_CENTER,
  },
  wagonWheelVertical: {
    width: StyleSheet.hairlineWidth,
    height: 164,
    left: WAGON_WHEEL_CENTER,
    top: WAGON_WHEEL_CENTER - 82,
  },
  wagonWheelShot: {
    position: 'absolute',
    borderRadius: 2,
    opacity: 0.72,
  },
  wagonWheelDirection: {
    position: 'absolute',
    width: 60,
    height: 14,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '700',
  },
  wagonWheelCenter: {
    position: 'absolute',
    width: 10,
    height: 10,
    left: WAGON_WHEEL_CENTER - 5,
    top: WAGON_WHEEL_CENTER - 5,
    borderRadius: 5,
    borderWidth: 2,
  },
  wagonWheelLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  wagonWheelLegendText: {
    fontSize: 10,
    fontWeight: '800',
  },
  manhattanColumns: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 3,
  },
  manhattanColumn: {
    width: 36,
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  manhattanRuns: {
    height: 14,
    fontSize: 10,
    fontWeight: '700',
  },
  manhattanTrack: {
    width: 24,
    height: 76,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 4,
    overflow: 'hidden',
  },
  manhattanBar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  manhattanOverLabel: {
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manhattanOverText: {
    fontSize: 9,
    fontWeight: '700',
  },
  manhattanWickets: {
    fontSize: 8,
    fontWeight: '800',
  },
  manhattanCumulative: {
    height: 12,
    fontSize: 8,
  },
  manhattanLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    paddingTop: 8,
  },
  bannerTeam: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bannerScore: {
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 0,
  },
  summaryMetrics: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
  },
  bannerMetric: {
    fontSize: 12,
    fontWeight: '500',
  },
  tableCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBorder,
  },
  thBatter: {
    flex: 3,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  thStat: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  thSr: {
    flex: 1.3,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tdBatter: {
    flex: 3,
  },
  batterName: {
    fontSize: 14,
    fontWeight: '700',
  },
  dismissalText: {
    fontSize: 11,
    marginTop: 1,
  },
  tdStat: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
  },
  tdStatBold: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  tdSr: {
    flex: 1.3,
    fontSize: 13,
    textAlign: 'right',
  },
  extrasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  extrasLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  extrasDetail: {
    fontSize: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  fowCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  fowList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fowItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  fowScore: {
    fontSize: 13,
    fontWeight: '700',
  },
  fowDetails: {
    fontSize: 12,
  },
});

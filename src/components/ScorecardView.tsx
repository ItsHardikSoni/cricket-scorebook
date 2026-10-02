import { Colors } from '@/constants/colors';
import { calculateInnings } from '@/engine/scoringEngine';
import { Match, Team } from '@/types/cricket';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
        <Text style={[styles.bannerScore, { color: textPrimary }]}>
          {activeCalc.totalRuns}/{activeCalc.totalWickets} ({activeCalc.oversFormatted} OV)
        </Text>
        <Text style={[styles.bannerCrr, { color: textSecondary }]}>
          Run Rate: {activeCalc.runRate.toFixed(2)}
        </Text>
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
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>FALL OF WICKETS</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  bannerTeam: {
    fontSize: 16,
    fontWeight: '700',
  },
  bannerScore: {
    fontSize: 18,
    fontWeight: '800',
  },
  bannerCrr: {
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

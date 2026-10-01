import { Colors } from '@/constants/colors';
import { CalculatedInnings, Match } from '@/types/cricket';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ScoreHeaderProps {
  match: Match;
  calc: CalculatedInnings;
  battingTeamName: string;
  isDarkMode?: boolean;
}

export const ScoreHeader: React.FC<ScoreHeaderProps> = ({
  match,
  calc,
  battingTeamName,
  isDarkMode = false,
}) => {
  const isInnings2 = match.status === 'innings2';
  const target = match.target || 0;
  const runsRemaining = target > 0 ? Math.max(0, target - calc.totalRuns) : 0;
  const totalMaxLegalBalls = match.overs * 6;
  const ballsRemaining = Math.max(0, totalMaxLegalBalls - calc.totalLegalBalls);
  const requiredRunRate =
    ballsRemaining > 0 ? Number(((runsRemaining / (ballsRemaining / 6))).toFixed(2)) : 0;

  const bgCard = isDarkMode ? '#1e293b' : Colors.white;
  const textPrimary = isDarkMode ? '#f8fafc' : Colors.secondary;
  const textSecondary = isDarkMode ? '#94a3b8' : Colors.neutral;
  const borderCol = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <View style={[styles.container, { backgroundColor: bgCard, borderColor: borderCol }]}>
      <View style={styles.topRow}>
        <View style={styles.teamBadge}>
          <Text style={[styles.teamName, { color: textPrimary }]} numberOfLines={1}>
            {battingTeamName}
          </Text>
          <Text style={[styles.inningsBadge, { color: isDarkMode ? '#38bdf8' : '#0284c7' }]}>
            {isInnings2 ? '2nd Innings' : '1st Innings'}
          </Text>
        </View>

        <View style={styles.oversBadge}>
          <Text style={[styles.oversLabel, { color: textSecondary }]}>MAX {match.overs} OV</Text>
        </View>
      </View>

      {/* Main Big Score */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreLeft}>
          <Text style={[styles.mainScore, { color: textPrimary }]}>
            {calc.totalRuns}/{calc.totalWickets}
          </Text>
          <Text style={[styles.mainOvers, { color: textSecondary }]}>
            {calc.oversFormatted} <Text style={styles.ovUnit}>OV</Text>
          </Text>
        </View>

        <View style={styles.rateCol}>
          <View style={styles.rateItem}>
            <Text style={[styles.rateLabel, { color: textSecondary }]}>CRR</Text>
            <Text style={[styles.rateValue, { color: textPrimary }]}>{calc.runRate.toFixed(2)}</Text>
          </View>

          {isInnings2 && (
            <View style={styles.rateItem}>
              <Text style={[styles.rateLabel, { color: textSecondary }]}>RRR</Text>
              <Text style={[styles.rateValue, { color: '#e11d48' }]}>
                {ballsRemaining === 0 && runsRemaining > 0 ? '—' : requiredRunRate.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Target & Chasing equation in 2nd Innings */}
      {isInnings2 && (
        <View style={[styles.targetRow, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }]}>
          <Text style={[styles.targetText, { color: textPrimary }]}>
            Target: <Text style={styles.boldText}>{target}</Text>
          </Text>
          <Text style={[styles.needText, { color: '#0284c7' }]}>
            Need <Text style={styles.boldText}>{runsRemaining}</Text> runs in{' '}
            <Text style={styles.boldText}>{ballsRemaining}</Text> balls
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  inningsBadge: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  oversBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  oversLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  scoreLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  mainScore: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  mainOvers: {
    fontSize: 22,
    fontWeight: '600',
  },
  ovUnit: {
    fontSize: 13,
    fontWeight: '500',
  },
  rateCol: {
    flexDirection: 'row',
    gap: 14,
  },
  rateItem: {
    alignItems: 'flex-end',
  },
  rateLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  targetText: {
    fontSize: 13,
    fontWeight: '500',
  },
  needText: {
    fontSize: 13,
    fontWeight: '600',
  },
  boldText: {
    fontWeight: '800',
  },
});

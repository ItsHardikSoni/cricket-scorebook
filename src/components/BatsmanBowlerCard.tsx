import { Colors } from '@/constants/colors';
import { CalculatedInnings } from '@/types/cricket';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BatsmanBowlerCardProps {
  calc: CalculatedInnings;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  onSwapStrike: () => void;
  onChangeBowler: () => void;
  isDarkMode?: boolean;
}

export const BatsmanBowlerCard: React.FC<BatsmanBowlerCardProps> = ({
  calc,
  strikerId,
  nonStrikerId,
  bowlerId,
  onSwapStrike,
  onChangeBowler,
  isDarkMode = false,
}) => {
  const striker = calc.batters.find((b) => b.playerId === strikerId);
  const nonStriker = calc.batters.find((b) => b.playerId === nonStrikerId);
  const bowler = calc.bowlers.find((b) => b.playerId === bowlerId);

  const bgCard = isDarkMode ? Colors.darkBg : Colors.white;
  const textPrimary = isDarkMode ? Colors.darkTextPrimary : Colors.secondary;
  const textSecondary = isDarkMode ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDarkMode ? Colors.darkBorder : Colors.lightBorder;
  const strikerHighlight = isDarkMode ? Colors.accentHighlight : Colors.lightHighlight;

  return (
    <View style={[styles.container, { backgroundColor: bgCard, borderColor: borderCol }]}>
      {/* Batters Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textSecondary }]}>BATTERS</Text>
        <TouchableOpacity
          onPress={onSwapStrike}
          style={[styles.swapBtn, { backgroundColor: isDarkMode ? Colors.darkBorder : Colors.lightBg }]}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-vertical" size={14} color={isDarkMode ? Colors.accentDark : Colors.accent} />
          <Text style={[styles.swapBtnText, { color: isDarkMode ? Colors.accentDark : Colors.accent }]}>
            Swap Strike
          </Text>
        </TouchableOpacity>
      </View>

      {/* Striker Row */}
      <View style={[styles.playerRow, { backgroundColor: strikerHighlight, borderRadius: 8, paddingHorizontal: 8 }]}>
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, { color: textPrimary }]} numberOfLines={1}>
            {striker?.playerName || 'Striker'} <Text style={styles.starText}>*</Text>
          </Text>
        </View>
        <View style={styles.playerStats}>
          <Text style={[styles.mainStat, { color: textPrimary }]}>
            {striker?.runs ?? 0}{' '}
            <Text style={[styles.subStat, { color: textSecondary }]}>({striker?.balls ?? 0})</Text>
          </Text>
          <Text style={[styles.boundaryStat, { color: textSecondary }]}>
            4s: {striker?.fours ?? 0}  6s: {striker?.sixes ?? 0}
          </Text>
        </View>
      </View>

      {/* Non-Striker Row */}
      <View style={[styles.playerRow, { paddingHorizontal: 8, marginTop: 4 }]}>
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, { color: textSecondary }]} numberOfLines={1}>
            {nonStriker?.playerName || 'Non-Striker'}
          </Text>
        </View>
        <View style={styles.playerStats}>
          <Text style={[styles.mainStat, { color: textSecondary }]}>
            {nonStriker?.runs ?? 0}{' '}
            <Text style={[styles.subStat, { color: textSecondary }]}>({nonStriker?.balls ?? 0})</Text>
          </Text>
          <Text style={[styles.boundaryStat, { color: textSecondary }]}>
            4s: {nonStriker?.fours ?? 0}  6s: {nonStriker?.sixes ?? 0}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: borderCol }]} />

      {/* Bowler Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textSecondary }]}>BOWLER</Text>
        <TouchableOpacity
          onPress={onChangeBowler}
          style={[styles.swapBtn, { backgroundColor: isDarkMode ? Colors.darkBorder : Colors.lightBg }]}
          activeOpacity={0.7}
        >
          <Ionicons name="people" size={14} color={isDarkMode ? Colors.accentDark : Colors.accent} />
          <Text style={[styles.swapBtnText, { color: isDarkMode ? Colors.accentDark : Colors.accent }]}>
            Change Bowler
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.playerRow, { paddingHorizontal: 8 }]}>
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, { color: textPrimary }]} numberOfLines={1}>
            {bowler?.playerName || 'Bowler'}
          </Text>
        </View>
        <View style={styles.bowlerStats}>
          <Text style={[styles.bowlerFigures, { color: textPrimary }]}>
            {bowler?.overs || '0.0'}-{bowler?.maidens || 0}-{bowler?.runsConceded || 0}-{bowler?.wickets || 0}
          </Text>
          <Text style={[styles.boundaryStat, { color: textSecondary }]}>
            Econ: {bowler?.economy.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  swapBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  playerInfo: {
    flex: 1,
    marginRight: 8,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  starText: {
    color: Colors.star,
    fontWeight: '800',
  },
  playerStats: {
    alignItems: 'flex-end',
  },
  mainStat: {
    fontSize: 16,
    fontWeight: '800',
  },
  subStat: {
    fontSize: 13,
    fontWeight: '500',
  },
  boundaryStat: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  bowlerStats: {
    alignItems: 'flex-end',
  },
  bowlerFigures: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

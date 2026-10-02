import { Colors } from '@/constants/colors';
import { MatchAward } from '@/engine/matchAwards';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MatchAwardsSectionProps {
  awards: MatchAward[];
  isDarkMode?: boolean;
}

const awardIcons = {
  'Man of the Match': 'trophy-outline',
  'Best Batsman': 'trending-up-outline',
  'Best Bowler': 'fitness-outline',
} as const;

export const MatchAwardsSection: React.FC<MatchAwardsSectionProps> = ({ awards, isDarkMode = false }) => {
  if (awards.length === 0) return null;

  const textPrimary = isDarkMode ? Colors.darkTextPrimary : Colors.secondary;
  const textSecondary = isDarkMode ? Colors.darkTextSecondary : Colors.neutral;
  const borderColor = isDarkMode ? Colors.darkBorder : Colors.lightBorder;

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <MaterialIcons name="sports-cricket" size={18} color={Colors.primary} />
        <Text style={[styles.heading, { color: textSecondary }]}>MATCH AWARDS</Text>
      </View>
      {awards.map((award) => (
        <View key={award.title} style={[styles.awardRow, { borderTopColor: borderColor }]}>
          <Ionicons name={awardIcons[award.title]} size={20} color={Colors.primary} />
          <View style={styles.awardDetails}>
            <Text style={[styles.awardTitle, { color: textSecondary }]}>{award.title}</Text>
            <Text style={[styles.playerName, { color: textPrimary }]}>{award.playerName}</Text>
            <Text style={[styles.teamName, { color: Colors.primary }]}>{award.teamName}</Text>
            <Text style={[styles.reason, { color: textSecondary }]}>{award.reason}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 11,
    fontWeight: '800',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  awardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  awardDetails: {
    flex: 1,
  },
  awardTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  playerName: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  reason: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
});
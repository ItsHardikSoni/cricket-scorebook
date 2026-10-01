import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Delivery } from '@/types/cricket';

interface OverBallListProps {
  currentOverDeliveries: Delivery[];
  currentOverNumber: number;
  isDarkMode?: boolean;
}

export const OverBallList: React.FC<OverBallListProps> = ({
  currentOverDeliveries,
  currentOverNumber,
  isDarkMode = false,
}) => {
  const bgCard = isDarkMode ? '#1e293b' : '#ffffff';
  const textPrimary = isDarkMode ? '#f8fafc' : '#0f172a';
  const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
  const borderCol = isDarkMode ? '#334155' : '#e2e8f0';

  const renderBallText = (d: Delivery) => {
    if (d.wicket) {
      if (d.runsBat > 0) return `W+${d.runsBat}`;
      return 'W';
    }
    if (d.extraType === 'wide') {
      return d.extraRuns > 1 ? `Wd+${d.extraRuns - 1}` : 'Wd';
    }
    if (d.extraType === 'no_ball') {
      const runs = d.runsBat > 0 ? `+${d.runsBat}` : '';
      return `Nb${runs}`;
    }
    if (d.extraType === 'bye') {
      return `B${d.extraRuns}`;
    }
    if (d.extraType === 'leg_bye') {
      return `Lb${d.extraRuns}`;
    }
    if (d.extraType === 'penalty') {
      return `Pen${d.extraRuns}`;
    }
    return `${d.runsBat}`;
  };

  const getBallStyles = (d: Delivery) => {
    if (d.wicket) {
      return {
        bg: '#ef4444',
        text: '#ffffff',
        border: '#dc2626',
      };
    }
    if (d.runsBat === 4 || d.runsBat === 6) {
      return {
        bg: isDarkMode ? '#15803d' : '#22c55e',
        text: '#ffffff',
        border: '#16a34a',
      };
    }
    if (d.extraType === 'wide' || d.extraType === 'no_ball') {
      return {
        bg: isDarkMode ? '#b45309' : '#f59e0b',
        text: '#ffffff',
        border: '#d97706',
      };
    }
    if (d.extraType === 'bye' || d.extraType === 'leg_bye') {
      return {
        bg: isDarkMode ? '#475569' : '#94a3b8',
        text: '#ffffff',
        border: '#64748b',
      };
    }
    if (d.runsBat === 0) {
      return {
        bg: isDarkMode ? '#0f172a' : '#f1f5f9',
        text: textSecondary,
        border: borderCol,
      };
    }
    // Normal 1, 2, 3 runs
    return {
      bg: isDarkMode ? '#334155' : '#e2e8f0',
      text: textPrimary,
      border: borderCol,
    };
  };

  const totalOverRuns = currentOverDeliveries.reduce(
    (acc, d) => acc + d.runsBat + d.extraRuns,
    0
  );

  return (
    <View style={[styles.container, { backgroundColor: bgCard, borderColor: borderCol }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: textSecondary }]}>
          OVER {currentOverNumber + 1}
        </Text>
        <Text style={[styles.overTotal, { color: textPrimary }]}>
          {totalOverRuns} run{totalOverRuns === 1 ? '' : 's'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ballContainer}
      >
        {currentOverDeliveries.length === 0 ? (
          <Text style={[styles.emptyText, { color: textSecondary }]}>
            No balls bowled in this over yet
          </Text>
        ) : (
          currentOverDeliveries.map((del, index) => {
            const ballStyle = getBallStyles(del);
            return (
              <View
                key={del.id || index}
                style={[
                  styles.ballPill,
                  {
                    backgroundColor: ballStyle.bg,
                    borderColor: ballStyle.border,
                  },
                ]}
              >
                <Text style={[styles.ballPillText, { color: ballStyle.text }]}>
                  {renderBallText(del)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  overTotal: {
    fontSize: 12,
    fontWeight: '700',
  },
  ballContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 38,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  ballPill: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballPillText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

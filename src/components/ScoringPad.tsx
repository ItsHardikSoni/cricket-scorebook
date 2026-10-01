import { Colors } from '@/constants/colors';
import { ExtraType } from '@/types/cricket';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScoringPadProps {
  onScoreRuns: (runs: number) => void;
  onQuickExtra: (type: ExtraType) => void;
  onOpenCustomExtras: () => void;
  onOpenWicketDialog: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isDarkMode?: boolean;
}

export const ScoringPad: React.FC<ScoringPadProps> = ({
  onScoreRuns,
  onQuickExtra,
  onOpenCustomExtras,
  onOpenWicketDialog,
  onUndo,
  canUndo,
  isDarkMode = false,
}) => {
  const bgPad = isDarkMode ? Colors.secondary : Colors.white;
  const bgButton = isDarkMode ? '#1e293b' : Colors.white;
  const textPrimary = isDarkMode ? Colors.white : Colors.secondary;
  const borderCol = isDarkMode ? '#334155' : '#cbd5e1';

  return (
    <View style={[styles.container, { backgroundColor: bgPad }]}>
      {/* Runs Grid: 0, 1, 2 / 3, 4, 6 */}
      <View style={styles.gridRow}>
        {[0, 1, 2].map((run) => (
          <TouchableOpacity
            key={run}
            style={[styles.runButton, { backgroundColor: bgButton, borderColor: borderCol }]}
            onPress={() => onScoreRuns(run)}
            activeOpacity={0.6}
          >
            <Text style={[styles.runButtonText, { color: textPrimary }]}>{run}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.gridRow}>
        <TouchableOpacity
          style={[styles.runButton, { backgroundColor: bgButton, borderColor: borderCol }]}
          onPress={() => onScoreRuns(3)}
          activeOpacity={0.6}
        >
          <Text style={[styles.runButtonText, { color: textPrimary }]}>3</Text>
        </TouchableOpacity>

        {/* 4 Boundary (with subtle green accent) */}
        <TouchableOpacity
          style={[
            styles.runButton,
            {
              backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5',
              borderColor: Colors.primary,
            },
          ]}
          onPress={() => onScoreRuns(4)}
          activeOpacity={0.6}
        >
          <Text style={[styles.runButtonText, { color: isDarkMode ? '#34d399' : Colors.primary }]}>
            4
          </Text>
          <Text style={[styles.boundaryLabel, { color: isDarkMode ? '#6ee7b7' : Colors.primary }]}>FOUR</Text>
        </TouchableOpacity>

        {/* 6 Boundary (with subtle green accent) */}
        <TouchableOpacity
          style={[
            styles.runButton,
            {
              backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5',
              borderColor: Colors.primary,
            },
          ]}
          onPress={() => onScoreRuns(6)}
          activeOpacity={0.6}
        >
          <Text style={[styles.runButtonText, { color: isDarkMode ? '#34d399' : Colors.primary }]}>
            6
          </Text>
          <Text style={[styles.boundaryLabel, { color: isDarkMode ? '#6ee7b7' : Colors.primary }]}>SIX</Text>
        </TouchableOpacity>
      </View>

      {/* Extras Row */}
      <View style={styles.extrasRow}>
        <TouchableOpacity
          style={[styles.extraBtn, { backgroundColor: bgButton, borderColor: borderCol }]}
          onPress={() => onQuickExtra('wide')}
          activeOpacity={0.7}
        >
          <Text style={[styles.extraBtnText, { color: textPrimary }]}>WD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.extraBtn, { backgroundColor: bgButton, borderColor: borderCol }]}
          onPress={() => onQuickExtra('no_ball')}
          activeOpacity={0.7}
        >
          <Text style={[styles.extraBtnText, { color: textPrimary }]}>NB</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.extraBtn, { backgroundColor: bgButton, borderColor: borderCol }]}
          onPress={() => onQuickExtra('bye')}
          activeOpacity={0.7}
        >
          <Text style={[styles.extraBtnText, { color: textPrimary }]}>BYE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.extraBtn, { backgroundColor: bgButton, borderColor: borderCol }]}
          onPress={() => onQuickExtra('leg_bye')}
          activeOpacity={0.7}
        >
          <Text style={[styles.extraBtnText, { color: textPrimary }]}>LB</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.extraBtn, { backgroundColor: isDarkMode ? '#1e293b' : Colors.white, borderColor: borderCol }]}
          onPress={onOpenCustomExtras}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Major Action Row: WICKET & UNDO */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.wicketButton, { backgroundColor: '#dc2626' }]}
          onPress={onOpenWicketDialog}
          activeOpacity={0.7}
        >
          <Ionicons name="flame" size={20} color={Colors.white} />
          <Text style={styles.wicketButtonText}>WICKET</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.undoButton,
            {
              backgroundColor: isDarkMode ? '#334155' : Colors.neutral,
              opacity: canUndo ? 1 : 0.4,
            },
          ]}
          onPress={onUndo}
          disabled={!canUndo}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-undo" size={18} color={textPrimary} />
          <Text style={[styles.undoButtonText, { color: textPrimary }]}>UNDO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  runButton: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  runButtonText: {
    fontSize: 26,
    fontWeight: '800',
  },
  boundaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  extrasRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  extraBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  wicketButton: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  wicketButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },
  undoButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  undoButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

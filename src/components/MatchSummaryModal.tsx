import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match, Team, Player } from '@/types/cricket';
import { calculateInnings } from '@/engine/scoringEngine';

interface MatchSummaryModalProps {
  visible: boolean;
  match: Match;
  team1: Team;
  team2: Team;
  onClose: () => void;
  onStartSecondInnings?: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
  onFinishMatch?: () => void;
  isDarkMode?: boolean;
}

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({
  visible,
  match,
  team1,
  team2,
  onClose,
  onStartSecondInnings,
  onFinishMatch,
  isDarkMode = false,
}) => {
  const isInningsBreak = match.status === 'innings_break';
  const isCompleted = match.status === 'completed';

  const innings1BattingTeam = match.innings1.teamBattingId === team1.id ? team1 : team2;
  const innings1BowlingTeam = match.innings1.teamBowlingId === team1.id ? team1 : team2;
  const calc1 = calculateInnings(
    match.innings1,
    innings1BattingTeam.players,
    innings1BowlingTeam.players,
    match.overs,
    match.team1PlayingXI.length || 11
  );

  let calc2 = null;
  let innings2BattingTeam = null;
  if (match.innings2) {
    innings2BattingTeam = match.innings2.teamBattingId === team1.id ? team1 : team2;
    const bowlingTeam = match.innings2.teamBowlingId === team1.id ? team1 : team2;
    calc2 = calculateInnings(
      match.innings2,
      innings2BattingTeam.players,
      bowlingTeam.players,
      match.overs,
      match.team1PlayingXI.length || 11
    );
  }

  // 2nd innings setup states (if in innings break)
  const chasingTeam = innings1BowlingTeam;
  const defendingTeam = innings1BattingTeam;
  const [selectedStrikerId, setSelectedStrikerId] = useState<string>(
    chasingTeam.players[0]?.id || ''
  );
  const [selectedNonStrikerId, setSelectedNonStrikerId] = useState<string>(
    chasingTeam.players[1]?.id || ''
  );
  const [selectedBowlerId, setSelectedBowlerId] = useState<string>(
    defendingTeam.players[0]?.id || ''
  );

  const bgModal = isDarkMode ? '#1e293b' : '#ffffff';
  const textPrimary = isDarkMode ? '#f8fafc' : '#0f172a';
  const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
  const borderCol = isDarkMode ? '#334155' : '#e2e8f0';
  const accentCol = isDarkMode ? '#38bdf8' : '#0284c7';

  const handleShare = async () => {
    let message = `🏏 *Cricket Match Result*\n${team1.name} vs ${team2.name}\nVenue: ${match.venue}\n\n`;
    message += `1st Inn: ${innings1BattingTeam.name} - ${calc1.totalRuns}/${calc1.totalWickets} (${calc1.oversFormatted} ov)\n`;
    if (calc2 && innings2BattingTeam) {
      message += `2nd Inn: ${innings2BattingTeam.name} - ${calc2.totalRuns}/${calc2.totalWickets} (${calc2.oversFormatted} ov)\n`;
    }
    if (match.result) {
      message += `\n*Result:* ${match.result}\n`;
    }
    message += `\nScored digitally with Offline Cricket Scorebook`;

    try {
      await Share.share({ message });
    } catch (e) {
      console.log('Share error', e);
    }
  };

  const handleConfirmStart2nd = () => {
    if (onStartSecondInnings) {
      onStartSecondInnings(selectedStrikerId, selectedNonStrikerId, selectedBowlerId);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: bgModal, borderColor: borderCol }]}>
          <View style={styles.modalHeader}>
            <View style={styles.titleBadge}>
              <Ionicons
                name={isCompleted ? 'trophy' : 'pause-circle'}
                size={22}
                color={isCompleted ? '#eab308' : accentCol}
              />
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                {isCompleted ? 'MATCH COMPLETE' : 'INNINGS BREAK'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Result Header if Completed */}
            {isCompleted && match.result && (
              <View style={[styles.resultBox, { backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5', borderColor: '#10b981' }]}>
                <Text style={[styles.resultText, { color: isDarkMode ? '#34d399' : '#059669' }]}>
                  {match.result}
                </Text>
              </View>
            )}

            {/* Score Summaries */}
            <View style={[styles.scoreSummaryCard, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: borderCol }]}>
              <View style={styles.innRow}>
                <Text style={[styles.teamName, { color: textPrimary }]}>{innings1BattingTeam.name}</Text>
                <Text style={[styles.teamScore, { color: textPrimary }]}>
                  {calc1.totalRuns}/{calc1.totalWickets}{' '}
                  <Text style={[styles.teamOvers, { color: textSecondary }]}>({calc1.oversFormatted} ov)</Text>
                </Text>
              </View>

              {calc2 && innings2BattingTeam && (
                <View style={[styles.innRow, { marginTop: 10 }]}>
                  <Text style={[styles.teamName, { color: textPrimary }]}>{innings2BattingTeam.name}</Text>
                  <Text style={[styles.teamScore, { color: textPrimary }]}>
                    {calc2.totalRuns}/{calc2.totalWickets}{' '}
                    <Text style={[styles.teamOvers, { color: textSecondary }]}>({calc2.oversFormatted} ov)</Text>
                  </Text>
                </View>
              )}

              {isInningsBreak && (
                <View style={styles.targetCallout}>
                  <Text style={[styles.targetCalloutText, { color: accentCol }]}>
                    Target for {chasingTeam.name}: <Text style={styles.boldText}>{calc1.totalRuns + 1}</Text> runs
                  </Text>
                  <Text style={[styles.targetSub, { color: textSecondary }]}>
                    Required Run Rate: {((calc1.totalRuns + 1) / match.overs).toFixed(2)} rpo
                  </Text>
                </View>
              )}
            </View>

            {/* If Innings Break: Setup 2nd Innings Openers & Bowler */}
            {isInningsBreak && (
              <View style={styles.setup2ndContainer}>
                <Text style={[styles.sectionTitle, { color: textSecondary }]}>
                  SELECT 2ND INNINGS OPENERS ({chasingTeam.name})
                </Text>

                <Text style={[styles.subLabel, { color: textSecondary }]}>Striker</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {chasingTeam.players.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selectedStrikerId === p.id ? accentCol : isDarkMode ? '#0f172a' : '#f1f5f9',
                          borderColor: selectedStrikerId === p.id ? accentCol : borderCol,
                        },
                      ]}
                      onPress={() => setSelectedStrikerId(p.id)}
                    >
                      <Text style={[styles.chipText, { color: selectedStrikerId === p.id ? '#fff' : textPrimary }]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.subLabel, { color: textSecondary, marginTop: 8 }]}>Non-Striker</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {chasingTeam.players
                    .filter((p) => p.id !== selectedStrikerId)
                    .map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selectedNonStrikerId === p.id ? accentCol : isDarkMode ? '#0f172a' : '#f1f5f9',
                            borderColor: selectedNonStrikerId === p.id ? accentCol : borderCol,
                          },
                        ]}
                        onPress={() => setSelectedNonStrikerId(p.id)}
                      >
                        <Text style={[styles.chipText, { color: selectedNonStrikerId === p.id ? '#fff' : textPrimary }]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={[styles.sectionTitle, { color: textSecondary, marginTop: 14 }]}>
                  SELECT OPENING BOWLER ({defendingTeam.name})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {defendingTeam.players.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selectedBowlerId === p.id ? accentCol : isDarkMode ? '#0f172a' : '#f1f5f9',
                          borderColor: selectedBowlerId === p.id ? accentCol : borderCol,
                        },
                      ]}
                      onPress={() => setSelectedBowlerId(p.id)}
                    >
                      <Text style={[styles.chipText, { color: selectedBowlerId === p.id ? '#fff' : textPrimary }]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.bottomActions}>
            {isInningsBreak ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: accentCol }]}
                onPress={handleConfirmStart2nd}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Start 2nd Innings</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={[styles.shareBtn, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', borderColor: borderCol }]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-social" size={18} color={textPrimary} />
                  <Text style={[styles.shareBtnText, { color: textPrimary }]}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1, backgroundColor: accentCol }]}
                  onPress={onClose}
                >
                  <Text style={styles.primaryBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '800',
  },
  scoreSummaryCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  innRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '700',
  },
  teamScore: {
    fontSize: 18,
    fontWeight: '800',
  },
  teamOvers: {
    fontSize: 13,
    fontWeight: '500',
  },
  targetCallout: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  targetCalloutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  targetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  boldText: {
    fontWeight: '900',
  },
  setup2ndContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomActions: {
    marginTop: 8,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  shareBtn: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

import { Colors } from '@/constants/colors';
import { Player, WicketDetails, WicketType } from '@/types/cricket';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface WicketModalProps {
  visible: boolean;
  onClose: () => void;
  striker: Player;
  nonStriker: Player;
  currentBowler: Player;
  bowlingTeamPlayers: Player[];
  availableBatters: Player[];
  onConfirmWicket: (params: {
    wicket: WicketDetails;
    newBatsmanId?: string;
    runsBat: number;
  }) => void;
  isDarkMode?: boolean;
}

const WICKET_TYPES: { type: WicketType; label: string }[] = [
  { type: 'bowled', label: 'Bowled' },
  { type: 'caught', label: 'Caught' },
  { type: 'lbw', label: 'LBW' },
  { type: 'run_out', label: 'Run Out' },
  { type: 'stumped', label: 'Stumped' },
  { type: 'hit_wicket', label: 'Hit Wicket' },
  { type: 'retired_hurt', label: 'Retired Hurt' },
  { type: 'obstructing_the_field', label: 'Obstructing' },
];

export const WicketModal: React.FC<WicketModalProps> = ({
  visible,
  onClose,
  striker,
  nonStriker,
  currentBowler,
  bowlingTeamPlayers,
  availableBatters,
  onConfirmWicket,
  isDarkMode = false,
}) => {
  const [selectedOutPlayerId, setSelectedOutPlayerId] = useState<string>(striker.id);
  const [selectedWicketType, setSelectedWicketType] = useState<WicketType>('caught');
  const [selectedFielderId, setSelectedFielderId] = useState<string | undefined>(undefined);
  const [runOutRuns, setRunOutRuns] = useState<number>(0);
  const [selectedNewBatsmanId, setSelectedNewBatsmanId] = useState<string | undefined>(
    availableBatters[0]?.id
  );

  // Keep selectedOutPlayerId aligned when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelectedOutPlayerId(striker.id);
      setSelectedWicketType('caught');
      setSelectedFielderId(undefined);
      setRunOutRuns(0);
      setSelectedNewBatsmanId(availableBatters[0]?.id);
    }
  }, [visible, striker.id, availableBatters]);

  const bgModal = isDarkMode ? Colors.darkBg : Colors.white;
  const textPrimary = isDarkMode ? Colors.white : Colors.secondary;
  const textSecondary = isDarkMode ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDarkMode ? Colors.darkBorder : Colors.lightBorder;
  const accentCol = isDarkMode ? Colors.accentDark : Colors.accent;

  const isFielderRequired = selectedWicketType === 'caught' || selectedWicketType === 'stumped';
  const isRunOut = selectedWicketType === 'run_out';
  const hasMoreBatters = availableBatters.length > 0;

  const handleConfirm = () => {
    const wicket: WicketDetails = {
      playerOutId: selectedOutPlayerId,
      wicketType: selectedWicketType,
      bowlerId: currentBowler.id,
      fielderId: selectedFielderId,
      runOutRunsCompleted: isRunOut ? runOutRuns : 0,
    };

    onConfirmWicket({
      wicket,
      newBatsmanId: hasMoreBatters ? selectedNewBatsmanId : undefined,
      runsBat: isRunOut ? runOutRuns : 0,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: bgModal, borderColor: borderCol }]}>
          <View style={styles.modalHeader}>
            <View style={styles.titleBadge}>
              <Ionicons name="flame" size={20} color={Colors.wicketRed} />
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Fall of Wicket</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Step 1: Who is Out? */}
            <Text style={[styles.sectionLabel, { color: textSecondary }]}>OUT BATSMAN</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  selectedOutPlayerId === striker.id && {
                    backgroundColor: Colors.wicketRed,
                    borderColor: Colors.wicketRed,
                  },
                  selectedOutPlayerId !== striker.id && {
                    borderColor: borderCol,
                  },
                ]}
                onPress={() => setSelectedOutPlayerId(striker.id)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    {
                      color: selectedOutPlayerId === striker.id ? Colors.white : textPrimary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {striker.name} (Striker)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  selectedOutPlayerId === nonStriker.id && {
                    backgroundColor: Colors.wicketRed,
                    borderColor: Colors.wicketRed,
                  },
                  selectedOutPlayerId !== nonStriker.id && {
                    borderColor: borderCol,
                  },
                ]}
                onPress={() => setSelectedOutPlayerId(nonStriker.id)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    {
                      color: selectedOutPlayerId === nonStriker.id ? Colors.white : textPrimary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {nonStriker.name} (Non-Striker)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Step 2: Dismissal Type */}
            <Text style={[styles.sectionLabel, { color: textSecondary, marginTop: 16 }]}>
              DISMISSAL METHOD
            </Text>
            <View style={styles.chipGrid}>
              {WICKET_TYPES.map((wt) => {
                const isSelected = selectedWicketType === wt.type;
                return (
                  <TouchableOpacity
                    key={wt.type}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? isDarkMode
                            ? Colors.accentHighlight
                            : Colors.lightHighlight
                          : isDarkMode
                          ? Colors.secondary
                          : Colors.lightBg,
                        borderColor: isSelected ? accentCol : borderCol,
                      },
                    ]}
                    onPress={() => setSelectedWicketType(wt.type)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? (isDarkMode ? Colors.white : Colors.accentHighlight) : textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {wt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Fielder Selection for Caught / Stumped / Run out */}
            {(isFielderRequired || isRunOut) && (
              <>
                <Text style={[styles.sectionLabel, { color: textSecondary, marginTop: 16 }]}>
                  {selectedWicketType === 'caught'
                    ? 'CAUGHT BY (FIELDER)'
                    : selectedWicketType === 'stumped'
                    ? 'STUMPED BY (WICKETKEEPER)'
                    : 'RUN OUT FIELDER'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                  {bowlingTeamPlayers.map((fielder) => {
                    const isSelected = selectedFielderId === fielder.id;
                    return (
                      <TouchableOpacity
                        key={fielder.id}
                        style={[
                          styles.fielderChip,
                          {
                            backgroundColor: isSelected ? accentCol : isDarkMode ? Colors.secondary : Colors.lightBg,
                            borderColor: isSelected ? accentCol : borderCol,
                          },
                        ]}
                        onPress={() => setSelectedFielderId(isSelected ? undefined : fielder.id)}
                      >
                        <Text
                          style={[
                            styles.fielderChipText,
                            { color: isSelected ? Colors.white : textPrimary },
                          ]}
                        >
                          {fielder.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Run Out Runs */}
            {isRunOut && (
              <>
                <Text style={[styles.sectionLabel, { color: textSecondary, marginTop: 16 }]}>
                  RUNS COMPLETED BEFORE RUN OUT
                </Text>
                <View style={styles.runRow}>
                  {[0, 1, 2, 3].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.runPill,
                        {
                          backgroundColor:
                            runOutRuns === r ? accentCol : isDarkMode ? Colors.darkBgDark : Colors.lightBg,
                          borderColor: runOutRuns === r ? accentCol : borderCol,
                        },
                      ]}
                      onPress={() => setRunOutRuns(r)}
                    >
                      <Text
                        style={[
                          styles.runPillText,
                          { color: runOutRuns === r ? Colors.white : textPrimary },
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Step 3: Next Batsman */}
            {hasMoreBatters ? (
              <>
                <Text style={[styles.sectionLabel, { color: textSecondary, marginTop: 16 }]}>
                  NEXT BATSMAN
                </Text>
                <View style={styles.batterList}>
                  {availableBatters.map((player) => {
                    const isSelected = selectedNewBatsmanId === player.id;
                    return (
                      <TouchableOpacity
                        key={player.id}
                        style={[
                          styles.batterCard,
                          {
                            backgroundColor: isSelected
                              ? isDarkMode
                                ? Colors.accentHighlight
                                : Colors.lightHighlight
                              : isDarkMode
                              ? Colors.darkBgDark
                              : Colors.lightBgSoft,
                            borderColor: isSelected ? accentCol : borderCol,
                          },
                        ]}
                        onPress={() => setSelectedNewBatsmanId(player.id)}
                      >
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={isSelected ? accentCol : textSecondary}
                        />
                        <Text style={[styles.batterName, { color: textPrimary }]}>{player.name}</Text>
                        {player.role && (
                          <Text style={[styles.roleBadge, { color: textSecondary }]}>
                            {player.role}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={[styles.allOutNotice, { backgroundColor: isDarkMode ? Colors.wicketNoticeBg : Colors.wicketNoticeBgLight }]}>
                <Ionicons name="alert-circle" size={18} color={Colors.wicketRed} />
                <Text style={styles.allOutNoticeText}>
                  Last wicket! No more batsmen available.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: Colors.wicketRed }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>Confirm Wicket</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.backdrop,
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
  },
  scrollArea: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  horizontalChips: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  fielderChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  fielderChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  runRow: {
    flexDirection: 'row',
    gap: 12,
  },
  runPill: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  runPillText: {
    fontSize: 16,
    fontWeight: '700',
  },
  batterList: {
    gap: 6,
  },
  batterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  batterName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  roleBadge: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  allOutNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  allOutNoticeText: {
    color: Colors.wicketRed,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.wicketShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});

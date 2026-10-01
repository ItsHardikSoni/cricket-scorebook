import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExtraType } from '@/types/cricket';

interface ExtrasModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmExtra: (params: {
    extraType: ExtraType;
    extraRuns: number;
    runsBat: number;
    isLegal: boolean;
  }) => void;
  isDarkMode?: boolean;
}

export const ExtrasModal: React.FC<ExtrasModalProps> = ({
  visible,
  onClose,
  onConfirmExtra,
  isDarkMode = false,
}) => {
  const [selectedType, setSelectedType] = useState<ExtraType>('wide');
  const [extraValue, setExtraValue] = useState<number>(1);
  const [batRunsValue, setBatRunsValue] = useState<number>(0);

  const bgModal = isDarkMode ? '#1e293b' : '#ffffff';
  const textPrimary = isDarkMode ? '#f8fafc' : '#0f172a';
  const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
  const borderCol = isDarkMode ? '#334155' : '#e2e8f0';
  const accentCol = isDarkMode ? '#38bdf8' : '#0284c7';

  const handleSelectType = (type: ExtraType) => {
    setSelectedType(type);
    if (type === 'wide') {
      setExtraValue(1);
      setBatRunsValue(0);
    } else if (type === 'no_ball') {
      setExtraValue(1);
      setBatRunsValue(0);
    } else if (type === 'bye' || type === 'leg_bye') {
      setExtraValue(1);
      setBatRunsValue(0);
    } else if (type === 'penalty') {
      setExtraValue(5);
      setBatRunsValue(0);
    }
  };

  const handleConfirm = () => {
    const isLegal = selectedType === 'bye' || selectedType === 'leg_bye' || selectedType === 'penalty';
    onConfirmExtra({
      extraType: selectedType,
      extraRuns: extraValue,
      runsBat: batRunsValue,
      isLegal,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: bgModal, borderColor: borderCol }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Detailed Extras</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Extra Category Tabs */}
            <Text style={[styles.sectionLabel, { color: textSecondary }]}>EXTRA TYPE</Text>
            <View style={styles.typeRow}>
              {(['wide', 'no_ball', 'bye', 'leg_bye', 'penalty'] as ExtraType[]).map((type) => {
                const isSelected = selectedType === type;
                const labels: Record<ExtraType, string> = {
                  wide: 'Wide',
                  no_ball: 'No Ball',
                  bye: 'Bye',
                  leg_bye: 'Leg Bye',
                  penalty: 'Penalty',
                };
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeBtn,
                      {
                        backgroundColor: isSelected ? accentCol : isDarkMode ? '#0f172a' : '#f1f5f9',
                        borderColor: isSelected ? accentCol : borderCol,
                      },
                    ]}
                    onPress={() => handleSelectType(type)}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        { color: isSelected ? '#ffffff' : textPrimary },
                      ]}
                    >
                      {labels[type]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Options for Wide */}
            {selectedType === 'wide' && (
              <View style={styles.subSection}>
                <Text style={[styles.sectionLabel, { color: textSecondary }]}>
                  TOTAL WIDE RUNS (1 PENALTY + RUNS RUN/FOUR)
                </Text>
                <View style={styles.valueRow}>
                  {[1, 2, 3, 5].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.valuePill,
                        {
                          backgroundColor:
                            extraValue === val ? accentCol : isDarkMode ? '#0f172a' : '#f1f5f9',
                          borderColor: extraValue === val ? accentCol : borderCol,
                        },
                      ]}
                      onPress={() => setExtraValue(val)}
                    >
                      <Text
                        style={[
                          styles.valuePillText,
                          { color: extraValue === val ? '#ffffff' : textPrimary },
                        ]}
                      >
                        {val === 1 ? '1 (Wide only)' : val === 5 ? '5 (Wd + 4)' : `+${val - 1} runs`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Options for No Ball */}
            {selectedType === 'no_ball' && (
              <View style={styles.subSection}>
                <Text style={[styles.sectionLabel, { color: textSecondary }]}>
                  RUNS OFF BAT ON NO BALL
                </Text>
                <View style={styles.valueRow}>
                  {[0, 1, 2, 3, 4, 6].map((batRuns) => (
                    <TouchableOpacity
                      key={batRuns}
                      style={[
                        styles.valuePill,
                        {
                          backgroundColor:
                            batRunsValue === batRuns ? accentCol : isDarkMode ? '#0f172a' : '#f1f5f9',
                          borderColor: batRunsValue === batRuns ? accentCol : borderCol,
                        },
                      ]}
                      onPress={() => {
                        setBatRunsValue(batRuns);
                        setExtraValue(1); // 1 penalty for NB
                      }}
                    >
                      <Text
                        style={[
                          styles.valuePillText,
                          { color: batRunsValue === batRuns ? '#ffffff' : textPrimary },
                        ]}
                      >
                        {batRuns === 0 ? '0' : `+${batRuns}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Options for Bye / Leg Bye */}
            {(selectedType === 'bye' || selectedType === 'leg_bye') && (
              <View style={styles.subSection}>
                <Text style={[styles.sectionLabel, { color: textSecondary }]}>RUNS SCORED</Text>
                <View style={styles.valueRow}>
                  {[1, 2, 3, 4].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.valuePill,
                        {
                          backgroundColor:
                            extraValue === val ? accentCol : isDarkMode ? '#0f172a' : '#f1f5f9',
                          borderColor: extraValue === val ? accentCol : borderCol,
                        },
                      ]}
                      onPress={() => setExtraValue(val)}
                    >
                      <Text
                        style={[
                          styles.valuePillText,
                          { color: extraValue === val ? '#ffffff' : textPrimary },
                        ]}
                      >
                        {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Summary callout */}
            <View style={[styles.summaryBox, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: borderCol }]}>
              <Text style={[styles.summaryText, { color: textPrimary }]}>
                Recorded: {extraValue + batRunsValue} total runs (
                {selectedType.replace('_', ' ').toUpperCase()}
                {batRunsValue > 0 ? ` + ${batRunsValue} off bat` : ''})
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: accentCol }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>Record Delivery</Text>
          </TouchableOpacity>
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
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subSection: {
    marginBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  valuePill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  valuePillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});

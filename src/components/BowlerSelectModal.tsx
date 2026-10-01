import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BowlerScorecard, Player } from '@/types/cricket';

interface BowlerSelectModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  bowlingPlayers: Player[];
  bowlerScorecards: BowlerScorecard[];
  lastOverBowlerId?: string;
  onSelectBowler: (bowlerId: string) => void;
  isDarkMode?: boolean;
}

export const BowlerSelectModal: React.FC<BowlerSelectModalProps> = ({
  visible,
  onClose,
  title = 'Select Bowler',
  bowlingPlayers,
  bowlerScorecards,
  lastOverBowlerId,
  onSelectBowler,
  isDarkMode = false,
}) => {
  const bgModal = isDarkMode ? '#1e293b' : '#ffffff';
  const textPrimary = isDarkMode ? '#f8fafc' : '#0f172a';
  const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
  const borderCol = isDarkMode ? '#334155' : '#e2e8f0';
  const accentCol = isDarkMode ? '#38bdf8' : '#0284c7';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: bgModal, borderColor: borderCol }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>{title}</Text>
              <Text style={[styles.modalSubtitle, { color: textSecondary }]}>
                A bowler cannot bowl consecutive overs
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {bowlingPlayers.map((player) => {
              const card = bowlerScorecards.find((c) => c.playerId === player.id);
              const isLastOverBowler = player.id === lastOverBowlerId;

              return (
                <TouchableOpacity
                  key={player.id}
                  disabled={isLastOverBowler}
                  style={[
                    styles.playerItem,
                    {
                      backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                      borderColor: borderCol,
                      opacity: isLastOverBowler ? 0.45 : 1,
                    },
                  ]}
                  onPress={() => {
                    onSelectBowler(player.id);
                    onClose();
                  }}
                >
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { color: textPrimary }]}>
                      {player.name}
                      {isLastOverBowler ? ' (Just Bowled)' : ''}
                    </Text>
                    {player.role && (
                      <Text style={[styles.roleBadge, { color: textSecondary }]}>
                        {player.role}
                      </Text>
                    )}
                  </View>

                  <View style={styles.figuresCol}>
                    <Text style={[styles.figuresText, { color: textPrimary }]}>
                      {card ? `${card.overs}-${card.maidens}-${card.runsConceded}-${card.wickets}` : 'Yet to bowl'}
                    </Text>
                    {card && card.legalBalls > 0 && (
                      <Text style={[styles.econText, { color: textSecondary }]}>
                        Econ: {card.economy.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollList: {
    marginBottom: 12,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleBadge: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  figuresCol: {
    alignItems: 'flex-end',
  },
  figuresText: {
    fontSize: 14,
    fontWeight: '700',
  },
  econText: {
    fontSize: 11,
    marginTop: 2,
  },
});

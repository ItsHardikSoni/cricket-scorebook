import { useCricketStore } from '@/storage/cricketStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { teams, updateTeam, addPlayerToTeam, removePlayerFromTeam, settings } = useCricketStore();
  const isDark = settings.darkMode;

  const team = teams.find((t) => t.id === id);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState(team?.name || '');

  const bgScreen = isDark ? Colors.screenBgDark : Colors.screenBgLight;
  const bgCard = isDark ? Colors.cardBgDark : Colors.white;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimaryLight;
  const textSecondary = isDark ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDark ? Colors.darkBg : Colors.lightBorder;
  const accentCol = isDark ? Colors.accentDark : Colors.accent;

  if (!team) {
    return (
      <View style={[styles.safeArea, { backgroundColor: bgScreen }]}>
        <View style={styles.emptyContainer}>
          <Text style={{ color: textPrimary }}>Team not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: accentCol, marginTop: 10 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSaveTeamName = async () => {
    if (!teamNameInput.trim()) return;
    await updateTeam(team.id, { name: teamNameInput.trim() });
    setEditingName(false);
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Player Name Required', 'Please enter a name for the new player');
      return;
    }
    await addPlayerToTeam(team.id, {
      name: newPlayerName.trim(),
      role: 'batsman',
    });
    setNewPlayerName('');
  };

  const handleToggleCaptain = async (playerId: string) => {
    const updatedPlayers = team.players.map((p) => ({
      ...p,
      isCaptain: p.id === playerId ? !p.isCaptain : false, // only one captain
    }));
    await updateTeam(team.id, { players: updatedPlayers });
  };

  const handleToggleWicketkeeper = async (playerId: string) => {
    const updatedPlayers = team.players.map((p) => ({
      ...p,
      isWicketkeeper: p.id === playerId ? !p.isWicketkeeper : false, // only one WK
    }));
    await updateTeam(team.id, { players: updatedPlayers });
  };

  const handleRemove = (playerId: string, playerName: string) => {
    if (team.players.length <= 2) {
      Alert.alert('Cannot Remove', 'Team must have at least 2 players');
      return;
    }
    Alert.alert('Remove Player', `Remove ${playerName} from ${team.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removePlayerFromTeam(team.id, playerId);
        },
      },
    ]);
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: bgScreen }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderCol }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Team Roster</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Team Banner */}
        <View style={[styles.teamCard, { backgroundColor: bgCard, borderColor: borderCol }]}>
          <View style={styles.teamCardHeader}>
            <View style={[styles.avatar, { backgroundColor: team.color || accentCol }]}>
              <Text style={styles.avatarText}>{team.shortName.slice(0, 3)}</Text>
            </View>

            <View style={{ flex: 1 }}>
              {editingName ? (
                <View style={styles.editNameRow}>
                  <TextInput
                    style={[styles.nameInput, { color: textPrimary, borderColor: borderCol }]}
                    value={teamNameInput}
                    onChangeText={setTeamNameInput}
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSaveTeamName} style={styles.saveNameBtn}>
                    <Ionicons name="checkmark" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.nameRow}>
                  <Text style={[styles.teamName, { color: textPrimary }]}>{team.name}</Text>
                  <TouchableOpacity onPress={() => setEditingName(true)}>
                    <Ionicons name="pencil" size={16} color={accentCol} />
                  </TouchableOpacity>
                </View>
              )}
              <Text style={[styles.teamSub, { color: textSecondary }]}>
                {team.shortName} • {team.players.length} players
              </Text>
            </View>
          </View>
        </View>

        {/* Add Player Box */}
        <Text style={[styles.sectionTitle, { color: textSecondary, marginTop: 20 }]}>
          ADD NEW PLAYER
        </Text>
        <View style={[styles.addCard, { backgroundColor: bgCard, borderColor: borderCol }]}>
          <TextInput
            style={[styles.addInput, { color: textPrimary }]}
            placeholder="Player name..."
            placeholderTextColor={textSecondary}
            value={newPlayerName}
            onChangeText={setNewPlayerName}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: accentCol }]}
            onPress={handleAddPlayer}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Player Roster */}
        <Text style={[styles.sectionTitle, { color: textSecondary, marginTop: 24 }]}>
          ROSTER ({team.players.length})
        </Text>
        <View style={styles.playerList}>
          {team.players.map((p, idx) => (
            <View
              key={p.id}
              style={[styles.playerItem, { backgroundColor: bgCard, borderColor: borderCol }]}
            >
              <View style={styles.indexBox}>
                <Text style={[styles.indexText, { color: textSecondary }]}>{idx + 1}</Text>
              </View>

              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: textPrimary }]}>{p.name}</Text>
                <View style={styles.badgesRow}>
                  {p.isCaptain && (
                    <View style={styles.cBadge}>
                      <Text style={styles.cBadgeText}>Captain</Text>
                    </View>
                  )}
                  {p.isWicketkeeper && (
                    <View style={styles.wkBadge}>
                      <Text style={styles.wkBadgeText}>Wicketkeeper</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Badges */}
              <View style={styles.playerActions}>
                <TouchableOpacity
                  style={[
                    styles.tagBtn,
                    {
                      backgroundColor: p.isCaptain ? accentCol : isDark ? '#1e293b' : '#f1f5f9',
                    },
                  ]}
                  onPress={() => handleToggleCaptain(p.id)}
                >
                  <Text
                    style={[
                      styles.tagBtnText,
                      { color: p.isCaptain ? '#ffffff' : textSecondary },
                    ]}
                  >
                    C
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tagBtn,
                    {
                      backgroundColor: p.isWicketkeeper
                        ? isDark
                          ? '#15803d'
                          : '#22c55e'
                        : isDark
                        ? '#1e293b'
                        : '#f1f5f9',
                    },
                  ]}
                  onPress={() => handleToggleWicketkeeper(p.id)}
                >
                  <Text
                    style={[
                      styles.tagBtnText,
                      { color: p.isWicketkeeper ? '#ffffff' : textSecondary },
                    ]}
                  >
                    WK
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRemove(p.id, p.name)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  teamCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '800',
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  saveNameBtn: {
    backgroundColor: '#0284c7',
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamSub: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  addInput: {
    flex: 1,
    fontSize: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  playerList: {
    gap: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  indexBox: {
    width: 22,
    alignItems: 'center',
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  cBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  cBadgeText: {
    color: '#0284c7',
    fontSize: 10,
    fontWeight: '700',
  },
  wkBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  wkBadgeText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '700',
  },
  playerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

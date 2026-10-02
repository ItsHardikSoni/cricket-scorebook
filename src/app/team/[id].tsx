import { Colors } from '@/constants/colors';
import { useCricketStore } from '@/storage/cricketStore';
import type { Player } from '@/types/cricket';
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

type PlayerRoleEdits = Partial<Pick<Player, 'isCaptain' | 'isViceCaptain' | 'isWicketkeeper'>>;

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { teams, updateTeam, addPlayerToTeam, removePlayerFromTeam, settings } = useCricketStore();
  const isDark = settings.darkMode;

  const team = teams.find((t) => t.id === id);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState(team?.name || '');
  const [playerRoleEdits, setPlayerRoleEdits] = useState<Record<string, PlayerRoleEdits>>({});
  const [isSavingChanges, setIsSavingChanges] = useState(false);

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

  const displayPlayers = team.players.map((player) => ({
    ...player,
    ...playerRoleEdits[player.id],
  }));

  const handleSaveChanges = async () => {
    const name = teamNameInput.trim();
    if (!name) {
      Alert.alert('Team Name Required', 'Please enter a team name before saving.');
      return;
    }

    const players = team.players.map((player) => ({
      ...player,
      ...playerRoleEdits[player.id],
    }));

    setIsSavingChanges(true);
    try {
      await updateTeam(team.id, { name, players });
      setPlayerRoleEdits({});
      setEditingName(false);
    } catch {
      Alert.alert('Save Failed', 'Team changes could not be saved. Please try again.');
    } finally {
      setIsSavingChanges(false);
    }
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

  const handleToggleCaptain = (playerId: string) => {
    const selectedPlayer = displayPlayers.find((player) => player.id === playerId);
    if (!selectedPlayer) return;
    const isSelecting = !selectedPlayer.isCaptain;

    setPlayerRoleEdits((current) => {
      const next = { ...current };
      team.players.forEach((player) => {
        const edits: PlayerRoleEdits = {
          ...current[player.id],
          isCaptain: player.id === playerId ? isSelecting : false,
        };
        if (player.id === playerId && isSelecting) edits.isViceCaptain = false;
        next[player.id] = edits;
      });
      return next;
    });
  };

  const handleToggleViceCaptain = (playerId: string) => {
    const selectedPlayer = displayPlayers.find((player) => player.id === playerId);
    if (!selectedPlayer) return;
    const isSelecting = !selectedPlayer.isViceCaptain;

    setPlayerRoleEdits((current) => {
      const next = { ...current };
      team.players.forEach((player) => {
        const edits: PlayerRoleEdits = {
          ...current[player.id],
          isViceCaptain: player.id === playerId ? isSelecting : false,
        };
        if (player.id === playerId && isSelecting) edits.isCaptain = false;
        next[player.id] = edits;
      });
      return next;
    });
  };

  const handleToggleWicketkeeper = (playerId: string) => {
    const selectedPlayer = displayPlayers.find((player) => player.id === playerId);
    if (!selectedPlayer) return;
    const isSelecting = !selectedPlayer.isWicketkeeper;

    setPlayerRoleEdits((current) => {
      const next = { ...current };
      team.players.forEach((player) => {
        next[player.id] = {
          ...current[player.id],
          isWicketkeeper: player.id === playerId ? isSelecting : false,
        };
      });
      return next;
    });
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

            <View style={styles.teamDetails}>
              {editingName ? (
                <View style={styles.editNameRow}>
                  <TextInput
                    style={[styles.nameInput, { color: textPrimary, borderColor: borderCol }]}
                    value={teamNameInput}
                    onChangeText={setTeamNameInput}
                    autoFocus
                    multiline
                    textAlignVertical="center"
                  />
                </View>
              ) : (
                <View style={styles.nameRow}>
                  <Text style={[styles.teamName, { color: textPrimary }]}>{team.name}</Text>
                  <TouchableOpacity onPress={() => setEditingName(true)} accessibilityLabel="Edit team name">
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
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Player Roster */}
        <Text style={[styles.sectionTitle, { color: textSecondary, marginTop: 24 }]}>
          ROSTER ({team.players.length})
        </Text>
        <View style={styles.playerList}>
          {displayPlayers.map((p, idx) => (
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
                  {p.isViceCaptain && (
                    <View style={styles.vcBadge}>
                      <Text style={styles.vcBadgeText}>Vice-captain</Text>
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
                      backgroundColor: p.isCaptain ? accentCol : isDark ? Colors.darkBg : Colors.lightBg,
                    },
                  ]}
                  onPress={() => handleToggleCaptain(p.id)}
                  disabled={isSavingChanges}
                >
                  <Text
                    style={[
                      styles.tagBtnText,
                      { color: p.isCaptain ? Colors.white : textSecondary },
                    ]}
                  >
                    C
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tagBtn,
                    {
                      backgroundColor: p.isViceCaptain ? accentCol : isDark ? Colors.darkBg : Colors.lightBg,
                    },
                  ]}
                  onPress={() => handleToggleViceCaptain(p.id)}
                  disabled={isSavingChanges}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: Boolean(p.isViceCaptain) }}
                  accessibilityLabel={`Vice-captain for ${p.name}`}
                >
                  <Text
                    style={[
                      styles.tagBtnText,
                      { color: p.isViceCaptain ? Colors.white : textSecondary },
                    ]}
                  >
                    VC
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tagBtn,
                    {
                      backgroundColor: p.isWicketkeeper
                        ? isDark
                          ? Colors.boundaryBgDark
                          : Colors.boundaryBg
                        : isDark
                        ? Colors.darkBg
                        : Colors.lightBg,
                    },
                  ]}
                  onPress={() => handleToggleWicketkeeper(p.id)}
                  disabled={isSavingChanges}
                >
                  <Text
                    style={[
                      styles.tagBtnText,
                      { color: p.isWicketkeeper ? Colors.white : textSecondary },
                    ]}
                  >
                    WK
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRemove(p.id, p.name)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.trash} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveChangesBtn, { backgroundColor: accentCol, opacity: isSavingChanges ? 0.65 : 1 }]}
          onPress={handleSaveChanges}
          disabled={isSavingChanges}
          activeOpacity={0.8}
        >
          <Ionicons name="save-outline" size={18} color={Colors.white} />
          <Text style={styles.saveChangesText}>{isSavingChanges ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
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
    alignItems: 'flex-start',
    gap: 14,
  },
  teamDetails: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  teamName: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '700',
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
    color: Colors.white,
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
    backgroundColor: Colors.lightHighlight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  cBadgeText: {
    color: Colors.accentHighlight,
    fontSize: 10,
    fontWeight: '700',
  },
  vcBadge: {
    backgroundColor: Colors.lightBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vcBadgeText: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  wkBadge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  wkBadgeText: {
    color: Colors.boundaryBgDark,
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
  saveChangesBtn: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    marginTop: 16,
  },
  saveChangesText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

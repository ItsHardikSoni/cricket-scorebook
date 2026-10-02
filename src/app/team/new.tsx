import { useAppAlert } from '@/components/AppAlertProvider';
import { Colors } from '@/constants/colors';
import { useCricketStore } from '@/storage/cricketStore';
import { Player } from '@/types/cricket';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CreateTeamScreen() {
  const router = useRouter();
  const showAlert = useAppAlert();
  const { createTeam, settings } = useCricketStore();
  const isDark = settings.darkMode;

  const bgScreen = isDark ? Colors.screenBgDark : Colors.screenBgLight;
  const bgCard = isDark ? Colors.cardBgDark : Colors.white;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimaryLight;
  const textSecondary = isDark ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDark ? Colors.darkBg : Colors.lightBorder;
  const accentCol = isDark ? Colors.accentDark : Colors.accent;

  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const newPlayerRole: Player['role'] = 'batsman';

  const [players, setPlayers] = useState<Omit<Player, 'id'>[]>([]);

  const togglePlayerDesignation = (
    playerIndex: number,
    designation: 'isCaptain' | 'isViceCaptain' | 'isWicketkeeper'
  ) => {
    const isSelecting = !players[playerIndex][designation];
    setPlayers(players.map((player, index) => {
      const updatedPlayer = { ...player, [designation]: index === playerIndex ? isSelecting : false };
      if (index === playerIndex && isSelecting && designation === 'isCaptain') {
        updatedPlayer.isViceCaptain = false;
      }
      if (index === playerIndex && isSelecting && designation === 'isViceCaptain') {
        updatedPlayer.isCaptain = false;
      }
      return updatedPlayer;
    }));
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) {
      showAlert('Player Name Required', 'Please enter a player name');
      return;
    }
    setPlayers([
      ...players,
      {
        name: newPlayerName.trim(),
        role: newPlayerRole,
      },
    ]);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (index: number) => {
    setPlayers(players.filter((_, idx) => idx !== index));
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      showAlert('Team Name Required', 'Please enter a name for the team');
      return;
    }
    const finalShortName = (shortName.trim() || teamName.slice(0, 3)).toUpperCase();

    if (players.length < 2) {
      showAlert('Players Required', 'Please add at least 2 players to the team');
      return;
    }
    if (!players.some((player) => player.isCaptain)) {
      showAlert('Captain Required', 'Choose a captain before saving the team');
      return;
    }
    if (!players.some((player) => player.isViceCaptain)) {
      showAlert('Vice-Captain Required', 'Choose a vice-captain before saving the team');
      return;
    }
    if (!players.some((player) => player.isWicketkeeper)) {
      showAlert('Wicketkeeper Required', 'Choose a wicketkeeper before saving the team');
      return;
    }

    await createTeam({
      name: teamName.trim(),
      shortName: finalShortName,
      players,
    });

    router.back();
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: bgScreen }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderCol }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Create Team</Text>
        <TouchableOpacity onPress={handleSaveTeam}>
          <Text style={[styles.saveText, { color: accentCol }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Team Details */}
        <Text style={[styles.fieldLabel, { color: textSecondary }]}>TEAM NAME</Text>
        <TextInput
          style={[styles.input, { backgroundColor: bgCard, borderColor: borderCol, color: textPrimary }]}
          placeholder="e.g. Royal Strikers"
          placeholderTextColor={textSecondary}
          value={teamName}
          onChangeText={setTeamName}
        />

        <Text style={[styles.fieldLabel, { color: textSecondary, marginTop: 16 }]}>SHORT CODE</Text>
        <TextInput
          style={[styles.input, { backgroundColor: bgCard, borderColor: borderCol, color: textPrimary }]}
          placeholder="e.g. RS (2-4 letters)"
          placeholderTextColor={textSecondary}
          maxLength={4}
          autoCapitalize="characters"
          value={shortName}
          onChangeText={setShortName}
        />

        {/* Players Roster Section */}
        <View style={styles.rosterHeader}>
          <Text style={[styles.fieldLabel, { color: textSecondary }]}>
            PLAYERS ROSTER ({players.length})
          </Text>
        </View>

        {/* Quick Add Player Row */}
        <View style={[styles.addPlayerCard, { backgroundColor: bgCard, borderColor: borderCol }]}>
          <TextInput
            style={[styles.addInput, { color: textPrimary }]}
            placeholder="Add player name..."
            placeholderTextColor={textSecondary}
            value={newPlayerName}
            onChangeText={setNewPlayerName}
          />
          <TouchableOpacity
            style={[styles.addPlayerBtn, { backgroundColor: accentCol }]}
            onPress={handleAddPlayer}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Player List */}
        <View style={styles.playerList}>
          {players.map((p, idx) => (
            <View
              key={idx}
              style={[styles.playerItem, { backgroundColor: bgCard, borderColor: borderCol }]}
            >
              <View style={styles.playerNumber}>
                <Text style={[styles.playerNumberText, { color: textSecondary }]}>{idx + 1}</Text>
              </View>
              <View style={styles.playerDetails}>
                <Text style={[styles.playerName, { color: textPrimary }]}>{p.name}</Text>
                <Text style={[styles.playerRole, { color: textSecondary }]}>
                  {p.role || 'Player'}
                </Text>
                <View style={styles.designationsRow}>
                  {([
                    ['isCaptain', 'Captain'],
                    ['isViceCaptain', 'Vice-captain'],
                    ['isWicketkeeper', 'Wicketkeeper'],
                  ] as const).map(([designation, label]) => {
                    const selected = Boolean(p[designation]);
                    return (
                      <TouchableOpacity
                        key={designation}
                        style={[
                          styles.designationButton,
                          {
                            backgroundColor: selected ? accentCol : isDark ? Colors.darkBg : Colors.lightBg,
                            borderColor: selected ? accentCol : borderCol,
                          },
                        ]}
                        onPress={() => togglePlayerDesignation(idx, designation)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={`${label} for ${p.name}`}
                      >
                        <Text style={[styles.designationText, { color: selected ? Colors.white : textSecondary }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemovePlayer(idx)}>
                <Ionicons name="trash-outline" size={18} color={Colors.trash} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Save Button */}
      <View style={[styles.footer, { backgroundColor: bgCard, borderTopColor: borderCol }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: accentCol }]}
          onPress={handleSaveTeam}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>Save Team</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  rosterHeader: {
    marginTop: 24,
    marginBottom: 8,
  },
  addPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  addInput: {
    flex: 1,
    fontSize: 15,
  },
  addPlayerBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerList: {
    gap: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  playerNumber: {
    width: 24,
    alignItems: 'center',
  },
  playerNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  playerRole: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 1,
  },
  designationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  designationButton: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  designationText: {
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});

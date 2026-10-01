import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCricketStore } from '@/storage/cricketStore';
import { Player } from '@/types/cricket';

export default function CreateTeamScreen() {
  const router = useRouter();
  const { createTeam, settings } = useCricketStore();
  const isDark = settings.darkMode;

  const bgScreen = isDark ? '#090d16' : '#f8fafc';
  const bgCard = isDark ? '#131b2e' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#1e293b' : '#e2e8f0';
  const accentCol = isDark ? '#38bdf8' : '#0284c7';

  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<Player['role']>('batsman');

  const [players, setPlayers] = useState<Omit<Player, 'id'>[]>([
    { name: 'Player 1', role: 'batsman', isCaptain: true },
    { name: 'Player 2', role: 'batsman' },
    { name: 'Player 3', role: 'all_rounder', isWicketkeeper: true },
    { name: 'Player 4', role: 'all_rounder' },
    { name: 'Player 5', role: 'bowler' },
  ]);

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Player Name Required', 'Please enter a player name');
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
      Alert.alert('Team Name Required', 'Please enter a name for the team');
      return;
    }
    const finalShortName = (shortName.trim() || teamName.slice(0, 3)).toUpperCase();

    if (players.length < 2) {
      Alert.alert('Players Required', 'Please add at least 2 players to the team');
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
            <Ionicons name="add" size={20} color="#ffffff" />
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
                  {p.role} {p.isCaptain ? '• Captain' : ''} {p.isWicketkeeper ? '• WK' : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemovePlayer(idx)}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});

import { Colors } from '@/constants/colors';
import { useCricketStore } from '@/storage/cricketStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TeamsScreen() {
  const router = useRouter();
  const { teams, deleteTeam, settings } = useCricketStore();
  const isDark = settings.darkMode;

  const bgScreen = isDark ? Colors.screenBgDark : Colors.screenBgLight;
  const bgCard = isDark ? Colors.cardBgDark : Colors.white;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimaryLight;
  const textSecondary = isDark ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDark ? Colors.darkBg : Colors.lightBorder;
  const accentCol = isDark ? Colors.accentDark : Colors.accent;

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    Alert.alert(
      'Delete Team',
      `Are you sure you want to delete ${teamName}? Matches scored with this team will retain their data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTeam(teamId);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: bgScreen }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderCol }]}>
        <Text style={[styles.title, { color: textPrimary }]}>Teams</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: accentCol }]}
          onPress={() => router.push('/team/new')}
        >
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>Create Team</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {teams.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: bgCard, borderColor: borderCol }]}>
            <Ionicons name="people-outline" size={40} color={textSecondary} />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No teams yet</Text>
            <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
              Create your first team with players to start scoring matches.
            </Text>
          </View>
        ) : (
          teams.map((team) => {
            const captain = team.players.find((p) => p.isCaptain);
            const viceCaptain = team.players.find((p) => p.isViceCaptain);
            const wk = team.players.find((p) => p.isWicketkeeper);

            return (
              <View
                key={team.id}
                style={[styles.teamCard, { backgroundColor: bgCard, borderColor: borderCol }]}
              >
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => router.push(`/team/${team.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: team.color || accentCol }]}>
                    <Text style={styles.avatarText}>{team.shortName.slice(0, 3)}</Text>
                  </View>

                  <View style={styles.teamDetails}>
                    <Text style={[styles.teamName, { color: textPrimary }]}>{team.name}</Text>
                    <Text style={[styles.playerCount, { color: textSecondary }]}>
                      {team.players.length} players registered
                    </Text>
                    <View style={styles.badgesRow}>
                      {captain && (
                        <View style={[styles.roleBadge, { backgroundColor: isDark ? Colors.darkBg : Colors.lightBg }]}>
                          <Text style={[styles.roleBadgeText, { color: textSecondary }]}>
                            (C) {captain.name}
                          </Text>
                        </View>
                      )}
                      {viceCaptain && (
                        <View
                          style={[styles.roleBadge, { backgroundColor: isDark ? Colors.darkBg : Colors.lightBg }]}
                        >
                          <Text style={[styles.roleBadgeText, { color: textSecondary }]}>
                            (VC) {viceCaptain.name}
                          </Text>
                        </View>
                      )}
                      {wk && (
                        <View style={[styles.roleBadge, { backgroundColor: isDark ? Colors.darkBg : Colors.lightBg }]}>
                          <Text style={[styles.roleBadgeText, { color: textSecondary }]}>
                            (WK) {wk.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={textSecondary} />
                </TouchableOpacity>

                <View style={[styles.cardFooter, { borderTopColor: borderCol }]}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => router.push(`/team/${team.id}`)}
                  >
                    <Ionicons name="pencil-outline" size={14} color={accentCol} />
                    <Text style={[styles.editBtnText, { color: accentCol }]}>Edit Roster</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteTeam(team.id, team.name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.trash} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  teamCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '700',
  },
  playerCount: {
    fontSize: 12,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});

import { calculateInnings } from '@/engine/scoringEngine';
import { useCricketStore } from '@/storage/cricketStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '@/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { matches, teams, activeMatchId, setActiveMatch, settings } = useCricketStore();
  const isDark = settings.darkMode;

  const bgScreen = isDark ? Colors.screenBgDark : Colors.screenBgLight;
  const bgCard = isDark ? Colors.cardBgDark : Colors.white;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimaryLight;
  const textSecondary = isDark ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDark ? Colors.darkBg : Colors.lightBorder;
  const accentCol = isDark ? Colors.accentDark : Colors.accent;

  // Active match
  const activeMatch = matches.find(
    (m) => (m.status === 'innings1' || m.status === 'innings2' || m.status === 'innings_break') && m.id === activeMatchId
  ) || matches.find(
    (m) => m.status === 'innings1' || m.status === 'innings2' || m.status === 'innings_break'
  );

  // Recent matches (completed or past)
  const recentMatches = matches.filter((m) => m.id !== activeMatch?.id).slice(0, 5);

  const getTeam = (id: string) => teams.find((t) => t.id === id);

  const renderActiveCard = () => {
    if (!activeMatch) return null;

    const team1 = getTeam(activeMatch.team1Id);
    const team2 = getTeam(activeMatch.team2Id);
    const isInnings2 = activeMatch.status === 'innings2';
    const activeInnings = isInnings2 && activeMatch.innings2 ? activeMatch.innings2 : activeMatch.innings1;
    const battingTeam = getTeam(activeInnings.teamBattingId);
    const bowlingTeam = getTeam(activeInnings.teamBowlingId);

    const calc = calculateInnings(
      activeInnings,
      battingTeam?.players || [],
      bowlingTeam?.players || [],
      activeMatch.overs,
      activeMatch.team1PlayingXI.length || 11
    );

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>ACTIVE MATCH</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={[styles.activeCard, { backgroundColor: bgCard, borderColor: borderCol }]}>
          <View style={styles.activeTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeTeams, { color: textPrimary }]}>
                {team1?.name} vs {team2?.name}
              </Text>
              <Text style={[styles.activeVenue, { color: textSecondary }]}>
                {activeMatch.venue} • {activeMatch.format} ({activeMatch.overs} ov)
              </Text>
            </View>
          </View>

          <View style={styles.activeScoreRow}>
            <View>
              <Text style={[styles.battingTeamName, { color: accentCol }]}>
                {battingTeam?.shortName || battingTeam?.name}
              </Text>
              <Text style={[styles.activeScoreValue, { color: textPrimary }]}>
                {calc.totalRuns}/{calc.totalWickets}
                <Text style={[styles.activeOversValue, { color: textSecondary }]}>
                  {' '}• {calc.oversFormatted} ov
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: accentCol }]}
              onPress={async () => {
                await setActiveMatch(activeMatch.id);
                router.push('/match/scoring');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View>
            <Text style={[styles.brandTitle, { color: textPrimary }]}>Cricket Scorebook</Text>
            <Text style={[styles.brandSubtitle, { color: textSecondary }]}>
              Offline Digital Match Scoring
            </Text>
          </View>
          <View style={[styles.offlineBadge, { backgroundColor: isDark ? '#1e293b' : '#e0f2fe' }]}>
            <Ionicons name="cloud-offline" size={14} color={accentCol} />
            <Text style={[styles.offlineText, { color: accentCol }]}>Offline</Text>
          </View>
        </View>

        {/* Primary Action Button: + New Match */}
        <TouchableOpacity
          style={[styles.newMatchBtn, { backgroundColor: accentCol }]}
          onPress={() => router.push('/match/new')}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={24} color="#ffffff" />
          <Text style={styles.newMatchBtnText}>New Match</Text>
        </TouchableOpacity>

        {/* Continue Active Match */}
        {renderActiveCard()}

        {/* Recent Matches */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: textSecondary }]}>RECENT MATCHES</Text>
            {recentMatches.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/matches')}>
                <Text style={[styles.viewAllText, { color: accentCol }]}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentMatches.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: bgCard, borderColor: borderCol }]}>
              <Ionicons name="baseball-outline" size={36} color={textSecondary} />
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>No completed matches yet</Text>
              <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                Start a new match above to record deliveries offline.
              </Text>
            </View>
          ) : (
            recentMatches.map((m) => {
              const team1 = getTeam(m.team1Id);
              const team2 = getTeam(m.team2Id);
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.recentCard, { backgroundColor: bgCard, borderColor: borderCol }]}
                  onPress={() => router.push(`/match/${m.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.recentCardLeft}>
                    <Text style={[styles.recentTeams, { color: textPrimary }]}>
                      {team1?.name} vs {team2?.name}
                    </Text>
                    <Text style={[styles.recentDate, { color: textSecondary }]}>
                      {m.date} • {m.venue}
                    </Text>
                    {m.result && (
                      <Text style={[styles.recentResult, { color: isDark ? '#34d399' : '#059669' }]}>
                        {m.result}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={textSecondary} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '700',
  },
  newMatchBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  newMatchBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ef4444',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activeTeams: {
    fontSize: 16,
    fontWeight: '700',
  },
  activeVenue: {
    fontSize: 12,
    marginTop: 2,
  },
  activeScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.15)',
  },
  battingTeamName: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  activeScoreValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  activeOversValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  recentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  recentCardLeft: {
    flex: 1,
    marginRight: 8,
  },
  recentTeams: {
    fontSize: 15,
    fontWeight: '700',
  },
  recentDate: {
    fontSize: 12,
    marginTop: 2,
  },
  recentResult: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});

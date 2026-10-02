import { ScorecardView } from '@/components/ScorecardView';
import { Colors } from '@/constants/colors';
import { calculateInnings } from '@/engine/scoringEngine';
import { useCricketStore } from '@/storage/cricketStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { matches, teams, setActiveMatch, settings } = useCricketStore();
  const isDark = settings.darkMode;

  const match = matches.find((m) => m.id === id);

  const bgScreen = isDark ? Colors.screenBgDark : Colors.screenBgLight;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimaryLight;
  const textSecondary = isDark ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDark ? Colors.darkBg : Colors.lightBorder;
  const accentCol = isDark ? Colors.accentDark : Colors.accent;

  if (!match) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: bgScreen }]}>
        <Ionicons name="alert-circle-outline" size={48} color={textSecondary} />
        <Text style={[styles.emptyText, { color: textPrimary }]}>Match not found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const team1 = teams.find((t) => t.id === match.team1Id) || {
    id: match.team1Id,
    name: 'Team 1',
    shortName: 'T1',
    players: [],
    createdAt: 0,
  };
  const team2 = teams.find((t) => t.id === match.team2Id) || {
    id: match.team2Id,
    name: 'Team 2',
    shortName: 'T2',
    players: [],
    createdAt: 0,
  };

  const isActive = match.status === 'innings1' || match.status === 'innings2' || match.status === 'innings_break';

  const handleShare = async () => {
    const calc1 = calculateInnings(
      match.innings1,
      team1.players,
      team2.players,
      match.overs,
      match.team1PlayingXI.length || 11
    );

    let message = `🏏 *Cricket Match Scorecard*\n${team1.name} vs ${team2.name}\nVenue: ${match.venue}\nDate: ${match.date}\n\n`;
    message += `1st Innings: ${calc1.totalRuns}/${calc1.totalWickets} (${calc1.oversFormatted} ov)\n`;
    if (match.result) {
      message += `Result: ${match.result}\n`;
    }
    message += `\nScored digitally with Offline Cricket Scorebook`;

    try {
      await Share.share({ message });
    } catch (e) {
      console.log('Share error', e);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: bgScreen }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderCol }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={1}>
            {team1.shortName || team1.name} vs {team2.shortName || team2.name}
          </Text>
          <Text style={[styles.headerSub, { color: textSecondary }]}>
            {match.format} • {match.venue}
          </Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-social-outline" size={20} color={textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Match Result / Status Bar */}
      {match.result && (
        <View style={[styles.resultBanner, { backgroundColor: isDark ? Colors.successBgDark : Colors.successBg, borderColor: Colors.successBorder }]}>
          <Ionicons name="trophy" size={16} color={Colors.successText} />
          <Text style={[styles.resultText, { color: isDark ? Colors.successTextDark : Colors.successText }]}>
            {match.result}
          </Text>
        </View>
      )}

      {/* If Active Match, Show "Resume Live Scoring" CTA */}
      {isActive && (
        <View style={styles.activePrompt}>
          <TouchableOpacity
            style={[styles.resumeBtn, { backgroundColor: accentCol }]}
            onPress={async () => {
              await setActiveMatch(match.id);
              router.push('/match/scoring');
            }}
          >
            <Ionicons name="play" size={16} color={Colors.white} />
            <Text style={styles.resumeBtnText}>Resume Live Scoring</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Full Scorecard Tables */}
      <ScorecardView match={match} team1={team1} team2={team2} isDarkMode={isDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  shareBtn: {
    padding: 6,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '700',
  },
  activePrompt: {
    padding: 12,
  },
  resumeBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  resumeBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
  },
  goBackBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  goBackText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

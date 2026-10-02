import { Colors } from '@/constants/colors';
import { calculateInnings } from '@/engine/scoringEngine';
import { useCricketStore } from '@/storage/cricketStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function MatchesScreen() {
  const router = useRouter();
  const { matches, teams, setActiveMatch, deleteMatch, settings } = useCricketStore();
  const isDark = settings.darkMode;

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const bgScreen = isDark ? Colors.screenBgDark : Colors.screenBgLight;
  const bgCard = isDark ? Colors.cardBgDark : Colors.white;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimaryLight;
  const textSecondary = isDark ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDark ? Colors.darkBg : Colors.lightBorder;
  const accentCol = isDark ? Colors.accentDark : Colors.accent;

  const getTeam = (id: string) => teams.find((t) => t.id === id);

  const filteredMatches = matches.filter((m) => {
    const t1 = getTeam(m.team1Id);
    const t2 = getTeam(m.team2Id);
    const searchTarget = `${t1?.name || ''} ${t2?.name || ''} ${m.venue || ''}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());

    const isActive = m.status === 'innings1' || m.status === 'innings2' || m.status === 'innings_break';
    if (filter === 'active') return matchesSearch && isActive;
    if (filter === 'completed') return matchesSearch && m.status === 'completed';
    return matchesSearch;
  });

  const handleDeletePrompt = (matchId: string) => {
    Alert.alert(
      'Delete Match',
      'Are you sure you want to permanently delete this match record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMatch(matchId);
          },
        },
      ]
    );
  };

  return (
    <>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderCol }]}>
        <Text style={[styles.title, { color: textPrimary }]}>Matches</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: accentCol }]}
          onPress={() => router.push('/match/new')}
        >
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: bgCard, borderColor: borderCol }]}>
          <Ionicons name="search" size={18} color={textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search teams or venue..."
            placeholderTextColor={textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'completed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  filter === tab ? accentCol : isDark ? Colors.darkBg : Colors.lightBg,
              },
            ]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filter === tab ? Colors.white : textSecondary },
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredMatches.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: bgCard, borderColor: borderCol }]}>
            <Ionicons name="document-text-outline" size={40} color={textSecondary} />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No matches found</Text>
            <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
              {matches.length === 0 ? 'Create your first match to get started.' : 'Try changing your search or filters.'}
            </Text>
          </View>
        ) : (
          filteredMatches.map((m) => {
            const team1 = getTeam(m.team1Id);
            const team2 = getTeam(m.team2Id);
            const isActive = m.status === 'innings1' || m.status === 'innings2' || m.status === 'innings_break';

            const activeInn = m.innings2 ? m.innings2 : m.innings1;
            const battingTeam = getTeam(activeInn.teamBattingId);
            const bowlingTeam = getTeam(activeInn.teamBowlingId);
            const calc = calculateInnings(
              activeInn,
              battingTeam?.players || [],
              bowlingTeam?.players || [],
              m.overs,
              m.team1PlayingXI.length || 11
            );

            return (
              <View
                key={m.id}
                style={[styles.matchCard, { backgroundColor: bgCard, borderColor: borderCol }]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardStatusRow}>
                    {isActive ? (
                      <View style={styles.liveTag}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveTagText}>IN PROGRESS</Text>
                      </View>
                    ) : (
                      <View style={[styles.doneTag, { backgroundColor: isDark ? Colors.darkBg : Colors.lightBg }]}>
                        <Text style={[styles.doneTagText, { color: textSecondary }]}>COMPLETED</Text>
                      </View>
                    )}
                    <Text style={[styles.cardDate, { color: textSecondary }]}>
                      {m.date || 'Date not specified'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeletePrompt(m.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.trash} />
                  </TouchableOpacity>
                </View>

                {/* Teams & Score */}
                <TouchableOpacity
                  onPress={async () => {
                    if (isActive) {
                      await setActiveMatch(m.id);
                      router.push('/match/scoring');
                    } else {
                      router.push(`/match/${m.id}`);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.matchTeamsTitle, { color: textPrimary }]}>
                    {team1?.name} vs {team2?.name}
                  </Text>
                  <Text style={[styles.matchVenue, { color: textSecondary }]}>
                    {m.venue || 'Ground not specified'} • {m.format} ({m.overs} ov)
                  </Text>

                  <View style={styles.scoreRow}>
                    <Text style={[styles.scoreValue, { color: textPrimary }]}>
                      {calc.totalRuns}/{calc.totalWickets}{' '}
                      <Text style={[styles.oversValue, { color: textSecondary }]}>
                        ({calc.oversFormatted} ov)
                      </Text>
                    </Text>
                  </View>

                  {m.result && (
                    <Text style={[styles.resultText, { color: isDark ? Colors.successTextDark : Colors.successText }]}>
                      {m.result}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Bottom Action Row */}
                <View style={[styles.cardFooter, { borderTopColor: borderCol }]}>
                  {isActive ? (
                    <TouchableOpacity
                      style={[styles.resumeBtn, { backgroundColor: accentCol }]}
                      onPress={async () => {
                        await setActiveMatch(m.id);
                        router.push('/match/scoring');
                      }}
                    >
                      <Ionicons name="play" size={14} color={Colors.white} />
                      <Text style={styles.resumeBtnText}>Resume Scoring</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.scorecardBtn, { borderColor: borderCol }]}
                      onPress={() => router.push(`/match/${m.id}`)}
                    >
                      <Ionicons name="newspaper-outline" size={14} color={textPrimary} />
                      <Text style={[styles.scorecardBtnText, { color: textPrimary }]}>
                        View Full Scorecard
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      </>
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
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
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
  matchCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.wicketNoticeBgLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.wicketRed,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.wicketRedText,
  },
  doneTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  doneTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDate: {
    fontSize: 12,
  },
  matchTeamsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  matchVenue: {
    fontSize: 12,
    marginTop: 2,
  },
  scoreRow: {
    marginTop: 6,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  oversValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resumeBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  scorecardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  scorecardBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

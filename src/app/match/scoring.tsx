import { useAppAlert } from '@/components/AppAlertProvider';
import { BatsmanBowlerCard } from '@/components/BatsmanBowlerCard';
import { BowlerSelectModal } from '@/components/BowlerSelectModal';
import { ExtrasModal } from '@/components/ExtrasModal';
import { MatchSummaryModal } from '@/components/MatchSummaryModal';
import { OverBallList } from '@/components/OverBallList';
import { ScorecardView } from '@/components/ScorecardView';
import { ScoreHeader } from '@/components/ScoreHeader';
import { ScoringPad } from '@/components/ScoringPad';
import { WicketModal } from '@/components/WicketModal';
import { Colors } from '@/constants/colors';
import { calculateInnings } from '@/engine/scoringEngine';
import { useCricketStore } from '@/storage/cricketStore';
import { ExtraType, ShotDirection, WicketDetails } from '@/types/cricket';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LiveScoringScreen() {
  const router = useRouter();
  const showAlert = useAppAlert();
  const {
    getActiveMatch,
    teams,
    recordDelivery,
    undoLastDelivery,
    swapStrike,
    setBowler,
    startSecondInnings,
    finishMatch,
    settings,
  } = useCricketStore();

  const isDark = settings.darkMode;
  const match = getActiveMatch();

  // Screen view toggle: 'live' or 'scorecard'
  const [activeTab, setActiveTab] = useState<'live' | 'scorecard'>('live');

  // Modals state
  const [wicketModalVisible, setWicketModalVisible] = useState(false);
  const [extrasModalVisible, setExtrasModalVisible] = useState(false);
  const [bowlerModalVisible, setBowlerModalVisible] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);

  // If no active match found, navigate back
  if (!match) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDark ? Colors.screenBgDark : Colors.screenBgLight }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.darkTextSecondary} />
        <Text style={[styles.emptyText, { color: isDark ? Colors.textPrimaryDark : Colors.textPrimaryLight }]}>
          No active match found
        </Text>
        <TouchableOpacity style={styles.goHomeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.goHomeText}>Go to Home</Text>
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

  const isInnings1 = match.status === 'innings1' || match.status === 'innings_break';
  const currentInnings = isInnings1 ? match.innings1 : match.innings2;

  if (!currentInnings) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDark ? Colors.screenBgDark : Colors.screenBgLight }]}>
        <Text style={{ color: isDark ? Colors.white : Colors.black }}>Preparing innings...</Text>
      </View>
    );
  }

  const battingTeam = currentInnings.teamBattingId === team1.id ? team1 : team2;
  const bowlingTeam = currentInnings.teamBowlingId === team1.id ? team1 : team2;

  // Calculate current innings
  const calc = calculateInnings(
    currentInnings,
    battingTeam.players,
    bowlingTeam.players,
    match.overs,
    match.team1PlayingXI.length || 11
  );

  // Find striker, non-striker, bowler player objects
  const striker = battingTeam.players.find((p) => p.id === currentInnings.currentStrikerId) || {
    id: currentInnings.currentStrikerId,
    name: 'Striker',
  };
  const nonStriker = battingTeam.players.find((p) => p.id === currentInnings.currentNonStrikerId) || {
    id: currentInnings.currentNonStrikerId,
    name: 'Non-Striker',
  };
  const bowler = bowlingTeam.players.find((p) => p.id === currentInnings.currentBowlerId) || {
    id: currentInnings.currentBowlerId,
    name: 'Bowler',
  };

  // Remaining batters for wicket modal
  const battedPlayerIds = new Set(calc.batters.map((b) => b.playerId));
  const availableBatters = battingTeam.players.filter(
    (p) => !battedPlayerIds.has(p.id) || p.id === currentInnings.currentStrikerId || p.id === currentInnings.currentNonStrikerId
  ).filter((p) => p.id !== currentInnings.currentStrikerId && p.id !== currentInnings.currentNonStrikerId);

  // Deliveries count for undo check
  const canUndo = currentInnings.deliveries.length > 0;

  // Find last bowler who bowled previous over
  const currentOverIndex = Math.floor(calc.totalLegalBalls / 6);
  const lastOverDeliveries = currentInnings.deliveries.filter((d) => d.overIndex === currentOverIndex - 1);
  const lastOverBowlerId = lastOverDeliveries.length > 0 ? lastOverDeliveries[0].bowlerId : undefined;

  // Handlers
  const handleScoreRuns = async (runs: number, shotDirection?: ShotDirection) => {
    const result = await recordDelivery({
      runsBat: runs,
      extraRuns: 0,
      shotDirection,
      isLegal: true,
    });

    if (result.matchEnded || result.inningsEnded) {
      setSummaryModalVisible(true);
    } else if (result.overCompleted) {
      setBowlerModalVisible(true);
    }
  };

  const handleQuickExtra = async (type: ExtraType) => {
    if (type === 'wide') {
      const result = await recordDelivery({
        runsBat: 0,
        extraRuns: 1,
        extraType: 'wide',
        isLegal: false,
      });
      if (result.matchEnded || result.inningsEnded) setSummaryModalVisible(true);
    } else if (type === 'no_ball') {
      const result = await recordDelivery({
        runsBat: 0,
        extraRuns: 1,
        extraType: 'no_ball',
        isLegal: false,
      });
      if (result.matchEnded || result.inningsEnded) setSummaryModalVisible(true);
    } else if (type === 'bye') {
      const result = await recordDelivery({
        runsBat: 0,
        extraRuns: 1,
        extraType: 'bye',
        isLegal: true,
      });
      if (result.matchEnded || result.inningsEnded) setSummaryModalVisible(true);
      else if (result.overCompleted) setBowlerModalVisible(true);
    } else if (type === 'leg_bye') {
      const result = await recordDelivery({
        runsBat: 0,
        extraRuns: 1,
        extraType: 'leg_bye',
        isLegal: true,
      });
      if (result.matchEnded || result.inningsEnded) setSummaryModalVisible(true);
      else if (result.overCompleted) setBowlerModalVisible(true);
    }
  };

  const handleCustomExtraConfirm = async (params: {
    extraType: ExtraType;
    extraRuns: number;
    runsBat: number;
    isLegal: boolean;
  }) => {
    const result = await recordDelivery({
      runsBat: params.runsBat,
      extraRuns: params.extraRuns,
      extraType: params.extraType,
      isLegal: params.isLegal,
    });
    if (result.matchEnded || result.inningsEnded) setSummaryModalVisible(true);
    else if (result.overCompleted) setBowlerModalVisible(true);
  };

  const handleConfirmWicket = async (params: {
    wicket: WicketDetails;
    newBatsmanId?: string;
    runsBat: number;
  }) => {
    setWicketModalVisible(false);
    const result = await recordDelivery({
      runsBat: params.runsBat,
      extraRuns: 0,
      isLegal: true,
      wicket: params.wicket,
      newBatsmanId: params.newBatsmanId,
    });

    if (result.matchEnded || result.inningsEnded) {
      setSummaryModalVisible(true);
    } else if (result.overCompleted) {
      setBowlerModalVisible(true);
    }
  };

  const handleEndMatchPrompt = () => {
    showAlert(
      'Finish Match',
      'Are you sure you want to end this match early?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Match',
          style: 'destructive',
          onPress: async () => {
            await finishMatch(match.id, 'Match ended manually');
            setSummaryModalVisible(true);
          },
        },
      ]
    );
  };

  const handleSummaryClose = () => {
    setSummaryModalVisible(false);

    if (match.status === 'completed') {
      router.replace(`/match/${match.id}`);
    }
  };

  const bgScreen = isDark ? Colors.screenBgDark : Colors.screenBgLight;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimaryLight;
  const textSecondary = isDark ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDark ? Colors.darkBg : Colors.lightBorder;
  const accentCol = isDark ? Colors.accentDark : Colors.accent;

  return (
    <ScrollView>
    <View style={[styles.safeArea, { backgroundColor: bgScreen }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: borderCol }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.topBarBtn}>
          <Ionicons name="home-outline" size={22} color={textPrimary} />
        </TouchableOpacity>

        {/* View Switcher: Live Scoring vs Scorecard */}
        <View style={[styles.switchContainer, { backgroundColor: isDark ? Colors.darkBg : Colors.lightBg }]}>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              activeTab === 'live' && {
                backgroundColor: isDark ? Colors.darkBgDark : Colors.white,
                shadowColor: Colors.black,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('live')}
          >
            <Text
              style={[
                styles.switchText,
                {
                  color: activeTab === 'live' ? accentCol : textSecondary,
                  fontWeight: activeTab === 'live' ? '700' : '500',
                },
              ]}
            >
              Scoring
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchBtn,
              activeTab === 'scorecard' && {
                backgroundColor: isDark ? Colors.darkBgDark : Colors.white,
                shadowColor: Colors.black,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('scorecard')}
          >
            <Text
              style={[
                styles.switchText,
                {
                  color: activeTab === 'scorecard' ? accentCol : textSecondary,
                  fontWeight: activeTab === 'scorecard' ? '700' : '500',
                },
              ]}
            >
              Scorecard
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleEndMatchPrompt} style={styles.topBarBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {activeTab === 'scorecard' ? (
        <ScorecardView match={match} team1={team1} team2={team2} isDarkMode={isDark} />
      ) : (
        <View style={styles.scoringLayout}>
          {/* Top Score Banner */}
          <ScoreHeader
            match={match}
            calc={calc}
            battingTeamName={battingTeam.name}
            isDarkMode={isDark}
          />

          {/* Active Batsmen and Bowler Figures */}
          <BatsmanBowlerCard
            calc={calc}
            strikerId={currentInnings.currentStrikerId}
            nonStrikerId={currentInnings.currentNonStrikerId}
            bowlerId={currentInnings.currentBowlerId}
            onSwapStrike={swapStrike}
            onChangeBowler={() => setBowlerModalVisible(true)}
            isDarkMode={isDark}
          />

          {/* Current Over Pills */}
          <OverBallList
            currentOverDeliveries={calc.currentOverDeliveries}
            currentOverNumber={currentOverIndex}
            isDarkMode={isDark}
          />

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Fast Touch Scoring Pad */}
          <ScoringPad
            onScoreRuns={handleScoreRuns}
            onQuickExtra={handleQuickExtra}
            onOpenCustomExtras={() => setExtrasModalVisible(true)}
            onOpenWicketDialog={() => setWicketModalVisible(true)}
            onUndo={undoLastDelivery}
            canUndo={canUndo}
            isDarkMode={isDark}
          />
        </View>
      )}

      {/* Integrated Dialogs */}
      <WicketModal
        visible={wicketModalVisible}
        onClose={() => setWicketModalVisible(false)}
        striker={striker}
        nonStriker={nonStriker}
        currentBowler={bowler}
        bowlingTeamPlayers={bowlingTeam.players}
        availableBatters={availableBatters}
        onConfirmWicket={handleConfirmWicket}
        isDarkMode={isDark}
      />

      <ExtrasModal
        visible={extrasModalVisible}
        onClose={() => setExtrasModalVisible(false)}
        onConfirmExtra={handleCustomExtraConfirm}
        isDarkMode={isDark}
      />

      <BowlerSelectModal
        visible={bowlerModalVisible}
        onClose={() => setBowlerModalVisible(false)}
        title="Select Next Bowler"
        bowlingPlayers={bowlingTeam.players}
        bowlerScorecards={calc.bowlers}
        lastOverBowlerId={lastOverBowlerId}
        onSelectBowler={setBowler}
        isDarkMode={isDark}
      />

      <MatchSummaryModal
        visible={summaryModalVisible || match.status === 'innings_break' || match.status === 'completed'}
        match={match}
        team1={team1}
        team2={team2}
        onClose={handleSummaryClose}
        onStartSecondInnings={startSecondInnings}
        onFinishMatch={() => finishMatch(match.id)}
        isDarkMode={isDark}
      />
    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  topBarBtn: {
    padding: 6,
  },
  switchContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  switchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchText: {
    fontSize: 13,
  },
  scoringLayout: {
    flex: 1,
    justifyContent: 'space-between',
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
  goHomeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  goHomeText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

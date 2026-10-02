import { Colors } from '@/constants/colors';
import { useCricketStore } from '@/storage/cricketStore';
import { MatchFormat, TossDecision } from '@/types/cricket';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NewMatchScreen() {
  const router = useRouter();
  const { teams, createMatch, setActiveMatch, settings } = useCricketStore();
  const isDark = settings.darkMode;

  const bgScreen = isDark ? Colors.screenBgDark : Colors.screenBgLight;
  const bgCard = isDark ? Colors.cardBgDark : Colors.white;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimaryLight;
  const textSecondary = isDark ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDark ? Colors.darkBg : Colors.lightBorder;
  const accentCol = isDark ? Colors.accentDark : Colors.accent;

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form states
  const [team1Id, setTeam1Id] = useState<string>(teams[0]?.id || '');
  const [team2Id, setTeam2Id] = useState<string>(teams[1]?.id || '');
  const [format, setFormat] = useState<MatchFormat>(settings.defaultFormat || 'T20');
  const [overs, setOvers] = useState<string>(
    format === 'T10' ? '10' : format === 'T20' ? '20' : format === 'ODI' ? '50' : '20'
  );
  const [venue, setVenue] = useState<string>('Local Cricket Ground');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tossWinnerId, setTossWinnerId] = useState<string>(teams[0]?.id || '');
  const [tossDecision, setTossDecision] = useState<TossDecision>('bat');

  // Openers and Bowler states for Step 5
  const team1 = teams.find((t) => t.id === team1Id);
  const team2 = teams.find((t) => t.id === team2Id);

  const battingFirstTeam =
    (tossWinnerId === team1Id && tossDecision === 'bat') ||
    (tossWinnerId === team2Id && tossDecision === 'bowl')
      ? team1
      : team2;

  const bowlingFirstTeam = battingFirstTeam?.id === team1?.id ? team2 : team1;

  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [bowlerId, setBowlerId] = useState<string>('');

  // Update default openers and bowler when reaching step 5
  React.useEffect(() => {
    if (battingFirstTeam && battingFirstTeam.players.length >= 2) {
      if (!strikerId) setStrikerId(battingFirstTeam.players[0].id);
      if (!nonStrikerId) setNonStrikerId(battingFirstTeam.players[1].id);
    }
    if (bowlingFirstTeam && bowlingFirstTeam.players.length >= 1) {
      if (!bowlerId) setBowlerId(bowlingFirstTeam.players[0].id);
    }
  }, [step, battingFirstTeam, bowlingFirstTeam]);

  const handleNext = () => {
    if (step === 1) {
      if (!team1Id || !team2Id) {
        Alert.alert('Selection Required', 'Please select both Team 1 and Team 2');
        return;
      }
      if (team1Id === team2Id) {
        Alert.alert('Invalid Selection', 'Team 1 and Team 2 cannot be the same');
        return;
      }
      setTossWinnerId(team1Id);
      setStep(2);
    } else if (step === 2) {
      const numOvers = parseInt(overs, 10);
      if (isNaN(numOvers) || numOvers <= 0) {
        Alert.alert('Invalid Overs', 'Please enter a valid number of overs (e.g. 20)');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      handleStartMatch();
    }
  };

  const handleStartMatch = async () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      Alert.alert('Required Selection', 'Please select both opening batters and the opening bowler');
      return;
    }
    if (strikerId === nonStrikerId) {
      Alert.alert('Invalid Batters', 'Striker and Non-striker must be different players');
      return;
    }

    const t1Players = team1?.players.map((p) => p.id) || [];
    const t2Players = team2?.players.map((p) => p.id) || [];

    const newMatch = await createMatch({
      team1Id,
      team2Id,
      team1PlayingXI: t1Players,
      team2PlayingXI: t2Players,
      format,
      overs: parseInt(overs, 10) || 20,
      venue: venue.trim() || 'Local Ground',
      date: date.trim() || new Date().toISOString().split('T')[0],
      tossWinnerId,
      tossDecision,
      strikerId,
      nonStrikerId,
      bowlerId,
    });

    await setActiveMatch(newMatch.id);
    router.replace('/match/scoring');
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: bgScreen }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: borderCol }]}>
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep((step - 1) as any) : router.back())}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Create Match</Text>
          <Text style={[styles.headerStep, { color: accentCol }]}>Step {step} of 5</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Teams */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepHeading, { color: textPrimary }]}>Select Teams</Text>
            <Text style={[styles.stepDesc, { color: textSecondary }]}>
              Pick Team 1 and Team 2 from your saved teams
            </Text>

            <Text style={[styles.fieldLabel, { color: textSecondary, marginTop: 16 }]}>TEAM 1 (HOME)</Text>
            <View style={styles.teamList}>
              {teams.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.teamSelectCard,
                    {
                      backgroundColor: team1Id === t.id ? (isDark ? Colors.successBgDark : Colors.lightHighlight) : bgCard,
                      borderColor: team1Id === t.id ? accentCol : borderCol,
                    },
                  ]}
                  onPress={() => setTeam1Id(t.id)}
                >
                  <View style={styles.teamBadgeCircle}>
                    <Text style={styles.teamBadgeText}>{t.shortName?.slice(0, 2) || 'TM'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.teamSelectName, { color: textPrimary }]}>{t.name}</Text>
                    <Text style={[styles.teamPlayersCount, { color: textSecondary }]}>
                      {t.players.length} players
                    </Text>
                  </View>
                  {team1Id === t.id && (
                    <Ionicons name="checkmark-circle" size={20} color={accentCol} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: textSecondary, marginTop: 20 }]}>
              TEAM 2 (AWAY)
            </Text>
            <View style={styles.teamList}>
              {teams.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.teamSelectCard,
                    {
                      backgroundColor: team2Id === t.id ? (isDark ? Colors.successBgDark : Colors.lightHighlight) : bgCard,
                      borderColor: team2Id === t.id ? accentCol : borderCol,
                    },
                  ]}
                  onPress={() => setTeam2Id(t.id)}
                >
                  <View style={styles.teamBadgeCircle}>
                    <Text style={styles.teamBadgeText}>{t.shortName?.slice(0, 2) || 'TM'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.teamSelectName, { color: textPrimary }]}>{t.name}</Text>
                    <Text style={[styles.teamPlayersCount, { color: textSecondary }]}>
                      {t.players.length} players
                    </Text>
                  </View>
                  {team2Id === t.id && (
                    <Ionicons name="checkmark-circle" size={20} color={accentCol} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Format & Overs */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepHeading, { color: textPrimary }]}>Match Format</Text>
            <Text style={[styles.stepDesc, { color: textSecondary }]}>
              Choose standard or custom match overs
            </Text>

            <View style={styles.formatGrid}>
              {[
                { type: 'T10', defaultOvers: '10', desc: '10 Overs' },
                { type: 'T20', defaultOvers: '20', desc: '20 Overs' },
                { type: 'ODI', defaultOvers: '50', desc: '50 Overs' },
                { type: 'Custom', defaultOvers: '15', desc: 'Custom Overs' },
              ].map((fmt) => {
                const isSelected = format === fmt.type;
                return (
                  <TouchableOpacity
                    key={fmt.type}
                    style={[
                      styles.formatCard,
                      {
                        backgroundColor: isSelected ? (isDark ? Colors.successBgDark : Colors.lightHighlight) : bgCard,
                        borderColor: isSelected ? accentCol : borderCol,
                      },
                    ]}
                    onPress={() => {
                      setFormat(fmt.type as MatchFormat);
                      setOvers(fmt.defaultOvers);
                    }}
                  >
                    <Text
                      style={[
                        styles.formatTitle,
                        { color: isSelected ? (isDark ? Colors.white : Colors.accentHighlight) : textPrimary },
                      ]}
                    >
                      {fmt.type}
                    </Text>
                    <Text style={[styles.formatDesc, { color: textSecondary }]}>{fmt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: textSecondary, marginTop: 24 }]}>
              TOTAL OVERS PER INNINGS
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: bgCard, borderColor: borderCol, color: textPrimary }]}
              value={overs}
              onChangeText={setOvers}
              keyboardType="number-pad"
              placeholder="e.g. 20"
              placeholderTextColor={textSecondary}
            />
          </View>
        )}

        {/* Step 3: Venue & Date */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepHeading, { color: textPrimary }]}>Match Information</Text>
            <Text style={[styles.stepDesc, { color: textSecondary }]}>
              Add ground venue and date
            </Text>

            <Text style={[styles.fieldLabel, { color: textSecondary, marginTop: 20 }]}>VENUE</Text>
            <TextInput
              style={[styles.input, { backgroundColor: bgCard, borderColor: borderCol, color: textPrimary }]}
              value={venue}
              onChangeText={setVenue}
              placeholder="e.g. Gandhi Maidan, Patna"
              placeholderTextColor={textSecondary}
            />

            <Text style={[styles.fieldLabel, { color: textSecondary, marginTop: 16 }]}>DATE</Text>
            <TextInput
              style={[styles.input, { backgroundColor: bgCard, borderColor: borderCol, color: textPrimary }]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={textSecondary}
            />
          </View>
        )}

        {/* Step 4: Toss */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepHeading, { color: textPrimary }]}>Toss</Text>
            <Text style={[styles.stepDesc, { color: textSecondary }]}>
              Who won the toss and what did they elect to do?
            </Text>

            <Text style={[styles.fieldLabel, { color: textSecondary, marginTop: 20 }]}>
              TOSS WINNER
            </Text>
            <View style={styles.tossOptions}>
              {[team1, team2].map((t) => {
                if (!t) return null;
                const isSelected = tossWinnerId === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.tossBtn,
                      {
                        backgroundColor: isSelected ? accentCol : bgCard,
                        borderColor: isSelected ? accentCol : borderCol,
                      },
                    ]}
                    onPress={() => setTossWinnerId(t.id)}
                  >
                    <Text
                      style={[
                        styles.tossBtnText,
                        { color: isSelected ? Colors.white : textPrimary },
                      ]}
                    >
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: textSecondary, marginTop: 20 }]}>
              ELECTED TO
            </Text>
            <View style={styles.tossOptions}>
              {(['bat', 'bowl'] as TossDecision[]).map((dec) => {
                const isSelected = tossDecision === dec;
                return (
                  <TouchableOpacity
                    key={dec}
                    style={[
                      styles.tossBtn,
                      {
                        backgroundColor: isSelected ? accentCol : bgCard,
                        borderColor: isSelected ? accentCol : borderCol,
                      },
                    ]}
                    onPress={() => setTossDecision(dec)}
                  >
                    <Text
                      style={[
                        styles.tossBtnText,
                        { color: isSelected ? Colors.white : textPrimary },
                      ]}
                    >
                      {dec === 'bat' ? 'Bat First' : 'Bowl First'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.tossSummary, { backgroundColor: isDark ? Colors.darkBg : Colors.lightBg }]}>
              <Ionicons name="information-circle" size={18} color={accentCol} />
              <Text style={[styles.tossSummaryText, { color: textPrimary }]}>
                {battingFirstTeam?.name} will bat first.
              </Text>
            </View>
          </View>
        )}

        {/* Step 5: Openers & Opening Bowler */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepHeading, { color: textPrimary }]}>Openers & Bowler</Text>
            <Text style={[styles.stepDesc, { color: textSecondary }]}>
              Select starting batters for {battingFirstTeam?.name} and bowler for {bowlingFirstTeam?.name}
            </Text>

            {/* Striker */}
            <Text style={[styles.fieldLabel, { color: textSecondary, marginTop: 16 }]}>
              STRIKER ({battingFirstTeam?.name})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
              {battingFirstTeam?.players.map((p) => {
                const isSelected = strikerId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? accentCol : bgCard,
                        borderColor: isSelected ? accentCol : borderCol,
                      },
                    ]}
                    onPress={() => setStrikerId(p.id)}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? Colors.white : textPrimary }]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Non-Striker */}
            <Text style={[styles.fieldLabel, { color: textSecondary, marginTop: 16 }]}>
              NON-STRIKER ({battingFirstTeam?.name})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
              {battingFirstTeam?.players
                .filter((p) => p.id !== strikerId)
                .map((p) => {
                  const isSelected = nonStrikerId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? accentCol : bgCard,
                          borderColor: isSelected ? accentCol : borderCol,
                        },
                      ]}
                      onPress={() => setNonStrikerId(p.id)}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? Colors.white : textPrimary }]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            {/* Opening Bowler */}
            <Text style={[styles.fieldLabel, { color: textSecondary, marginTop: 16 }]}>
              OPENING BOWLER ({bowlingFirstTeam?.name})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
              {bowlingFirstTeam?.players.map((p) => {
                const isSelected = bowlerId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? accentCol : bgCard,
                        borderColor: isSelected ? accentCol : borderCol,
                      },
                    ]}
                    onPress={() => setBowlerId(p.id)}
                  >
                      <Text style={[styles.chipText, { color: isSelected ? Colors.white : textPrimary }]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Button */}
      <View style={[styles.footer, { backgroundColor: bgCard, borderTopColor: borderCol }]}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: accentCol }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>
            {step === 5 ? 'Start Match' : 'Continue'}
          </Text>
          <Ionicons
            name={step === 5 ? 'play' : 'arrow-forward'}
            size={18}
            color={Colors.white}
          />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitles: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerStep: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 22,
    fontWeight: '800',
  },
  stepDesc: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  teamList: {
    gap: 8,
  },
  teamSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  teamBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  teamSelectName: {
    fontSize: 15,
    fontWeight: '700',
  },
  teamPlayersCount: {
    fontSize: 12,
    marginTop: 1,
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  formatCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  formatTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  formatDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  tossOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  tossBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tossBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tossSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  tossSummaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalChips: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  continueButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});

import { Colors } from '@/constants/colors';
import { useCricketStore } from '@/storage/cricketStore';
import { MatchFormat } from '@/types/cricket';
import { Ionicons } from '@expo/vector-icons';
import {
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
export default function SettingsScreen() {
  const { settings, updateSettings, resetAllData, matches, teams } = useCricketStore();
  const isDark = settings.darkMode;

  const bgScreen = isDark ? Colors.screenBgDark : Colors.screenBgLight;
  const bgCard = isDark ? Colors.cardBgDark : Colors.white;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimaryLight;
  const textSecondary = isDark ? Colors.darkTextSecondary : Colors.neutral;
  const borderCol = isDark ? Colors.darkBg : Colors.lightBorder;
  const accentCol = isDark ? Colors.accentDark : Colors.accent;

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will reset teams and matches back to default sample data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Sample Data',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            Alert.alert('Reset Complete', 'Sample matches and teams have been reloaded.');
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    const backupPayload = JSON.stringify({ matches, teams, settings }, null, 2);
    try {
      await Share.share({
        title: 'cricketbook_backup.json',
        message: backupPayload,
      });
    } catch (e) {
      console.log('Export error', e);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: bgScreen }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderCol }]}>
        <Text style={[styles.title, { color: textPrimary }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <Text style={[styles.sectionHeading, { color: textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: bgCard, borderColor: borderCol }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="moon-outline" size={20} color={accentCol} />
              <View>
                <Text style={[styles.rowLabel, { color: textPrimary }]}>Dark Mode</Text>
                <Text style={[styles.rowSub, { color: textSecondary }]}>
                  High contrast dark theme for evening scoring
                </Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(val) => updateSettings({ darkMode: val })}
              trackColor={{ false: Colors.lightBorderSoft, true: accentCol }}
            />
          </View>
        </View>

        {/* Scoring Preferences Section */}
        <Text style={[styles.sectionHeading, { color: textSecondary, marginTop: 20 }]}>
          SCORING PREFERENCES
        </Text>
        <View style={[styles.card, { backgroundColor: bgCard, borderColor: borderCol }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="timer-outline" size={20} color={accentCol} />
              <View>
                <Text style={[styles.rowLabel, { color: textPrimary }]}>Default Match Format</Text>
                <Text style={[styles.rowSub, { color: textSecondary }]}>
                  Preset format for new matches
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.formatsRow}>
            {(['T10', 'T20', 'ODI', 'Custom'] as MatchFormat[]).map((fmt) => {
              const isSelected = settings.defaultFormat === fmt;
              return (
                <TouchableOpacity
                  key={fmt}
                  style={[
                    styles.fmtBtn,
                    {
                      backgroundColor: isSelected ? accentCol : isDark ? Colors.darkBg : Colors.lightBg,
                      borderColor: isSelected ? accentCol : borderCol,
                    },
                  ]}
                  onPress={() => updateSettings({ defaultFormat: fmt })}
                >
                  <Text
                    style={[
                      styles.fmtBtnText,
                      { color: isSelected ? Colors.white : textPrimary },
                    ]}
                  >
                    {fmt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.divider, { backgroundColor: borderCol }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color={accentCol} />
              <View>
                <Text style={[styles.rowLabel, { color: textPrimary }]}>Sound & Vibration</Text>
                <Text style={[styles.rowSub, { color: textSecondary }]}>
                  Haptic feedback on boundary and wicket
                </Text>
              </View>
            </View>
            <Switch
              value={settings.soundVibration}
              onValueChange={(val) => updateSettings({ soundVibration: val })}
              trackColor={{ false: Colors.lightBorderSoft, true: accentCol }}
            />
          </View>
        </View>

        {/* Data & Backup Section */}
        <Text style={[styles.sectionHeading, { color: textSecondary, marginTop: 20 }]}>
          DATA & BACKUP (OFFLINE)
        </Text>
        <View style={[styles.card, { backgroundColor: bgCard, borderColor: borderCol }]}>
          <TouchableOpacity style={styles.row} onPress={handleExportData}>
            <View style={styles.rowLeft}>
              <Ionicons name="download-outline" size={20} color={accentCol} />
              <View>
                <Text style={[styles.rowLabel, { color: textPrimary }]}>Export Match Data</Text>
                <Text style={[styles.rowSub, { color: textSecondary }]}>
                  Save backup of matches and teams
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: borderCol }]} />

          <TouchableOpacity style={styles.row} onPress={handleResetData}>
            <View style={styles.rowLeft}>
              <Ionicons name="refresh-outline" size={20} color={Colors.trash} />
              <View>
                <Text style={[styles.rowLabel, { color: Colors.trash }]}>Reset to Sample Data</Text>
                <Text style={[styles.rowSub, { color: textSecondary }]}>
                  Reload sample teams and active match
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About App */}
        <Text style={[styles.sectionHeading, { color: textSecondary, marginTop: 20 }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: bgCard, borderColor: borderCol }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.appName, { color: textPrimary }]}>Cricket Scorebook</Text>
            <Text style={[styles.appVersion, { color: textSecondary }]}>v1.0.0 (Offline-First)</Text>
          </View>
          <Text style={[styles.aboutText, { color: textSecondary }]}>
            Engineered according to the Digital Cricket Scorebook specification. Fully functional offline with delivery-level data integrity, automatic calculations, and fast touch scoring.
          </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 1,
  },
  formatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 6,
  },
  fmtBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  fmtBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

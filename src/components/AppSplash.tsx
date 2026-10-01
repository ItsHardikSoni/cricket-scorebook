import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MINT = '#C8F2D6';
const MINT_SOFT = '#A9DDBB';

type AppSplashProps = {
  isStoreReady: boolean;
  onFinished: () => void;
};

export function AppSplash({ isStoreReady, onFinished }: AppSplashProps) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    const listener = progress.addListener(({ value }) => {
      setPercent(Math.round(value));
    });

    Animated.timing(progress, {
      toValue: 100,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      progress.removeListener(listener);
    };
  }, [progress]);

  useEffect(() => {
    if (!isStoreReady || percent < 100 || finishedRef.current) {
      return;
    }

    finishedRef.current = true;
    const timeout = setTimeout(onFinished, 450);
    return () => clearTimeout(timeout);
  }, [isStoreReady, percent, onFinished]);

  const barWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#23935C', '#1B7A4E', '#157046', '#0F5538']}
        locations={[0, 0.32, 0.68, 1]}
        style={StyleSheet.absoluteFill}
      />
      <RadarBackdrop />

      <View
        style={[
          styles.content,
          { paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Ionicons name="flash" size={13} color={Colors.primary} />
            <Text style={styles.badgeText}>100% OFFLINE ENGINE</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="cellular" size={13} color={Colors.primary} />
            <Text style={styles.badgeText}>No Signal Needed</Text>
          </View>
        </View>

        <View style={styles.centerBlock}>
          <View style={styles.iconCard}>
            <View style={styles.iconWell}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.iconImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <Text style={styles.kicker}>PRECISION MATCH LEDGER</Text>
          <Text style={styles.title}>CRICKET SCOREBOOK</Text>
          <Text style={styles.subtitle}>Paper Simplicity. Digital Precision.</Text>

          <View style={styles.chipRow}>
            <FeatureChip icon="shield-checkmark-outline" label="Instant Recovery" />
            <FeatureChip icon="hand-left-outline" label="1-Tap Scoring" />
          </View>
          <View style={styles.chipRowSingle}>
            <FeatureChip icon="server-outline" label="Local Storage" />
          </View>
        </View>

        <View>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {percent < 100 ? 'Initializing' : 'Loading... • Ready'}
                </Text>
              </View>
              <Text style={styles.percentText}>{percent}%</Text>
            </View>
            <View style={styles.track}>
              <Animated.View style={[styles.fill, { width: barWidth }]} />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>v1.0.0 • Cricket Scorebook</Text>
            <Text style={styles.footerText}>Ready for Cricket</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function FeatureChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color={Colors.primary} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function RadarBackdrop() {
  const { width, height } = Dimensions.get('window');
  const centerY = height * 0.4;
  const sizes = [160, 260, 380, 520, 680, 860];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.glow,
          {
            top: centerY - 210,
            left: width / 2 - 210,
          },
        ]}
      />
      <View style={[styles.axis, { left: width / 2, height }]} />
      <View style={[styles.axisH, { top: centerY, width }]} />
      {sizes.map((size) => (
        <View
          key={size}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(200, 242, 214, 0.14)',
            top: centerY - size / 2,
            left: width / 2 - size / 2,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#167A4C',
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  glow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(90, 190, 120, 0.18)',
  },
  axis: {
    position: 'absolute',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(200, 242, 214, 0.08)',
    top: 0,
  },
  axisH: {
    position: 'absolute',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(200, 242, 214, 0.08)',
    left: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(8, 58, 38, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(200, 242, 214, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  badgeText: {
    color: MINT,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  centerBlock: {
    alignItems: 'center',
  },
  iconCard: {
    width: 176,
    height: 176,
    borderRadius: 44,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#042015',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 16,
    marginBottom: 28,
  },
  iconWell: {
    width: 118,
    height: 118,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 132,
    height: 132,
  },
  kicker: {
    color: MINT_SOFT,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 8,
  },
  title: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: MINT_SOFT,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 22,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  chipRowSingle: {
    marginTop: 10,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(8, 55, 38, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(200, 242, 214, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    color: MINT,
    fontSize: 13,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: 'rgba(8, 48, 34, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(200, 242, 214, 0.14)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8EE6A8',
  },
  statusText: {
    color: MINT,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  percentText: {
    color: MINT,
    fontSize: 16,
    fontWeight: '700',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(200, 242, 214, 0.18)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#B6F0C9',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  footerText: {
    color: MINT_SOFT,
    fontSize: 12,
    fontWeight: '600',
  },
});

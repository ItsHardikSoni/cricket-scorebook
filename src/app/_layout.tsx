import { AppSplash } from '@/components/AppSplash';
import { Colors } from '@/constants/colors';
import { useCricketStore } from '@/storage/cricketStore';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initStore, settings, isInitialized } = useCricketStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initStore();
  }, []);

  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return <AppSplash isStoreReady={isInitialized} onFinished={handleSplashFinished} />;
  }

  const isDark = settings.darkMode;

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <SafeAreaView style={{ backgroundColor: Colors.primary }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <SafeAreaView
          style={{ flex: 1, backgroundColor: isDark ? Colors.secondary : Colors.white }}
          edges={['left', 'right', 'bottom']}
        >
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right'}}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="match/scoring" options={{ headerShown: false, gestureEnabled: false}}/>
            <Stack.Screen name="match/new" options={{ headerShown: false, presentation: 'modal'}}/>
            <Stack.Screen name="match/[id]" options={{ headerShown: false}}/>
            <Stack.Screen name="team/new" options={{ headerShown: false, presentation: 'modal'}}/>
            <Stack.Screen name="team/[id]" options={{ headerShown: false}}/>
          </Stack>
        </SafeAreaView>
      </SafeAreaView>
    </ThemeProvider>
  );
}

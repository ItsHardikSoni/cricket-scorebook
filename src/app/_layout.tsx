import React, { useCallback, useEffect, useState } from 'react';
import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCricketStore } from '@/storage/cricketStore';
import { AppSplash } from '@/components/AppSplash';
import { Colors } from '@/constants/colors';

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
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? Colors.secondary : Colors.white }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right'}}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="match/scoring" options={{ headerShown: false, gestureEnabled: false}}/>
        <Stack.Screen name="match/new" options={{ headerShown: false, presentation: 'modal'}}/>
        <Stack.Screen name="match/[id]" options={{ headerShown: false}}/>
        <Stack.Screen name="team/new" options={{ headerShown: false, presentation: 'modal'}}/>
        <Stack.Screen name="team/[id]" options={{ headerShown: false}}/>
      </Stack>
      </SafeAreaView>
    </ThemeProvider>
  );
}

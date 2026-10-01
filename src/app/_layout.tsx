import React, { useEffect } from 'react';
import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCricketStore } from '@/storage/cricketStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const { initStore, settings, isInitialized } = useCricketStore();

  useEffect(() => {
    initStore();
  }, []);

  const isDark = settings.darkMode;

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#090d16' : '#ffffff' }} edges={['top', 'left', 'right', 'bottom']}>
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

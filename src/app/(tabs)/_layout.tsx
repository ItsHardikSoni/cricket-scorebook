import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCricketStore } from '@/storage/cricketStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { settings } = useCricketStore();
  const isDark = settings.darkMode;
  const insets = useSafeAreaInsets();
  const bgTab = isDark ? '#0f172a' : '#ffffff';
  const borderCol = isDark ? '#1e293b' : '#e2e8f0';
  const activeCol = isDark ? '#38bdf8' : '#0284c7';
  const inactiveCol = isDark ? '#64748b' : '#94a3b8';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bgTab,
          borderTopColor: borderCol,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: activeCol,
        tabBarInactiveTintColor: inactiveCol,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size || 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

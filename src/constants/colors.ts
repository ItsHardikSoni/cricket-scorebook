const primary = '#047857';
const secondary = '#0F172A';
const neutral = '#64748B';

export const Colors = {
  primary,
  secondary,
  neutral,
  white: '#FFFFFF',
  black: '#000000',
  // Mint theme colors (splash screen)
  mint: '#C8F2D6',
  mintSoft: '#A9DDBB',
  // Gradient colors
  gradientStart: '#23935C',
  gradientMid1: '#1B7A4E',
  gradientMid2: '#157046',
  gradientEnd: '#0F5538',
  // Dark mode colors
  darkBg: '#1e293b',
  darkBgDark: secondary,
  darkTextPrimary: '#f8fafc',
  darkTextSecondary: '#94a3b8',
  darkBorder: '#334155',
  // Light mode accents
  lightBg: '#f1f5f9',
  lightBgSoft: '#f8fafc',
  lightBorder: '#e2e8f0',
  lightBorderSoft: '#cbd5e1',
  lightHighlight: '#d1fae5',
  // Accent colors
  accent: primary,
  accentDark: '#34d399',
  accentHighlight: primary,
  // Ball delivery colors
  wicketBg: '#ef4444',
  wicketBorder: '#dc2626',
  wicketRed: '#dc2626',
  boundaryGreen: '#6ee7b7',
  boundaryAccent: '#064e3b',
  boundaryAccentLight: '#ecfdf5',
  wicketShadow: '#dc2626',
  wicketRedText: '#dc2626',
  wicketNoticeBg: '#451a1a',
  wicketNoticeBgLight: '#fef2f2',
  trophy: '#eab308',
  // Screen backgrounds
  screenBgDark: '#090d16',
  screenBgLight: '#f8fafc',
  cardBgDark: '#131b2e',
  textPrimaryDark: '#f8fafc',
  textPrimaryLight: '#0f172a',
  trash: '#ef4444',
  boundaryBg: '#22c55e',
  boundaryBgDark: '#15803d',
  boundaryBorder: '#16a34a',
  extraBg: '#f59e0b',
  extraBgDark: '#b45309',
  extraBorder: '#d97706',
  byeBg: '#94a3b8',
  byeBgDark: '#475569',
  byeBorder: neutral,
  // Status colors
  successBg: '#ecfdf5',
  successBgDark: '#064e3b',
  successText: '#059669',
  successTextDark: '#34d399',
  successBorder: '#10b981',
  // Additional colors
  star: primary,
  shadow: '#042015',
  shadowDark: '#000000',
  statusDot: '#8EE6A8',
  progressFill: '#B6F0C9',
  // RGBA helpers
  glow: 'rgba(90, 190, 120, 0.18)',
  radarLine: 'rgba(200, 242, 214, 0.08)',
  radarCircle: 'rgba(200, 242, 214, 0.14)',
  badgeBg: 'rgba(8, 58, 38, 0.38)',
  badgeBorder: 'rgba(200, 242, 214, 0.18)',
  chipBg: 'rgba(8, 55, 38, 0.42)',
  chipBorder: 'rgba(200, 242, 214, 0.2)',
  statusCardBg: 'rgba(8, 48, 34, 0.42)',
  statusCardBorder: 'rgba(200, 242, 214, 0.14)',
  trackBg: 'rgba(200, 242, 214, 0.18)',
  backdrop: 'rgba(0,0,0,0.6)',
} as const;

export type AppColor = (typeof Colors)[keyof typeof Colors];

export const Colors = {
  primary: '#047857',
  secondary: '#0F172A',
  neutral: '#64748B',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type AppColor = (typeof Colors)[keyof typeof Colors];

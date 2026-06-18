import { Platform, ViewStyle } from 'react-native';

export const colors = {
  background: '#F4F4F4',
  backgroundAlt: '#FAFAFA',
  card: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#8A8A8A',
  accent: '#000000',
  accentText: '#FFFFFF',
  track: '#EDEDED',
  trackAlt: '#E2E2E2',
  border: '#EFEFEF',
  skipped: '#C9C9C9',
  overlay: 'rgba(26, 26, 26, 0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  display: 44,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const shadows: Record<'soft' | 'card' | 'floating', ViewStyle> = {
  soft: Platform.select({
    ios: {
      shadowColor: '#1A1A1A',
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  card: Platform.select({
    ios: {
      shadowColor: '#1A1A1A',
      shadowOpacity: 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,
  floating: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.25,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
    },
    android: { elevation: 12 },
    default: {},
  }) as ViewStyle,
};

export const theme = {
  colors,
  spacing,
  radii,
  fontSize,
  fontWeight,
  shadows,
};

export type Theme = typeof theme;

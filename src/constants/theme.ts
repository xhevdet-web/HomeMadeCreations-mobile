import { Platform } from 'react-native';

// Navy and apricot palette. Navy carries structure and primary actions; apricot/copper
// is the warm accent in both modes. Status colors stay distinct so errors never look
// like success. Light text colors meet WCAG AA (4.5:1) on `surface` and `background`.
export type ThemeMode = 'dark' | 'light';

export const darkTheme = {
  mode: 'dark' as ThemeMode,
  colors: {
    background: '#171B2B', surface: '#20253A', elevated: '#2D3250', border: '#424769',
    text: '#FFFFFF', muted: '#B8BDD5', accent: '#F9B17A', gold: '#F9B17A',
    soft: '#2D3250', success: '#7BC8A4', danger: '#F28B82',
    primary: '#F9B17A', onPrimary: '#2D3250', navigation: '#1B2032',
    preview: '#242A40', thumbnail: '#2D3250',
    bottomBar: '#20253A', badge: '#2D3250E6', successSurface: '#22343A',
    overlayCard: '#20253AEF', overlayBorder: '#FFFFFF33',
  },
  gradients: {
    product: ['#424769', '#20253A'] as readonly [string, string],
    pearl: ['#424769', '#2D3250'] as readonly [string, string],
    details: ['#424769', '#20253A'] as readonly [string, string],
    welcome: ['#171B2BE6', '#171B2B99', '#171B2BF5'] as readonly [string, string, string],
    // Studio stage: centre and edge of a soft, linen-like jewelry tray.
    stage: ['#2A3048', '#161A29'] as readonly [string, string],
  },
  fonts: {
    editorial: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'Georgia, serif',
    }),
  },
  radius: { small: 12, medium: 20, large: 28 },
};
export type Theme = typeof darkTheme;

export const lightTheme: Theme = {
  ...darkTheme,
  mode: 'light',
  colors: {
    background: '#FAF7F2', surface: '#FFFFFF', elevated: '#F1ECE4', border: '#E8E1D6',
    text: '#2D3250', muted: '#676F9D', accent: '#A65B2A', gold: '#A65B2A',
    soft: '#F5EFE7', success: '#3F7D5C', danger: '#A94646',
    primary: '#424769', onPrimary: '#FFFFFF', navigation: '#FFFFFF',
    preview: '#F8F4EE', thumbnail: '#F5F0E8',
    bottomBar: '#FFFFFF', badge: '#FFFFFFE6', successSurface: '#EDF5F0',
    overlayCard: '#FFFFFFEF', overlayBorder: '#FFFFFFD9',
  },
  gradients: {
    product: ['#F5F0E8', '#FFFFFF'],
    pearl: ['#F5F0E8', '#FFFFFF'],
    details: ['#F5F0E8', '#FFFFFF'],
    welcome: ['#FAF7F2CC', '#FAF7F266', '#FAF7F2F5'],
    stage: ['#FBF8F3', '#EBE1D2'],
  },
};
export const themes: Record<ThemeMode, Theme> = { dark: darkTheme, light: lightTheme };
export const DELIVERY_PRICE = 200;

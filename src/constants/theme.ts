import { Platform } from 'react-native';

// Shared navy and apricot palette from the supplied light and dark reference.
export type ThemeMode = 'dark' | 'light';

export const darkTheme = {
  mode: 'dark' as ThemeMode,
  colors: {
    background: '#171B2B', surface: '#20253A', elevated: '#2D3250', border: '#424769',
    text: '#FFFFFF', muted: '#B8BDD5', accent: '#F9B17A', gold: '#F9B17A',
    soft: '#2D3250', success: '#F9B17A', danger: '#F9B17A',
    primary: '#F9B17A', onPrimary: '#2D3250', navigation: '#1B2032',
    canvas: '#20253A', preview: '#242A40', thumbnail: '#2D3250',
    bottomBar: '#20253A', badge: '#2D3250E6', heroBorder: '#424769',
    heroRing: '#676F9D40', heroRingSoft: '#676F9D26', heroText: '#FFFFFF',
    heroNote: '#B8BDD5', studioBorder: '#424769', successSurface: '#2D3250',
    statusSurface: '#2D3250', avatar: '#424769',
    confirmationSurface: '#F9B17A', confirmationBorder: '#F9B17A',
  },
  gradients: {
    hero: ['#424769', '#2D3250', '#171B2B'] as readonly [string, string, string],
    studio: ['#424769', '#2D3250'] as readonly [string, string],
    product: ['#424769', '#20253A'] as readonly [string, string],
    pearl: ['#424769', '#2D3250'] as readonly [string, string],
    details: ['#424769', '#20253A'] as readonly [string, string],
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
    background: '#FFFFFF', surface: '#FFFFFF', elevated: '#F4F5FA', border: '#E2E5F0',
    text: '#2D3250', muted: '#676F9D', accent: '#424769', gold: '#C7773F',
    soft: '#F0F1FA', success: '#424769', danger: '#A94646',
    primary: '#424769', onPrimary: '#FFFFFF', navigation: '#FFFFFF',
    canvas: '#F4F5FA', preview: '#F7F7FB', thumbnail: '#F4F5FA',
    bottomBar: '#FFFFFF', badge: '#FFFFFFE6', heroBorder: '#E2E5F0',
    heroRing: '#676F9D29', heroRingSoft: '#676F9D1A', heroText: '#424769',
    heroNote: '#676F9D', studioBorder: '#E2E5F0', successSurface: '#F0F1FA',
    statusSurface: '#F0F1FA', avatar: '#F0F1FA',
    confirmationSurface: '#F9B17A', confirmationBorder: '#F9B17A',
  },
  gradients: {
    hero: ['#F0F1FA', '#FAF8F8', '#FFFFFF'],
    studio: ['#F0F1FA', '#FFFFFF'],
    product: ['#F4F5FA', '#FFFFFF'],
    pearl: ['#F4F5FA', '#FFFFFF'],
    details: ['#F4F5FA', '#FFFFFF'],
  },
};
export const themes: Record<ThemeMode, Theme> = { dark: darkTheme, light: lightTheme };
export const DELIVERY_PRICE = 200;

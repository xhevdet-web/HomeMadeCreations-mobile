import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { lightTheme } from '@/constants/theme';

/** "light": navy and copper on light backgrounds. "dark": cream and apricot on navy. */
export type LogoTone = 'light' | 'dark';

const TONES: Record<LogoTone, { body: string; accent: string; tagline: string }> = {
  light: { body: lightTheme.colors.text, accent: lightTheme.colors.accent, tagline: lightTheme.colors.muted },
  dark: { body: '#F7F4EE', accent: '#E9975F', tagline: '#B8BDD5' },
};

/**
 * The house mark: a rounded roof, two walls, the stitched threshold of handmade work and
 * a spark of creativity. Drawn as vectors, so it is sharp at every size and in both tones.
 */
export function LogoMark({ size, tone }: { size: number; tone: LogoTone }) {
  const { body, accent } = TONES[tone];
  return (
    <Svg width={size * (180 / 175)} height={size} viewBox="0 0 180 175" accessible={false}>
      <Rect x={27} y={60} width={27} height={115} fill={body} />
      <Rect x={122} y={60} width={27} height={115} fill={body} />
      <Path d="M14 78 L88 16 L162 78" fill="none" stroke={accent} strokeWidth={22} strokeLinecap="round"
        strokeLinejoin="round" />
      {[59, 75, 91, 107].map((x) => <Rect key={x} x={x} y={103} width={10} height={10} fill={accent} />)}
      <Path d="M146 2 C148 15 152 19 165 21 C152 23 148 27 146 40 C144 27 140 23 127 21 C140 19 144 15 146 2 Z"
        fill={accent} />
    </Svg>
  );
}

/**
 * HomeCreator: the mark beside the wordmark ("Home" upright, "Creator" in italic), with the
 * tagline underneath when asked for. The tone follows the app theme unless the background
 * is fixed, like the navy home header.
 */
export function Logo({ tone, markSize = 48, textSize = 28, tagline = false }: {
  tone?: LogoTone;
  markSize?: number;
  textSize?: number;
  tagline?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colors = TONES[tone ?? (theme.mode === 'dark' ? 'dark' : 'light')];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="HomeCreator"
      style={{ flexDirection: 'row', alignItems: 'center', gap: markSize * 0.28, flexShrink: 1 }}>
      <LogoMark size={markSize} tone={tone ?? (theme.mode === 'dark' ? 'dark' : 'light')} />
      <View style={{ flexShrink: 1 }}>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
          style={{ fontFamily: theme.fonts.editorial, fontSize: textSize, color: colors.body }}>
          Home<Text style={{ fontStyle: 'italic', color: colors.accent }}>Creator</Text>
        </Text>
        {tagline && (
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
            style={{ fontSize: Math.max(textSize * 0.3, 9), letterSpacing: textSize * 0.08, fontWeight: '600',
              color: colors.tagline, marginTop: 2 }}>
            {t('common.brandTagline').toUpperCase()}
          </Text>
        )}
      </View>
    </View>
  );
}

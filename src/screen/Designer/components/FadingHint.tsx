import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Icon, type IconName, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';

const VISIBLE_MS = 6000;
const FADE_MS = 400;

/**
 * A short studio tip shown like an alert: it fades in when its text changes and fades away
 * after a few seconds, so it never takes room from the beads for long.
 */
export function FadingHint({ text, icon }: { text: string; icon: IconName }) {
  const ui = useUI();
  const theme = useTheme();
  // The text whose fade-out finished; a new text shows again.
  const [hidden, setHidden] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true })
        .start(({ finished }) => { if (finished) setHidden(text); });
    }, VISIBLE_MS);
    return () => {
      clearTimeout(timer);
      opacity.stopAnimation();
    };
  }, [text, opacity]);
  if (hidden === text) return null;
  return (
    <Animated.View accessibilityRole="alert" accessibilityLiveRegion="polite"
      style={[styles.hint, { opacity, backgroundColor: theme.colors.soft, borderColor: theme.colors.border }]}>
      <Icon name={icon} size={16} color={theme.colors.accent} />
      <Text style={[ui.caption, { flex: 1 }]}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1,
  },
});

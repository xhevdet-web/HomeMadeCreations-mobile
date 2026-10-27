import { ReactNode, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand, Icon, IconName, Page, useUI } from '@/components/common/ui';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useOnboardingStore } from '@/store/onboardingStore';

export function AuthLayout({ title, subtitle, tagline, highlights, switchPrompt,
  switchAction, onSwitch, children }: {
  title: string;
  subtitle: string;
  /** Short promise shown over the hero photo. */
  tagline: string;
  /** Small benefit chips under the title. */
  highlights?: { icon: IconName; label: string }[];
  switchPrompt: string;
  switchAction: string;
  onSwitch: () => void;
  children: ReactNode;
}) {
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  useEffect(() => {
    // Reaching login or registration means the welcome screen has been seen.
    useOnboardingStore.getState().complete();
  }, []);
  return (
    <Page style={{ padding: 0, gap: 0, maxWidth: 560 }}>
      {/* A plain, soft header: the logo carries the screen, no photo behind it. */}
      <View style={styles.hero}>
        {/* No back button: the link under the form switches between login and register. */}
        <View style={styles.heroBar}>
          <View style={styles.heroActions}>
            <LanguageToggle />
            <ThemeToggleButton />
          </View>
        </View>
        {/* Login and register say their own line under the logo. */}
        <View style={styles.heroBrand} pointerEvents="none">
          <Brand tagline={false} />
          <Text style={styles.tagline}>{tagline}</Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={{ gap: 6 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={ui.body}>{subtitle}</Text>
        </View>
        {!!highlights?.length && (
          <View style={styles.highlights}>
            {highlights.map((item) => (
              <View key={item.label} style={styles.chip}>
                <Icon name={item.icon} size={13} color={theme.colors.accent} />
                <Text style={styles.chipText}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
        {children}
        <View style={styles.divider} />
        <Pressable accessibilityRole="button" accessibilityLabel={switchPrompt + switchAction}
          onPress={onSwitch} style={({ pressed }) => [styles.switch, { opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[ui.body, { textAlign: 'center' }]}>
            {switchPrompt}
            <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>{switchAction}</Text>
          </Text>
        </Pressable>
      </View>
    </Page>
  );
}

export function FormSection({ title, icon, hint, children }: {
  title: string;
  icon: IconName;
  hint?: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionIcon}>
          <Icon name={icon} size={15} color={theme.colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {!!hint && <Text style={styles.sectionHint}>{hint}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    hero: { height: 230, justifyContent: 'space-between', overflow: 'hidden', backgroundColor: c.soft },
    heroActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    heroBar: {
      flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
      paddingHorizontal: 22, paddingTop: 12, zIndex: 2,
    },
    heroBrand: { alignItems: 'center', gap: 8, paddingBottom: 48 },
    tagline: {
      color: c.text, fontFamily: theme.fonts.editorial, fontSize: 16, fontStyle: 'italic',
      textAlign: 'center',
    },
    sheet: {
      marginTop: -28,
      paddingHorizontal: 22, paddingTop: 26, paddingBottom: 12, gap: 20,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      backgroundColor: c.background,
    },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 32, lineHeight: 38 },
    highlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: c.soft,
    },
    chipText: { color: c.text, fontSize: 11, fontWeight: '500' },
    divider: { height: 1, backgroundColor: c.border },
    switch: { minHeight: 44, justifyContent: 'center' },
    section: {
      gap: 14, padding: 16, borderRadius: 18,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionIcon: {
      width: 30, height: 30, borderRadius: 10, backgroundColor: c.soft,
      alignItems: 'center', justifyContent: 'center',
    },
    sectionTitle: { color: c.text, fontSize: 14, fontWeight: '600' },
    sectionHint: { color: c.muted, fontSize: 11, marginTop: 1 },
  });
};

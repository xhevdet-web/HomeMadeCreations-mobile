import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, useUI } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

/** Compact heading shared by every Home section: eyebrow, serif title, optional action. */
export function SectionHeader({ eyebrow, title, subtitle, action, onAction, right }: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  /** Replaces the text action, e.g. a "Surprise me" pill. */
  right?: ReactNode;
}) {
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 4 }}>
      <View style={ui.between}>
        <View style={{ flex: 1 }}>
          <Text style={[ui.eyebrow, { marginBottom: 4 }]}>{eyebrow}</Text>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
        </View>
        {right ?? (action && onAction ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`${action}: ${title}`} onPress={onAction}
            hitSlop={10} style={styles.action}>
            <Text style={ui.textLink}>{action}</Text>
            <Icon name="arrow-forward" size={13} color={theme.colors.accent} />
          </Pressable>
        ) : null)}
      </View>
      {!!subtitle && <Text style={ui.caption}>{subtitle}</Text>}
    </View>
  );
}

/** A quiet "couldn't load" row with a retry; never shows raw API errors on Home. */
export function SectionRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.retry} accessibilityRole="alert">
      <Icon name="cloud-offline-outline" size={18} color={theme.colors.muted} />
      <Text style={styles.retryText}>{message}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t('home.retryLabel', { message })} onPress={onRetry}
        hitSlop={8}>
        <Text style={[styles.retryText, { color: theme.colors.accent, fontWeight: '600' }]}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 22 },
    action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    retry: {
      flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16,
      borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, backgroundColor: c.surface,
    },
    retryText: { flexShrink: 1, color: c.muted, fontSize: 13 },
  });
};

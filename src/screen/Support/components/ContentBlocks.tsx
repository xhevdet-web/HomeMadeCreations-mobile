import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import type { ContentBlock } from '../content/types';

/** Paragraphs, lists and "to be confirmed" notes of FAQ answers and legal sections. */
export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 10 }}>
      {blocks.map((block, index) => {
        if (typeof block === 'string')
          return <Text key={index} style={styles.text}>{block}</Text>;
        if ('pending' in block)
          return (
            <View key={index} style={styles.pending} accessibilityLabel={t('support.legal.toBeConfirmedLabel', { text: block.pending })}>
              <Icon name="time-outline" size={16} color={theme.colors.accent} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.pendingLabel}>{t('support.legal.toBeConfirmed')}</Text>
                <Text style={styles.pendingText}>{block.pending}</Text>
              </View>
            </View>
          );
        return (
          <View key={index} style={{ gap: 6 }}>
            {block.list.map((entry, position) => (
              <View key={position} style={styles.listRow}>
                <Text style={[styles.marker, block.ordered && styles.number]}>
                  {block.ordered ? `${position + 1}.` : '•'}
                </Text>
                <Text style={[styles.text, { flex: 1 }]}>{entry}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    text: { color: c.muted, fontSize: 15, lineHeight: 24 },
    listRow: { flexDirection: 'row', gap: 8 },
    marker: { color: c.accent, fontSize: 15, lineHeight: 24, minWidth: 12 },
    number: { minWidth: 20, fontWeight: '600' },
    pending: {
      flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12,
      borderWidth: 1, borderColor: c.border, borderStyle: 'dashed', backgroundColor: c.soft,
    },
    pendingLabel: { color: c.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
    pendingText: { color: c.text, fontSize: 13, lineHeight: 20 },
  });
};

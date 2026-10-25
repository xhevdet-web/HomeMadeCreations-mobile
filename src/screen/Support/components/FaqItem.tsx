import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import type { FaqItem as FaqItemModel } from '../content/types';
import { ContentBlocks } from './ContentBlocks';

/** One accordion row: the question, and its answer when open. */
export function FaqItem({ item, open, last, onToggle }: {
  item: FaqItemModel;
  open: boolean;
  last: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={!last && styles.divider}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.question}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={onToggle}
        style={({ pressed }) => [styles.question, pressed && { backgroundColor: theme.colors.soft }]}
      >
        <Text style={[styles.questionText, open && { color: theme.colors.accent }]}>{item.question}</Text>
        <View style={[styles.toggle, open && { backgroundColor: theme.colors.accent }]}>
          <Icon name={open ? 'remove' : 'add'} size={16} color={open ? theme.colors.onPrimary : theme.colors.accent} />
        </View>
      </Pressable>
      {open && (
        // A plain View: a Reanimated entering animation here could leave the native screen stuck.
        <View style={styles.answer}>
          <ContentBlocks blocks={item.answer} />
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    divider: { borderBottomWidth: 1, borderBottomColor: c.border },
    question: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      minHeight: 56, paddingHorizontal: 16, paddingVertical: 14,
    },
    questionText: { flex: 1, color: c.text, fontSize: 15, fontWeight: '500', lineHeight: 21 },
    toggle: {
      width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.soft,
    },
    answer: { paddingHorizontal: 16, paddingBottom: 16 },
  });
};

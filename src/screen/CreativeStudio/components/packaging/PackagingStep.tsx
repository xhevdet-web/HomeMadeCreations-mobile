import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Icon } from '@/components/common/ui';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

/**
 * One step of the packaging choice. Open, it shows its options; answered, it folds into a
 * single line with the answer and "Change", so the screen only ever asks one thing at a time.
 */
export function PackagingStep({ number, title, answer, open, onChange, children }: {
  number: number;
  title: string;
  /** The chosen answer, shown when the step is folded. */
  answer: string | null;
  open: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const done = !open && !!answer;
  return (
    <View style={[styles.step, open && styles.stepOpen]}>
      <Pressable accessibilityRole="button" disabled={!done} onPress={onChange}
        accessibilityLabel={done ? `${title}: ${answer}. ${t('giftStudio.packaging.changeLabel', { step: title })}` : title}
        style={styles.head}>
        <View style={[styles.number, done && styles.numberDone]}>
          {done
            ? <Icon name="checkmark" size={14} color={styles.numberDoneText.color} />
            : <Text style={styles.numberText}>{number}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={done ? styles.titleDone : styles.title}>{title}</Text>
          {done && <Text style={styles.answer} numberOfLines={1}>{answer}</Text>}
        </View>
        {done && <Text style={styles.change}>{t('giftStudio.packaging.change')}</Text>}
      </Pressable>
      {open && (
        <Animated.View entering={FadeIn.duration(180)} style={styles.body}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

/**
 * A choice in a step: a small picture, name, a short line and price, as a radio row.
 * Unavailable choices stay listed but disabled, with the reason.
 */
export function PackagingOption({ picture, title, subtitle, price, status, selected, disabled = false, onPress }: {
  picture: ReactNode;
  title: string;
  subtitle?: string | null;
  price?: string | null;
  status?: string | null;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected, disabled }}
      accessibilityLabel={[title, subtitle, price, status].filter(Boolean).join(', ')}
      disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.option, selected && styles.optionSelected,
        { opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }]}>
      <View style={styles.picture}>{picture}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.optionTitle} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={styles.optionSubtitle} numberOfLines={2}>{subtitle}</Text>}
        {!!status && <Text style={styles.status}>{status}</Text>}
      </View>
      {!!price && <Text style={styles.price}>{price}</Text>}
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    step: { borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, overflow: 'hidden' },
    stepOpen: { borderColor: c.accent },
    head: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 14, paddingVertical: 10 },
    number: {
      width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: c.accent,
    },
    numberDone: { backgroundColor: c.accent },
    numberText: { color: c.accent, fontSize: 13, fontWeight: '700' },
    numberDoneText: { color: c.onPrimary },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 18 },
    titleDone: { color: c.muted, fontSize: 12, fontWeight: '600' },
    answer: { color: c.text, fontSize: 15, fontWeight: '600' },
    change: { color: c.accent, fontSize: 13, fontWeight: '700' },
    body: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
    option: {
      flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, padding: 10,
      borderRadius: 14, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.background,
    },
    optionSelected: { borderColor: c.accent, backgroundColor: c.soft },
    picture: {
      width: 48, height: 48, borderRadius: 12, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    optionTitle: { color: c.text, fontSize: 15, fontWeight: '600' },
    optionSubtitle: { color: c.muted, fontSize: 12 },
    status: { color: c.danger, fontSize: 11, fontWeight: '600' },
    price: { color: c.text, fontSize: 14, fontWeight: '700' },
    radio: {
      width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center',
    },
    radioSelected: { borderColor: c.accent },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
  });
};

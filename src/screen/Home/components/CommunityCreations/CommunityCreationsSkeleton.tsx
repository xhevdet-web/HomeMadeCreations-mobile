import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

const CHIP_WIDTHS = [84, 64, 96, 72];

/** Placeholder card the same size as a creation card, so nothing jumps when they load. */
export function CreationCardSkeleton({ width }: { width: number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.card, { width }]}>
      <View style={[styles.block, { height: width, borderRadius: 0 }]} />
      <View style={styles.body}>
        <View style={[styles.block, styles.line, { width: '75%' }]} />
        <View style={[styles.block, styles.line, { width: '55%', height: 8 }]} />
      </View>
    </View>
  );
}

/** A row of cards only, e.g. while another category's creations load. */
export function CreationRowSkeleton({ cardWidth }: { cardWidth: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, overflow: 'hidden' }}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[0, 1, 2].map((index) => <CreationCardSkeleton key={index} width={cardWidth} />)}
    </View>
  );
}

/** The whole section's first load: filter pills and cards. */
export function CommunityCreationsSkeleton({ cardWidth }: { cardWidth: number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 14 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ flexDirection: 'row', gap: 8, overflow: 'hidden' }}>
        {CHIP_WIDTHS.map((width) => <View key={width} style={[styles.block, styles.chip, { width }]} />)}
      </View>
      <CreationRowSkeleton cardWidth={cardWidth} />
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      borderRadius: 20, overflow: 'hidden',
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    body: { padding: 12, gap: 8 },
    block: { backgroundColor: c.elevated, borderRadius: 6 },
    line: { height: 11 },
    chip: { height: 34, borderRadius: 999 },
  });
};

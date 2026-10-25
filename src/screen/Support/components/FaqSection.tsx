import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import type { FaqSection as FaqSectionModel } from '../content/types';
import { FaqItem } from './FaqItem';

/** A titled group of questions, styled like the profile's settings groups. */
export function FaqSection({ section, openIds, onToggle }: {
  section: FaqSectionModel;
  openIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.title} accessibilityRole="header">{section.title}</Text>
      <View style={styles.group}>
        {section.items.map((item, index) => (
          <FaqItem
            key={item.id}
            item={item}
            open={openIds.has(item.id)}
            last={index === section.items.length - 1}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    title: {
      color: c.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1.2,
      textTransform: 'uppercase', paddingHorizontal: 4,
    },
    group: {
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      borderRadius: 16, overflow: 'hidden',
    },
  });
};

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import type { CatalogCategory } from '@/api/catalogModels';
import { builderOf, categoriesFor, CREATE_LABELS, OCCASIONS } from '../homeContent';
import { SectionHeader } from './SectionHeader';

/**
 * "Create for an occasion": for customers who know why, not what. Picking an occasion
 * suggests the categories that suit it; a suggestion opens that category.
 */
export function OccasionSection({ categories, onOpen }: {
  categories: CatalogCategory[];
  onOpen: (category: CatalogCategory) => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  // Only occasions with something to make right now.
  const occasions = OCCASIONS
    .map((occasion) => ({ ...occasion, suggestions: categoriesFor(categories, occasion.builders) }))
    .filter((occasion) => occasion.suggestions.length);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = occasions.find((occasion) => occasion.id === selectedId) ?? null;
  if (!occasions.length) return null;

  return (
    <View style={{ gap: 14 }}>
      <SectionHeader eyebrow="CREATE FOR AN OCCASION" title="Make something meaningful" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {occasions.map((occasion) => {
          const active = occasion.id === selectedId;
          return (
            <Pressable key={occasion.id} accessibilityRole="button" accessibilityState={{ selected: active }}
              accessibilityLabel={`${occasion.title}: ${occasion.line}`}
              onPress={() => setSelectedId(active ? null : occasion.id)}
              style={({ pressed }) => [styles.occasion, active && styles.occasionActive, { opacity: pressed ? 0.8 : 1 }]}>
              <View style={[styles.occasionIcon, active && { backgroundColor: theme.colors.accent }]}>
                <Icon name={occasion.icon} size={18} color={active ? theme.colors.onPrimary : theme.colors.accent} />
              </View>
              <Text style={styles.occasionTitle} numberOfLines={1}>{occasion.title}</Text>
              <Text style={styles.occasionLine} numberOfLines={2}>{occasion.line}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {selected && (
        <View style={styles.suggestions} accessibilityLiveRegion="polite">
          <Text style={styles.suggestionsTitle}>Ideas for {selected.title.toLowerCase()}</Text>
          {selected.suggestions.map((category) => (
            <Pressable key={category.id} accessibilityRole="button"
              accessibilityLabel={`${category.name} for ${selected.title}`} onPress={() => onOpen(category)}
              style={({ pressed }) => [styles.suggestion, { opacity: pressed ? 0.75 : 1 }]}>
              <View style={styles.suggestionImage}>
                <CatalogImage imageUrl={category.imageUrl} name={category.name} size={40} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionName} numberOfLines={1}>{category.name}</Text>
                <Text style={styles.occasionLine} numberOfLines={1}>{CREATE_LABELS[builderOf(category)]}</Text>
              </View>
              <Icon name="chevron-forward" size={16} color={theme.colors.muted} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    occasion: {
      width: 132, padding: 12, gap: 6, borderRadius: 18,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    occasionActive: { borderColor: c.accent, backgroundColor: c.soft },
    occasionIcon: {
      width: 34, height: 34, borderRadius: 17, backgroundColor: c.soft,
      alignItems: 'center', justifyContent: 'center',
    },
    occasionTitle: { color: c.text, fontSize: 13, fontWeight: '600' },
    occasionLine: { color: c.muted, fontSize: 11, lineHeight: 15 },
    suggestions: {
      gap: 4, padding: 8, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    suggestionsTitle: { color: c.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1, padding: 6 },
    suggestion: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 6, borderRadius: 12 },
    suggestionImage: {
      width: 44, height: 44, borderRadius: 12, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    suggestionName: { color: c.text, fontSize: 14, fontWeight: '600' },
  });
};

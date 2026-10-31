import { memo } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import type { CommunityGalleryCategory } from '@/api/commerceModels';

/** One pill per category that has creations; scrolls sideways however many there are. */
export const CategoryFilter = memo(function CategoryFilter({ categories, selectedId, onSelect }: {
  categories: CommunityGalleryCategory[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <FlatList
      horizontal
      data={categories}
      extraData={selectedId}
      keyExtractor={(category) => category.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
      accessibilityLabel={t('home.communityFilters')}
      renderItem={({ item }) => {
        const selected = item.id === selectedId;
        return (
          <Pressable accessibilityRole="tab" accessibilityState={{ selected }}
            accessibilityLabel={t('home.communityFilterLabel', { category: item.name })}
            onPress={() => onSelect(item.id)} hitSlop={4}
            style={({ pressed }) => [styles.chip, selected && styles.selected,
              { opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <Text style={[styles.text, selected && styles.selectedText]} numberOfLines={1}>{item.name}</Text>
          </Pressable>
        );
      }}
    />
  );
});

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    row: { gap: 8 },
    chip: {
      paddingHorizontal: 15, paddingVertical: 8, borderRadius: 999,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    selected: { borderColor: c.primary, backgroundColor: c.primary },
    text: { color: c.text, fontSize: 13, fontWeight: '500' },
    selectedText: { color: c.onPrimary, fontWeight: '700' },
  });
};

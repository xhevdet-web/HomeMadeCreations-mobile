import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { CatalogCategory } from '@/api/catalogModels';

export function CategoryRail({ categories, onOpen, onSeeAll }: {
  categories: CatalogCategory[];
  onOpen: (category: CatalogCategory) => void;
  onSeeAll: () => void;
}) {
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 14 }}>
      <View style={ui.between}>
        <View style={{ flex: 1 }}>
          <Text style={ui.eyebrow}>DESIGN YOUR OWN</Text>
          <Text style={styles.heading}>Start with a category</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="See all categories"
          onPress={onSeeAll} hitSlop={10}>
          <Text style={ui.textLink}>See all</Text>
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(category) => category.id}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item: category }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Start with ${category.name}`}
            onPress={() => onOpen(category)}
            style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.75 : 1 }]}
          >
            <View style={styles.image}>
              <CatalogImage imageUrl={category.imageUrl} name={category.name} size={84} />
            </View>
            <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
            <Text style={ui.caption} numberOfLines={1}>
              {category.sizes?.length
                ? `${category.sizes.length} ${category.sizes.length === 1 ? 'size' : 'sizes'}`
                : 'One size'}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    heading: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 24 },
    tile: {
      width: 124,
      padding: 10,
      gap: 4,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    image: {
      height: 96,
      borderRadius: 14,
      backgroundColor: c.thumbnail,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginBottom: 6,
    },
    name: { color: c.text, fontSize: 13, fontWeight: '600' },
  });
};

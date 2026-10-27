import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { CatalogCategory } from '@/api/catalogModels';
import { builderOf } from '../homeContent';
import { SectionHeader, SectionRetry } from './SectionHeader';

/** "Start creating": every active category, as an invitation to make one. */
export function CategoryRail({ categories, loading, error, onRetry, onOpen, onSeeAll }: {
  categories: CatalogCategory[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onOpen: (category: CatalogCategory) => void;
  onSeeAll: () => void;
}) {
  const ui = useUI();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  if (!loading && !error && !categories.length) return null;
  return (
    <View style={{ gap: 14 }}>
      <SectionHeader eyebrow={t('home.startEyebrow')} title={t('home.startTitle')}
        action={t('common.seeAll')} onAction={onSeeAll} />
      {error ? <SectionRetry message={t('home.loadCategoriesFailed')} onRetry={onRetry} /> : loading ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[0, 1, 2].map((index) => <View key={index} style={[styles.tile, styles.skeleton]} />)}
        </View>
      ) : (
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(category) => category.id}
          // Items translate inline: redraw them when the language changes.
          extraData={t}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item: category }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${category.name}: ${t(`home.createLabels.${builderOf(category)}`)}`}
              onPress={() => onOpen(category)}
              style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.image}>
                <CatalogImage imageUrl={category.imageUrl} name={category.name} size={84} />
              </View>
              <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
              <Text style={[ui.caption, styles.action]} numberOfLines={1}>{t(`home.createLabels.${builderOf(category)}`)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    tile: {
      width: 124, minHeight: 150, padding: 10, gap: 4, borderRadius: 18,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    image: {
      height: 96, borderRadius: 14, backgroundColor: c.thumbnail, marginBottom: 6,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    name: { color: c.text, fontSize: 13, fontWeight: '600' },
    action: { color: c.accent },
    skeleton: { backgroundColor: c.elevated, borderColor: c.elevated },
  });
};

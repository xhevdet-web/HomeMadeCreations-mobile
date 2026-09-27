import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { CatalogCategory } from '@/services/catalogApi';
import { CatalogImage } from './CatalogImage';
import { useCatalogStore } from '@/store/catalogStore';
import { useDesignStore } from '@/store/designStore';

export function CategoryCard({ category }: { category: CatalogCategory }) {
  const theme = useTheme();
  const ui = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Browse ${category.name}`}
      onPress={() => {
        const productId = useCatalogStore.getState().registerCategory(category);
        useDesignStore.getState().start(productId);
        router.push({
          pathname: '/designer',
          params: { categoryId: category.id, category: category.name },
        });
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <CatalogImage imageUrl={category.imageUrl} name={category.name} />
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={ui.sectionTitle}>{category.name}</Text>
        {!!category.description && <Text style={ui.caption}>{category.description}</Text>}
      </View>
      <Icon name="chevron-forward" size={18} />
    </Pressable>
  );
}

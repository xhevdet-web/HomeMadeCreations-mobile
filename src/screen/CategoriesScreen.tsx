import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Header, Page, useUI } from '@/components/common/ui';
import { categories, CategoryCard } from '@/components/products/CategoryCard';
import { useTheme } from '@/hooks/useTheme';
import { useDesignStore } from '@/store/designStore';
import { products, sampleItems } from '@/services/catalog';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';

export default function CategoriesScreen() {
  const ui = useUI();
  const theme = useTheme();
  return <Page style={{ gap: 14 }}>
    <Header title="Create Your Idea" back />
    <Text style={[ui.body, { marginBottom: 6 }]}>Choose a piece to start your creation.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {categories.slice(0, 2).map((category) => {
        const product = products.find((entry) => entry.type === category.type)!;
        return <Pressable key={category.name} accessibilityRole="button" accessibilityLabel={`Select ${category.name}`}
          onPress={() => { useDesignStore.getState().start(product.id); router.push('/designer'); }}
          style={({ pressed }) => ({ width: '48%', minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: 8,
            borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
            opacity: pressed ? 0.7 : 1 })}>
          <JewelryCanvas items={sampleItems(product, 12)} type={product.type} size={120} decorative />
          <Text style={ui.label}>{category.name}</Text>
        </Pressable>;
      })}
    </View>
    <Text style={ui.sectionTitle}>Explore materials</Text>
    {categories.slice(2).map((category) => <CategoryCard key={category.name} category={category} />)}
  </Page>;
}

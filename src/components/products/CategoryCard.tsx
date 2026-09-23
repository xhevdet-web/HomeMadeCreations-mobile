import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon, useUI } from '@/components/common/ui';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { DesignItem } from '@/components/designer/DesignItem';
import { items, products, sampleItems } from '@/services/catalog';
import { useTheme } from '@/hooks/useTheme';

// Presentation metadata for the existing local catalog; no sales/category API exists yet.
export const categories = [
  { name: 'Bracelets', description: 'Create your unique bracelet', type: 'bracelet' },
  { name: 'Necklaces', description: 'Design beautiful necklaces', type: 'necklace' },
  { name: 'Charms', description: 'Meaningful little keepsakes', type: 'charm' },
  { name: 'Beads', description: 'Find your favorite colors', type: 'bead' },
  { name: 'Letters', description: 'Add your personal touch', type: 'letter' },
  { name: 'Spacers', description: 'Perfect little details', type: 'spacer' },
] as const;
export type Category = (typeof categories)[number];

export function CategoryCard({ category, compact = false }: { category: Category; compact?: boolean }) {
  const theme = useTheme();
  const ui = useUI();
  const product = products.find((entry) => entry.type === category.type);
  const component = items.find((entry) => entry.type === category.type);
  const visual = product ? <JewelryCanvas items={sampleItems(product)} type={product.type} size={compact ? 92 : 132} decorative />
    : component ? <DesignItem item={component} size={compact ? 52 : 76} /> : null;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Browse ${category.name}`}
      onPress={() => router.push({ pathname: product ? '/products' : '/components', params: { category: category.name } })}
      style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }, compact ? { width: '31%', alignItems: 'center', gap: 7 } :
        { minHeight: 132, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.preview, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, paddingLeft: 18 }]}>
      {compact ? <>
        <View style={{ width: '100%', height: 88, backgroundColor: theme.colors.preview, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{visual}</View>
        <Text style={[ui.label, { fontSize: 11 }]}>{category.name}</Text>
      </> : <>
        <View style={{ flex: 1, gap: 7 }}><Text style={ui.sectionTitle}>{category.name}</Text><Text style={ui.caption}>{category.description}</Text></View>
        <View style={{ width: 120, alignItems: 'center' }}>{visual}</View>
        <View style={{ paddingRight: 12 }}><Icon name="chevron-forward" size={17} /></View>
      </>}
    </Pressable>
  );
}

import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, IconButton, Page, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { CatalogState } from '@/components/products/CatalogState';
import { useCatalog } from '@/hooks/useCatalog';
import { useTheme } from '@/hooks/useTheme';
import { CatalogComponent, fetchCategoryComponents } from '@/services/catalogApi';
import { money } from '@/helper/pricing';

function ComponentCard({
  component,
  selected,
  setSelected,
}: {
  component: CatalogComponent;
  selected: number;
  setSelected: (quantity: number) => void;
}) {
  const ui = useUI();
  const theme = useTheme();
  const quantity = Math.min(selected, component.stock);
  return (
    <View
      style={{
        padding: 14,
        gap: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <CatalogImage imageUrl={component.imageUrl} name={component.name} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={ui.sectionTitle}>{component.name}</Text>
          <Text style={ui.caption}>Color: {component.color || 'Not specified'}</Text>
          <Text style={ui.caption}>Type: {component.type || 'Not specified'}</Text>
          <Text style={ui.label}>{money(component.price)} per bead</Text>
          <Text style={ui.caption}>
            {component.stock ? `${component.stock} available` : 'Out of stock'}
          </Text>
        </View>
      </View>
      <View style={[ui.between, { flexWrap: 'wrap', gap: 8 }]}>
        <Text style={ui.body}>Quantity</Text>
        <View style={[ui.row, { gap: 12 }]}>
          <IconButton
            name="remove"
            label={`Decrease quantity of ${component.name}`}
            disabled={quantity === 0}
            onPress={() => setSelected(Math.max(0, quantity - 1))}
          />
          <Text accessibilityLabel={`Quantity of ${component.name}: ${quantity}`} style={ui.label}>
            {quantity}
          </Text>
          <IconButton
            name="add"
            label={`Increase quantity of ${component.name}`}
            disabled={quantity >= component.stock}
            onPress={() => setSelected(Math.min(component.stock, quantity + 1))}
          />
        </View>
      </View>
      <Text accessibilityLiveRegion="polite" style={ui.label}>
        Estimated subtotal: {money(component.price * quantity)}
      </Text>
    </View>
  );
}

function ComponentList({ categoryId }: { categoryId: string }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const load = useCallback(
    (signal: AbortSignal) => fetchCategoryComponents(categoryId, signal),
    [categoryId],
  );
  const catalog = useCatalog(load);
  return (
    <FlatList
      data={catalog.data}
      extraData={quantities}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
      renderItem={({ item }) => (
        <ComponentCard
          component={item}
          selected={quantities[item.id] ?? 0}
          setSelected={(quantity) =>
            setQuantities((current) => ({ ...current, [item.id]: quantity }))
          }
        />
      )}
      ListEmptyComponent={
        <CatalogState {...catalog} empty="No components are available in this category yet." />
      }
    />
  );
}

export default function ComponentsScreen() {
  const params = useLocalSearchParams<{ categoryId?: string; category?: string }>();
  const categoryId = typeof params.categoryId === 'string' ? params.categoryId : '';
  const ui = useUI();
  return (
    <Page scroll={false}>
      <Header title={typeof params.category === 'string' ? params.category : 'Components'} back />
      {categoryId ? (
        <ComponentList key={categoryId} categoryId={categoryId} />
      ) : (
        <>
          <Text style={ui.body}>Choose a category to see its components.</Text>
          <Button title="Browse categories" onPress={() => router.replace('/categories')} />
        </>
      )}
    </Page>
  );
}

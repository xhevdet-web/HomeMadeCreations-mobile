import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Icon, Page, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { CatalogState } from '@/components/products/CatalogState';
import { useRemote } from '@/hooks/useRemote';
import { fetchCategory } from '@/services/catalogApi';
import { useCatalogStore } from '@/store/catalogStore';
import { useDesignStore } from '@/store/designStore';
import { CategorySize } from '@/types/models';

export default function ChooseSizeScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const ui = useUI();
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const opening = useRef(false);
  const load = useCallback(async (signal: AbortSignal) => {
    const category = await fetchCategory(categoryId ?? '', signal);
    if (!category.isActive) throw new Error('This category is unavailable. Choose another category.');
    return category;
  }, [categoryId]);
  const result = useRemote(load);
  const category = result.data;
  const selectedSize = category?.sizes?.find(size => size.id === selectedId);
  const openBuilder = useCallback((selectedSize?: CategorySize) => {
    if (!category || opening.current) return;
    opening.current = true;
    const productId = useCatalogStore.getState().registerCategory(category);
    useDesignStore.getState().start(productId, undefined, selectedSize);
    router.replace('/designer');
  }, [category]);
  useEffect(() => {
    if (category && !category.sizes?.length) openBuilder();
  }, [category, openBuilder]);
  return <Page>
    <Header title="Choose Size" back />
    {result.loading || result.error ? <CatalogState {...result} error={result.error ?? ''} empty="" /> :
      category && <>
        <Text style={ui.sectionTitle}>{category.name}</Text>
        <Text style={ui.body}>Compare the measurements and component limits. Select a size to see its details before continuing.</Text>
        <View style={{ gap: 12 }}>
          {category.sizes?.map(size => <Pressable key={size.id} accessibilityRole="button"
            accessibilityState={{ selected: size.id === selectedId }}
            accessibilityLabel={`Choose ${size.name}, ${size.measurement} ${size.unit}, up to ${size.maxItems} beads`}
            onPress={() => setSelectedId(size.id)}
            style={({ pressed }) => [ui.card, {
              opacity: pressed ? 0.7 : 1,
              borderColor: size.id === selectedId ? theme.colors.accent : theme.colors.border,
              backgroundColor: size.id === selectedId ? theme.colors.soft : theme.colors.surface,
            }]}>
            <View style={ui.between}>
              <Text style={ui.sectionTitle}>{size.name}</Text>
              <Icon name={size.id === selectedId ? 'checkmark-circle' : 'ellipse-outline'}
                color={size.id === selectedId ? theme.colors.accent : theme.colors.muted} />
            </View>
            <Text style={ui.label}>{size.measurement} {size.unit}</Text>
            <Text style={ui.caption}>Up to {size.maxItems} beads</Text>
          </Pressable>)}
        </View>
        {selectedSize ? <View style={ui.card} accessibilityLiveRegion="polite" testID="selected-size-details">
          <Text style={ui.eyebrow}>YOUR SELECTED SIZE</Text>
          <Text style={ui.sectionTitle}>{selectedSize.name}</Text>
          <Text style={ui.body}>Measurement: {selectedSize.measurement} {selectedSize.unit}</Text>
          <Text style={ui.body}>Component limit: {selectedSize.maxItems}</Text>
          <Text style={ui.caption}>You can place up to {selectedSize.maxItems} components. Once full, you can still rearrange, replace, or remove them.</Text>
        </View> : <Text style={ui.caption}>Select a size above to review its details.</Text>}
        <Button title="Continue to Builder" icon="arrow-forward" disabled={!selectedSize}
          onPress={() => { if (selectedSize) openBuilder(selectedSize); }} />
      </>}
  </Page>;
}

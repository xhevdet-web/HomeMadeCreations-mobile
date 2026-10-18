import { FlatList, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useGetCategoryGarmentsQuery } from '@/api/endpoints/garmentSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import type { Garment } from '@/api/garmentModels';
import { GarmentCard } from './components/GarmentPicker';

const GAP = 12;

/** Every garment of an APPAREL category, e.g. all hoodies, to pick one to customise. */
export default function ApparelCatalogScreen() {
  const ui = useUI();
  const { width } = useWindowDimensions();
  const { categoryId = '' } = useLocalSearchParams<{ categoryId: string }>();
  const category = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId, { skip: !categoryId }));
  const garments = useApiResult<Garment[]>(useGetCategoryGarmentsQuery(categoryId, { skip: !categoryId }));
  const tileWidth = (Math.min(width, 760) - 44 - GAP) / 2;
  return (
    <Page scroll={false} style={{ gap: 12 }}>
      <Header title={category.data?.name ?? 'Collection'} back />
      <FlatList
        data={garments.data ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 4, marginBottom: 6 }}>
            <Text style={[ui.title, { fontSize: 26, lineHeight: 32 }]}>Pick your piece</Text>
            <Text style={ui.body}>
              Choose a style, then its colour and size. Wear it plain or make it yours with designs.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <GarmentCard garment={item} width={tileWidth}
            onPress={() => router.push({ pathname: '/apparel-options', params: { categoryId, garmentId: item.id } })} />
        )}
        ListEmptyComponent={
          <CatalogState loading={garments.loading} error={garments.error}
            empty="No pieces are available yet. Please check back soon." retry={garments.retry} />
        }
      />
    </Page>
  );
}

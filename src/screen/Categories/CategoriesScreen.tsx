import { FlatList, useWindowDimensions, View } from 'react-native';
import { Header, Page } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetAllCategoriesQuery } from '@/api/endpoints/categorySlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import { openCategory } from '@/services/categoryFlow';
import { CategoryTile, CategoryTileSkeleton } from './components/CategoryTile';
import { CreateIntro } from './components/CreateIntro';

const GAP = 12;

export default function CategoriesScreen() {
  const { width } = useWindowDimensions();
  const catalog = useApiResult<CatalogCategory[]>(useGetAllCategoriesQuery());
  // Page content is capped at 760 with 22px side padding.
  const tileWidth = (Math.min(width, 760) - 44 - GAP) / 2;
  return (
    <Page scroll={false} style={{ gap: 12 }}>
      <Header title="Categories" back />
      <FlatList
        data={catalog.data ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<CreateIntro />}
        renderItem={({ item }) => (
          <CategoryTile category={item} width={tileWidth} onPress={() => openCategory(item)} />
        )}
        ListEmptyComponent={
          catalog.loading ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
              {[0, 1, 2, 3].map((item) => <CategoryTileSkeleton key={item} width={tileWidth} />)}
            </View>
          ) : (
            <CatalogState {...catalog} empty="No categories are available yet." />
          )
        }
      />
    </Page>
  );
}

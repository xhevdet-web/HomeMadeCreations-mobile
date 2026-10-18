import { FlatList, View } from 'react-native';
import { Header, Page } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetAllCategoriesQuery } from '@/api/endpoints/categorySlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import { openCategory } from '@/services/categoryFlow';
import { CategoryTile, CategoryTileSkeleton } from './components/CategoryTile';
import { CreateIntro } from './components/CreateIntro';

export default function CategoriesScreen() {
  const catalog = useApiResult<CatalogCategory[]>(useGetAllCategoriesQuery());
  return (
    <Page scroll={false} style={{ gap: 12 }}>
      <Header title="Categories" back />
      <FlatList
        data={catalog.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<CreateIntro />}
        renderItem={({ item }) => <CategoryTile category={item} onPress={() => openCategory(item)} />}
        ListEmptyComponent={
          catalog.loading ? (
            <View style={{ gap: 12 }}>
              {[0, 1, 2, 3].map((item) => <CategoryTileSkeleton key={item} />)}
            </View>
          ) : (
            <CatalogState {...catalog} empty="No categories are available yet." />
          )
        }
      />
    </Page>
  );
}

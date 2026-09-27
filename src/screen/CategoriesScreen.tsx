import { FlatList, Text } from 'react-native';
import { Header, Page, useUI } from '@/components/common/ui';
import { CategoryCard } from '@/components/products/CategoryCard';
import { CatalogState } from '@/components/products/CatalogState';
import { useCatalog } from '@/hooks/useCatalog';
import { fetchCategories } from '@/services/catalogApi';

export default function CategoriesScreen() {
  const ui = useUI();
  const catalog = useCatalog(fetchCategories);
  return (
    <Page scroll={false}>
      <Header title="Categories" back />
      <Text style={ui.body}>Choose a category to explore its beads and components.</Text>
      <FlatList
        data={catalog.data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => <CategoryCard category={item} />}
        ListEmptyComponent={<CatalogState {...catalog} empty="No categories are available yet." />}
      />
    </Page>
  );
}

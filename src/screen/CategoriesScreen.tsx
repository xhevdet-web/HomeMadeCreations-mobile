import { Text } from 'react-native';
import { Header, Page, useUI } from '@/components/common/ui';
import { categories, CategoryCard } from '@/components/products/CategoryCard';

export default function CategoriesScreen() {
  const ui = useUI();
  return <Page style={{ gap: 14 }}>
    <Header title="Categories" back />
    <Text style={[ui.body, { marginBottom: 6 }]}>Every story starts with a little inspiration.</Text>
    {categories.map((category) => <CategoryCard key={category.name} category={category} />)}
  </Page>;
}

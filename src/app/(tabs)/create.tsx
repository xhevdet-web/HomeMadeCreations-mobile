import { router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { categories, CategoryCard } from '@/components/products/CategoryCard';
import { useDesignStore } from '@/store/designStore';

export default function CreateScreen() {
  const ui = useUI();
  const count = useDesignStore((state) => state.items.length);
  return <Page>
    <Header title="Create your story" />
    <Text style={ui.body}>A bracelet for a memory. A necklace for someone special. Start with a piece and make it yours.</Text>
    {count > 0 && <Button title="Continue my design" icon="create-outline" onPress={() => router.push('/designer')} />}
    {categories.slice(0, 2).map((category) => <CategoryCard key={category.name} category={category} />)}
  </Page>;
}

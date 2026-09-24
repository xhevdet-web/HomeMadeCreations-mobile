import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Chips, Field, Header, Page, useUI } from '@/components/common/ui';
import { ProductCard } from '@/components/products/ProductCard';
import { products } from '@/services/catalog';

export default function ProductsScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [filter, setFilter] = useState(
    category === 'Bracelets' || category === 'Necklaces' ? category : 'All',
  );
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();
  const ui = useUI();
  const visible = products.filter(
    (product) =>
      (filter === 'All' || product.type === (filter === 'Bracelets' ? 'bracelet' : 'necklace')) &&
      product.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Page>
      <Header title={category ?? 'The Collection'} back />
      <Field
        label="Search jewelry"
        icon="search-outline"
        placeholder="Find your next favorite piece"
        value={search}
        onChangeText={setSearch}
      />
      <Chips options={['All', 'Bracelets', 'Necklaces']} value={filter} onChange={setFilter} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} width={(Math.min(width, 760) - 58) / 2} />
        ))}
      </View>
      {!visible.length && (
        <Text style={ui.body}>No pieces match your search. Try another name.</Text>
      )}
    </Page>
  );
}

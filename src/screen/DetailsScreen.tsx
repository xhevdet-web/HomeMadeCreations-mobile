import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Chips, Header, Icon, Page, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCanvasProductByIdQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import { products } from '@/services/catalog';
import { money } from '@/helper/pricing';
import { useDesignStore } from '@/store/designStore';
import type { Product } from '@/types/models';

import ProductDetailsScreen from './ProductDetailsScreen';

export default function DetailsScreen() {
  const { purchase } = useLocalSearchParams<{ purchase?: string }>();
  return purchase === 'ready-made' ? <ProductDetailsScreen /> : <CustomDetailsScreen />;
}

function CustomDetailsScreen() {
  const theme = useTheme();
  const ui = useUI();

  const { id } = useLocalSearchParams<{ id: string }>();
  const local = products.find((product) => product.id === id);
  const result = useApiResult<Product>(useGetCanvasProductByIdQuery(id ?? '', { skip: !!local || !id }));
  const { t } = useTranslation();
  const product = local ?? result.data;
  const [size, setSize] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  if (!local && (result.loading || result.error)) return <Page><Header title={t('legacy.productDetails')} back />
    <CatalogState {...result} error={result.error ?? ''} empty={t('legacy.unavailable')} /></Page>;
  if (!product)
    return (
      <Page>
        <Header title={t('legacy.notFound')} back />
        <Button title={t('legacy.exploreCollection')} onPress={() => router.replace('/')} />
      </Page>
    );
  const selectedSize = size ?? product.sizes[1];
  return (
    <Page>
      <Header title={t('legacy.beginning')} back />
      <LinearGradient colors={theme.gradients.details} style={{ borderRadius: 24, padding: 12 }}>
        <Text style={[ui.eyebrow, { textAlign: 'center', marginTop: 15 }]}>
          {product.tag ?? t('legacy.makeItYours')}
        </Text>
        <View style={{ alignItems: 'center' }}><CatalogImage imageUrl={product.imageUrl}
          name={product.name} size={Math.min(width - 70, 370)} /></View>
        <Text style={[ui.caption, { textAlign: 'center', marginBottom: 12 }]}>
          {t('legacy.inspiration')}
        </Text>
      </LinearGradient>
      <View>
        <Text style={ui.eyebrow}>{t('legacy.collectionOf', { type: product.type.toUpperCase() })}</Text>
        <Text style={ui.title}>{product.name}</Text>
      </View>
      <View style={ui.between}>
        <Text style={ui.body}>{product.price === undefined ? t('legacy.blankFrom') : t('legacy.savedPrice')}</Text>
        <Text style={{ fontSize: 25, color: theme.colors.accent }}>{money(product.price ?? product.basePrice)}</Text>
      </View>
      <Text style={ui.body}>{product.description}</Text>
      <View style={{ gap: 12 }}>
        <Text style={ui.label}>{t('legacy.chooseSize')}</Text>
        <Chips options={product.sizes} value={selectedSize} onChange={setSize} />
      </View>
      <View style={ui.card}>
        <View style={ui.row}>
          <Icon name="diamond-outline" color={theme.colors.gold} />
          <Text style={ui.body}>{t('legacy.materials')}</Text>
        </View>
        <View style={ui.row}>
          <Icon name="heart-outline" color={theme.colors.gold} />
          <Text style={ui.body}>{t('legacy.handcrafted')}</Text>
        </View>
      </View>
      <Button
        title={t('legacy.createDesign')}
        icon="sparkles-outline"
        onPress={() => {
          useDesignStore.getState().start(product.id, selectedSize);
          router.push('/designer');
        }}
      />
      <Text style={[ui.caption, { textAlign: 'center' }]}>
        {t('legacy.pricedIndividually')}
      </Text>
    </Page>
  );
}

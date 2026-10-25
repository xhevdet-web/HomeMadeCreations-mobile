import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { toast } from '@/store/toastStore';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetProductByIdQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import { companyUnavailable, isCompanyProduct } from '@/api/catalogModels';
import { parseSizes } from '@/api/apparelModels';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import type { SavedProduct } from '@/api/commerceModels';
import { isCanvasBuilder } from '@/helper/canvasStudio';
import { SizePicker } from './Apparel/components/BasePicker';

/** A company product: its photos, colour and sizes, ordered as it is or customised. */
export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const result = useApiResult<SavedProduct>(useGetProductByIdQuery(id ?? '', { skip: !id }));
  const [size, setSize] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);
  const product = result.data;

  if (result.loading || result.error || !product || !isCompanyProduct(product))
    return (
      <Page>
        <Header title="Product details" back />
        {result.loading || result.error
          ? <CatalogState {...result} error={result.error ?? ''} empty="" />
          : <Text style={ui.body}>Product unavailable.</Text>}
      </Page>
    );

  const sizes = parseSizes(product.sizes);
  const unavailable = companyUnavailable(product, size);
  const apparel = product.category?.builderType === 'APPAREL';
  // Apparel, bouquets and gifts can be customised starting from this exact product.
  const customizable = apparel || isCanvasBuilder(product.category?.builderType);
  const photos = [
    { label: 'Front', url: product.imageUrl },
    ...(product.backImageUrl ? [{ label: 'Back', url: product.backImageUrl }] : []),
  ];
  const shown = photos[Math.min(photo, photos.length - 1)];
  const imageSize = Math.min(width - 44, 360);

  function order() {
    if (!user) { toast.info('Please log in, then return to this product to order.'); router.push('/login'); return; }
    if (!product || unavailable) return;
    useCommerceStore.getState().setCheckout(user.id, product, size);
    router.push('/checkout');
  }

  return (
    <Page
      style={{ gap: 18 }}
      footer={
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={ui.between}>
              <Text style={ui.caption} numberOfLines={1}>
                {unavailable ?? [product.color, size].filter(Boolean).join(' · ')}
              </Text>
              <Text style={styles.total}>{money(product.price)}</Text>
            </View>
            <View style={styles.actions}>
              {customizable && (
                <View style={{ flex: 1 }}>
                  <Button title="Customize" icon="color-palette-outline" secondary
                    onPress={() => router.push({ pathname: apparel ? '/apparel-base' : '/design-base',
                      params: { categoryId: product.categoryId, baseProductId: product.id } })} />
                </View>
              )}
              <View style={{ flex: 1.3 }}>
                <Button title={unavailable ?? 'Order Now'} icon={unavailable ? undefined : 'bag-add-outline'}
                  disabled={!!unavailable} onPress={order} />
              </View>
            </View>
          </View>
        </SafeAreaView>
      }
    >
      <Header title={product.category?.name ?? 'Product details'} back />
      <View style={{ gap: 10 }}>
        <View style={[styles.photo, { width: imageSize, height: imageSize }]}>
          <CatalogImage imageUrl={shown?.url} name={product.name} size={imageSize - 16} />
        </View>
        {photos.length > 1 && (
          <View style={styles.thumbs}>
            {photos.map((entry, index) => (
              <Pressable key={entry.label} accessibilityRole="button" accessibilityLabel={`Show ${entry.label}`}
                accessibilityState={{ selected: index === photo }} onPress={() => setPhoto(index)}
                style={[styles.thumb, index === photo && styles.thumbActive]}>
                <CatalogImage imageUrl={entry.url} name={entry.label} size={50} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: 4 }}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{money(product.price)}</Text>
        {!!product.color && (
          <View style={styles.colour}>
            {!!product.colorHex && <View style={[styles.swatch, { backgroundColor: product.colorHex }]} />}
            <Text style={ui.caption}>{product.color}</Text>
          </View>
        )}
      </View>

      {sizes.length > 0 ? (
        <View style={styles.section}>
          <View style={ui.between}>
            <Text style={styles.label}>Size</Text>
            {size && <Text style={styles.value}>{size}</Text>}
          </View>
          <SizePicker sizes={sizes} value={size} onChange={setSize} />
        </View>
      ) : (
        <Text style={ui.caption}>
          {(product.stock ?? 0) > 0 ? `${product.stock} available` : 'Out of stock'}
        </Text>
      )}

      {!!product.description && <Text style={ui.body}>{product.description}</Text>}
      <Text style={ui.caption}>
        {apparel
          ? 'Order it as it is, or customize it with logos and your own artwork. Pay cash on delivery.'
          : customizable
            ? 'Order it as it is, or customize it and add your own touches. Pay cash on delivery.'
            : 'Handmade and ready to be yours. Pay cash on delivery.'}
      </Text>
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    photo: {
      alignSelf: 'center', borderRadius: 24, overflow: 'hidden', backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border,
    },
    thumbs: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    thumb: {
      width: 60, height: 60, borderRadius: 14, overflow: 'hidden', backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: c.border,
    },
    thumbActive: { borderColor: c.accent },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 28, lineHeight: 34 },
    price: { color: c.gold, fontSize: 20, fontWeight: '700' },
    colour: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: c.border },
    section: {
      gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    label: { color: c.text, fontSize: 15, fontWeight: '600' },
    value: { color: c.accent, fontSize: 13, fontWeight: '600' },
    footer: { borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bottomBar },
    footerInner: {
      width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 10, gap: 8,
    },
    actions: { flexDirection: 'row', gap: 10 },
    total: { color: c.text, fontSize: 20, fontWeight: '600' },
  });
};

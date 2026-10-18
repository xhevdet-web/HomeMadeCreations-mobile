import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { TextAction } from '@/components/common/TextAction';
import { ActionFooter } from '@/components/checkout/ActionFooter';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCreationsFromOthersQuery } from '@/api/endpoints/productSlice';
import { useGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useApiResult } from '@/api/useApiResult';
import type { CommunityCreation } from '@/api/commerceModels';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { copyCreation } from '@/services/savedDesign';
import { isApparelProduct, loadApparelDesign } from '@/services/apparelDesign';
import { isCanvasProduct, loadCanvasDesign } from '@/services/canvasDesign';
import { CreationBeads, CreationHero, CreationPromise, type CreationLine } from './components/CreationDetails';

export default function CreationScreen() {
  const ui = useUI();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const result = useApiResult<CommunityCreation[]>(useGetCreationsFromOthersQuery());
  const creation = result.data?.find((entry) => entry.completedOrderId === id);
  const categoryId = creation?.product.categoryId ?? '';
  const { data: components } = useGetCategoryComponentsQuery(categoryId, { skip: !categoryId });
  const [opening, setOpening] = useState<'order' | 'customize' | null>(null);
  const [error, setError] = useFeedbackState();

  // One line per bead, priced and stock-checked against today's catalog.
  const lines: CreationLine[] = [];
  for (const item of creation?.product.items ?? []) {
    const line = lines.find((entry) => entry.id === item.subCategoryId);
    if (line) { line.quantity += item.quantity; continue; }
    const current = components?.find((component) => component.id === item.subCategoryId);
    lines.push({
      id: item.subCategoryId,
      name: item.subCategory.name,
      imageUrl: current?.imageUrl ?? item.subCategory.imageUrl,
      quantity: item.quantity,
      unitPrice: current?.price ?? item.unitPrice,
      available: !components || !!current,
    });
  }
  for (const line of lines) {
    const current = components?.find((component) => component.id === line.id);
    if (current && current.stock < line.quantity) line.available = false;
  }
  const unavailable = lines.filter((line) => !line.available);
  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const pricesChanged = !!creation && !!components && total !== creation.product.price;

  async function open(mode: 'order' | 'customize') {
    if (!creation || !user || opening) return;
    setOpening(mode);
    setError('');
    try {
      if (isApparelProduct(creation.product)) {
        // Apparel copies open in the Apparel Studio, where they are saved as the buyer's own.
        loadApparelDesign(creation.product, `My ${creation.product.name}`);
        toast.info('Design opened. Review it in the studio, then continue to your order.');
        router.push('/apparel-studio');
        return;
      }
      if (isCanvasProduct(creation.product)) {
        // A copy opens as the buyer's own design; it is saved when they continue.
        loadCanvasDesign(creation.product, `My ${creation.product.name}`);
        toast.info(mode === 'order' ? 'Design ready. Review it, then continue to your order.'
          : 'Design opened. Make it yours, then preview and order.');
        router.push(mode === 'order' ? '/studio-preview' : '/studio');
        return;
      }
      await copyCreation(creation.product, user.id);
      if (mode === 'order') {
        toast.info('Design ready. Review it, then continue to delivery.');
        router.push('/preview');
      } else {
        toast.info('Design opened in your studio. Make it yours, then preview and order.');
        router.push('/designer');
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to open this design.');
    } finally {
      setOpening(null);
    }
  }

  if (!creation)
    return (
      <Page style={{ maxWidth: 600 }}>
        <Header title="Creation" back />
        {result.loading || result.error ? (
          <CatalogState loading={result.loading} error={result.error} empty="" retry={result.retry} />
        ) : (
          <>
            <Text style={ui.body}>This creation is no longer available.</Text>
            <Button title="Back to home" onPress={() => router.replace('/')} />
          </>
        )}
      </Page>
    );

  return (
    <Page
      style={{ maxWidth: 600, gap: 18 }}
      footer={
        <ActionFooter
          amount={total}
          amountLabel={pricesChanged ? 'Price today' : 'Total'}
          title={opening === 'order' ? 'Preparing your design…' : 'Order this design'}
          onPress={() => void open('order')}
          loading={opening === 'order'}
          disabled={!!opening || unavailable.length > 0}
          caption={unavailable.length
            ? 'Some beads are unavailable. Customize the design to replace them.'
            : 'Pay cash when your order arrives.'}
        />
      }
    >
      <Header title="Creation" back />
      <CreationHero creation={creation} width={Math.min(width, 600) - 44} />
      <CreationBeads lines={lines} title={isApparelProduct(creation.product) ? 'Designs on this piece'
        : creation.product.category?.builderType === 'BOUQUET' ? 'Flowers in this bouquet'
          : creation.product.category?.builderType === 'GIFT' ? 'Items in this gift' : undefined} />
      {pricesChanged && (
        <Text style={ui.caption}>
          Bead prices have changed since this piece was made, so your price is based on today’s prices.
        </Text>
      )}
      <CreationPromise />
      <View style={{ alignItems: 'center' }}>
        <TextAction
          title={opening === 'customize' ? 'Opening the studio…' : 'Customize it first'}
          icon="color-palette-outline"
          onPress={() => void open('customize')}
          loading={opening === 'customize'}
          disabled={!!opening}
        />
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>{error}</Text>
      )}
    </Page>
  );
}

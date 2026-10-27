import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  // `collection` is set when opened from a category's carousel, so the same list is read.
  const { id, collection } = useLocalSearchParams<{ id: string; collection?: string }>();
  const user = useAuthStore((state) => state.user);
  const result = useApiResult<CommunityCreation[]>(
    useGetCreationsFromOthersQuery(collection ? { categoryId: collection } : undefined));
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
        loadApparelDesign(creation.product, t('drafts.myName', { name: creation.product.name }));
        toast.info(t('creation.openedApparel'));
        router.push('/apparel-studio');
        return;
      }
      if (isCanvasProduct(creation.product)) {
        // A copy opens as the buyer's own design; it is saved when they continue.
        loadCanvasDesign(creation.product, t('drafts.myName', { name: creation.product.name }));
        toast.info(mode === 'order' ? t('creation.readyCanvas') : t('creation.openedCanvas'));
        router.push(mode === 'order' ? '/studio-preview' : '/studio');
        return;
      }
      await copyCreation(creation.product, user.id);
      if (mode === 'order') {
        toast.info(t('creation.readyJewelry'));
        router.push('/preview');
      } else {
        toast.info(t('creation.openedJewelry'));
        router.push('/designer');
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('creation.openFailed'));
    } finally {
      setOpening(null);
    }
  }

  if (!creation)
    return (
      <Page style={{ maxWidth: 600 }}>
        <Header title={t('creation.title')} back />
        {result.loading || result.error ? (
          <CatalogState loading={result.loading} error={result.error} empty="" retry={result.retry} />
        ) : (
          <>
            <Text style={ui.body}>{t('creation.unavailable')}</Text>
            <Button title={t('creation.backHome')} onPress={() => router.replace('/')} />
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
          amountLabel={pricesChanged ? t('creation.priceToday') : t('common.total')}
          title={opening === 'order' ? t('creation.preparing') : t('creation.orderThis')}
          onPress={() => void open('order')}
          loading={opening === 'order'}
          disabled={!!opening || unavailable.length > 0}
          caption={unavailable.length
            ? t('creation.someUnavailable')
            : t('creation.payCash')}
        />
      }
    >
      <Header title={t('creation.title')} back />
      <CreationHero creation={creation} width={Math.min(width, 600) - 44} />
      <CreationBeads lines={lines} title={isApparelProduct(creation.product) ? t('creation.designsOnPiece')
        : creation.product.category?.builderType === 'BOUQUET' ? t('creation.flowersInBouquet')
          : creation.product.category?.builderType === 'GIFT' ? t('creation.itemsInGift') : undefined} />
      {pricesChanged && (
        <Text style={ui.caption}>
          {t('creation.pricesChanged')}
        </Text>
      )}
      <CreationPromise />
      <View style={{ alignItems: 'center' }}>
        <TextAction
          title={opening === 'customize' ? t('creation.openingStudio') : t('creation.customizeFirst')}
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

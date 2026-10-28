import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Header, Page, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useGetProductsQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import { modelsByBrand, type CaseModel } from '@/api/caseModels';
import { useCaseStore } from '@/store/caseStore';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';

const GAP = 12;

/**
 * Cases, step 1: choose your phone. Only the models the admin offers (active COMPANY
 * products of the category) are shown, grouped by brand. Nothing is reserved here.
 */
export default function CaseModelScreen() {
  const { t } = useTranslation();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const { categoryId = '', baseProductId, edit } =
    useLocalSearchParams<{ categoryId: string; baseProductId?: string; edit?: string }>();
  const category = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId, { skip: !categoryId }));
  const models = useApiResult<CaseModel[]>(
    useGetProductsQuery({ categoryId, origin: 'COMPANY' }, { skip: !categoryId }));
  const selectedId = useCaseStore((state) => state.modelId);

  useEffect(() => {
    if (!category.data) return;
    // Another category starts a fresh case; the same one keeps the chosen image.
    if (edit !== '1' && useCaseStore.getState().categoryId !== category.data.id)
      useCaseStore.getState().start(category.data.id, t('drafts.myName', { name: category.data.name }));
    // Opened from a model's own page: go straight to the studio with it.
    if (baseProductId) {
      useCaseStore.getState().setModel(baseProductId);
      router.replace('/case-studio');
    }
  }, [category.data, baseProductId, edit, t]);

  if (!category.data || !models.data)
    return (
      <Page>
        <Header title={t('cases.choosePhone')} back />
        <CatalogState loading={category.loading || models.loading} error={category.error || models.error}
          empty={t('category.unavailable')} retry={models.retry} />
      </Page>
    );

  const groups = modelsByBrand(models.data, t('cases.otherBrand'));
  const tileWidth = (Math.min(width, 760) - 44 - GAP) / 2;

  function choose(model: CaseModel) {
    useCaseStore.getState().setModel(model.id);
    if (edit === '1') router.back();
    else router.push('/case-studio');
  }

  return (
    <Page style={{ gap: 20 }}>
      <Header title={t('cases.choosePhone')} subtitle={category.data.name} back />
      <Text style={ui.body}>{t('cases.choosePhoneIntro')}</Text>
      {groups.length ? groups.map((group) => (
        <View key={group.brand} style={{ gap: 12 }} accessibilityRole="list" accessibilityLabel={group.label}>
          <Text style={styles.brand}>{group.label}</Text>
          <View style={styles.grid}>
            {group.models.map((model) => {
              const soldOut = (model.stock ?? 0) < 1;
              const selected = model.id === selectedId;
              return (
                <Pressable key={model.id} accessibilityRole="button" disabled={soldOut}
                  accessibilityState={{ selected, disabled: soldOut }}
                  accessibilityLabel={t('cases.modelLabel', { name: model.name, price: money(model.price),
                    status: soldOut ? t('readyMade.outOfStock') : '' })}
                  onPress={() => choose(model)}
                  style={({ pressed }) => [styles.tile, { width: tileWidth }, selected && styles.selected,
                    { opacity: soldOut ? 0.5 : pressed ? 0.8 : 1 }]}>
                  {/* The model's own template: each phone shows its real shape and camera. */}
                  <View style={[styles.preview, { height: tileWidth * 1.05 }]}>
                    {model.imageUrl ? (
                      <Image source={{ uri: model.imageUrl }} resizeMode="contain" style={styles.template}
                        accessibilityIgnoresInvertColors />
                    ) : (
                      <CatalogImage imageUrl={null} name={model.name} size={tileWidth * 0.5} />
                    )}
                  </View>
                  <Text style={styles.name} numberOfLines={2}>{model.name}</Text>
                  <Text style={soldOut ? ui.caption : styles.price}>
                    {soldOut ? t('readyMade.outOfStock') : money(model.price)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )) : (
        <Text style={ui.body}>{t('cases.noModels')}</Text>
      )}
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    brand: { color: c.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    tile: {
      gap: 6, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    selected: { borderColor: c.accent, borderWidth: 1.5 },
    preview: {
      alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: c.thumbnail,
      padding: 12, marginBottom: 4,
    },
    template: { width: '100%', height: '100%' },
    name: { color: c.text, fontSize: 15, fontWeight: '600' },
    price: { color: c.gold, fontSize: 13, fontWeight: '700' },
  });
};

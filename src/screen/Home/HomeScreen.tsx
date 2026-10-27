import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useDesignStore } from '@/store/designStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useApparelStore } from '@/store/apparelStore';
import { useGetOrdersQuery } from '@/api/endpoints/orderSlice';
import { useGetAllCategoriesQuery } from '@/api/endpoints/categorySlice';
import {
  useGetCreationsFromOthersQuery, useGetProductsQuery, useGetUserProductsQuery,
} from '@/api/endpoints/productSlice';
import { apiError } from '@/api/apiSlice';
import { useApiResult } from '@/api/useApiResult';
import { inStock } from '@/api/apparelModels';
import type { BuilderType } from '@/api/builderModels';
import type { CatalogCategory } from '@/api/catalogModels';
import type { CommunityCreation, SavedProduct } from '@/api/commerceModels';
import { productById } from '@/services/catalog';
import { openCategory, startDesign } from '@/services/categoryFlow';
import { canvasSignature } from '@/services/canvasDesign';
import { apparelSignature } from '@/services/apparelDesign';
import { designPrice, money } from '@/helper/pricing';
import { builderOf, takeTurns } from './homeContent';
import { HomeHeader } from './components/HomeHeader';
import { ContinueSection, type ContinueItem } from './components/ContinueSection';
import { HomeHero } from './components/HomeHero';
import { CategoryRail } from './components/CategoryRail';
import { OccasionSection } from './components/OccasionSection';
import { InspirationSection } from './components/InspirationSection';
import { CommunityCreations } from './components/ForYou';
import { ReadyMadeSection } from './components/ReadyMadeSection';
import { HomeSearchResults } from './components/HomeSearchResults';
import { WhyHomeMade } from './components/Highlights';

const READY_MADE_LIMIT = 10;

/** True when a studio draft differs from the product last saved from it (or was never saved). */
function unsaved(signature: () => string, saved: { signature: string } | null) {
  try {
    return saved?.signature !== signature();
  } catch {
    // A draft that cannot be turned into a product yet (e.g. no base chosen) is unsaved work.
    return true;
  }
}

/**
 * Home orchestrates its sections: personal (continue) → create → ideas → community →
 * ready-made → why HomeMade. Each section loads and fails on its own.
 */
export default function HomeScreen() {
  const ui = useUI();
  const theme = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const user = useAuthStore((state) => state.user);
  const authenticated = useAuthStore((state) => state.status === 'authenticated');
  const jewelry = useDesignStore();
  const canvas = useCanvasStore();
  const apparel = useApparelStore();

  const { data: orderPage } = useGetOrdersQuery(1, { skip: !user });
  const categoriesResult = useApiResult<CatalogCategory[]>(useGetAllCategoriesQuery());
  const { data: designs } = useGetUserProductsQuery(user?.id ?? '', { skip: !user });
  const readyMadeResult = useApiResult<SavedProduct[]>(useGetProductsQuery({ origin: 'COMPANY' }));
  // Community creations need a valid session; request them once it has been restored.
  const creationsQuery = useGetCreationsFromOthersQuery(undefined, { skip: !authenticated });
  const creations = useApiResult<CommunityCreation[]>(creationsQuery);
  const { error: creationsError, refetch: refetchCreations } = creationsQuery;
  const unauthorized = !!creationsError && apiError(creationsError).status === 401;
  const restoringSession = useRef(false);
  useEffect(() => {
    // A 401 means the token was rejected: re-validate the session once. An invalid
    // session signs out, and the protected navigator then opens Login.
    if (!unauthorized || restoringSession.current) return;
    restoringSession.current = true;
    void useAuthStore.getState().restore().then(() => {
      if (useAuthStore.getState().status === 'authenticated') void refetchCreations();
    });
  }, [unauthorized, refetchCreations]);

  // The navy header sits under the status bar: light icons while Home is in front.
  useFocusEffect(useCallback(() => {
    setStatusBarStyle('light');
    return () => setStatusBarStyle(theme.mode === 'dark' ? 'light' : 'dark');
  }, [theme.mode]));

  const categories = categoriesResult.data ?? [];
  const inStockProducts = useMemo(
    () => (readyMadeResult.data ?? []).filter(inStock), [readyMadeResult.data]);
  // Taking turns between categories keeps one category from filling the rail.
  const readyMade = useMemo(
    () => takeTurns(inStockProducts, (product) => product.categoryId, READY_MADE_LIMIT), [inStockProducts]);
  const triedBuilders = useMemo(() => new Set<BuilderType>((designs ?? [])
    .filter((design) => design.origin !== 'COMPANY' && design.category)
    .map((design) => builderOf(design.category!))), [designs]);

  const activeOrder = orderPage?.data.find((order) => order.status !== 'COMPLETED');
  const continueItems: ContinueItem[] = [];
  const jewelryProduct = jewelry.items.length ? productById[jewelry.productId] : undefined;
  if (jewelryProduct)
    continueItems.push({
      key: 'jewelry', icon: 'color-palette-outline', eyebrow: t('home.unsavedDesign'),
      title: jewelry.name.trim() || jewelryProduct.name,
      detail: `${t('counts.bead', { count: jewelry.items.length })} · ${money(designPrice(jewelryProduct.basePrice, jewelry.items))}`,
      onPress: () => router.push('/designer'),
    });
  const canvasPieces = canvas.placements.length + canvas.texts.length;
  if (canvas.categoryId && canvasPieces && unsaved(canvasSignature, canvas.saved))
    continueItems.push({
      key: 'canvas', icon: canvas.builderType === 'BOUQUET' ? 'rose-outline' : 'gift-outline',
      eyebrow: t('home.unsavedDesign'), title: canvas.name.trim() || canvas.categoryName,
      detail: `${canvas.categoryName} · ${t('counts.piece', { count: canvasPieces })}`,
      onPress: () => router.push('/studio'),
    });
  const apparelPieces = apparel.placements.length + apparel.texts.length;
  if (apparel.categoryId && apparelPieces && unsaved(() => apparelSignature(apparel.categoryId!), apparel.saved))
    continueItems.push({
      key: 'apparel', icon: 'shirt-outline', eyebrow: t('home.unsavedDesign'),
      title: apparel.name.trim() || t('home.myDesign'), detail: t('counts.design', { count: apparelPieces }),
      onPress: () => router.push('/apparel-studio'),
    });

  const browseCategories = () => router.push('/categories');
  const searching = search.trim().length > 0;

  return (
    <SafeAreaView edges={['left', 'right']} style={ui.page}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}>
        <HomeHeader firstName={user?.firstName} lastName={user?.lastName} search={search} onSearch={setSearch}
          activeOrder={activeOrder} />
        <View style={[ui.pageContent, { gap: 28, paddingTop: 22 }]}>
          {searching ? (
            <HomeSearchResults query={search} categories={categories} products={inStockProducts}
              onOpenCategory={openCategory} />
          ) : (
            <>
              <ContinueSection items={continueItems} />
              <HomeHero onCreate={browseCategories} />
              <CategoryRail categories={categories} loading={categoriesResult.loading}
                error={!!categoriesResult.error} onRetry={categoriesResult.retry}
                onOpen={openCategory} onSeeAll={browseCategories} />
              <OccasionSection categories={categories} onOpen={openCategory} />
              <InspirationSection categories={categories} triedBuilders={triedBuilders} onStart={startDesign} />
              {/* Optional: hidden when empty or unavailable rather than showing an error. */}
              {!creations.error && (
                <CommunityCreations
                  eyebrow={t('home.communityEyebrow')}
                  title={t('home.communityTitle')}
                  intro={t('home.communityIntro')}
                  creations={creations.data ?? []}
                  loading={creations.loading || !authenticated || unauthorized}
                  error=""
                  onRetry={creations.retry}
                  hideWhenEmpty
                  onOpen={(creation) =>
                    router.push({ pathname: '/creation', params: { id: creation.completedOrderId } })}
                />
              )}
              <ReadyMadeSection products={readyMade} loading={readyMadeResult.loading}
                error={!!readyMadeResult.error} onRetry={readyMadeResult.retry} onSeeAll={browseCategories} />
              <WhyHomeMade />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

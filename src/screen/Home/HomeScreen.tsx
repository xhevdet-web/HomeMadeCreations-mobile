import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Brand, Icon, IconButton, Page, useUI } from '@/components/common/ui';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';
import { ReadyMadeCollection } from '@/components/products/ReadyMadeCollection';
import { type Theme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useDesignStore } from '@/store/designStore';
import { useGetOrdersQuery } from '@/api/endpoints/orderSlice';
import { useGetAllCategoriesQuery } from '@/api/endpoints/categorySlice';
import {
  useGetCreationsFromOthersQuery, useGetProductsQuery, useGetUserProductsQuery,
} from '@/api/endpoints/productSlice';
import { apiError } from '@/api/apiSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CommunityCreation } from '@/api/commerceModels';
import { productById } from '@/services/catalog';
import { openCategory } from '@/services/categoryFlow';
import { designPrice } from '@/helper/pricing';
import { HomeHero } from './components/HomeHero';
import { ActiveOrderCard, DraftCard } from './components/ContinueSection';
import { CategoryRail } from './components/CategoryRail';
import { ComingNext, TrustStrip, type UpcomingFeature } from './components/Highlights';
import { CommunityCreations, FavouriteBeads, favouriteBeads } from './components/ForYou';

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export default function HomeScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const draft = useDesignStore();
  const { data: orderPage } = useGetOrdersQuery(1, { skip: !user });
  const { data: categories } = useGetAllCategoriesQuery();
  const { data: designs } = useGetUserProductsQuery(user?.id ?? '', { skip: !user });
  const { data: readyMade } = useGetProductsQuery({ origin: 'COMPANY' });
  // Community creations need a valid session; request them once it has been restored.
  const authenticated = useAuthStore((state) => state.status === 'authenticated');
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
  const myDesigns = (designs ?? []).filter((design) => design.origin !== 'COMPANY');
  const favourites = favouriteBeads(myDesigns);
  const upcoming: UpcomingFeature[] = [
    { title: 'Best sellers', detail: 'The pieces everyone is ordering', icon: 'trophy-outline',
      images: (readyMade ?? []).map((product) => product.designPreviewUrl ?? product.imageUrl) },
    { title: 'Trending beads', detail: 'Popular beads this season', icon: 'trending-up-outline',
      images: favourites.map((bead) => bead.imageUrl) },
    { title: 'Gift wrapping', detail: 'Ready to give, with a note', icon: 'gift-outline' },
    { title: 'Gift cards', detail: 'Let them design their own', icon: 'card-outline' },
  ];

  const activeOrder = orderPage?.data.find((order) => order.status !== 'COMPLETED');
  const draftProduct = draft.items.length ? productById[draft.productId] : undefined;
  const createOwn = () => router.push('/categories');

  return (
    <Page>
      <View style={ui.between}>
        <Brand compact />
        <View style={[ui.row, { gap: 6 }]}>
          {width >= 380 && (
            <IconButton name="heart-outline" label="My saved designs"
              onPress={() => router.push('/designs')} />
          )}
          <IconButton name="bag-handle-outline" label="Open shopping bag"
            onPress={() => router.push('/checkout')} />
          <ThemeToggleButton />
        </View>
      </View>

      {!!user?.firstName && (
        <View style={{ gap: 2 }}>
          <Text style={styles.greeting}>{greeting()}, {user.firstName}</Text>
          <Text style={ui.body}>What will you create today?</Text>
        </View>
      )}

      {(activeOrder || draftProduct) && (
        <View style={{ gap: 10 }}>
          <Text style={ui.eyebrow}>PICK UP WHERE YOU LEFT OFF</Text>
          {activeOrder && (
            <ActiveOrderCard
              order={activeOrder}
              onPress={() =>
                router.push({ pathname: '/confirmation', params: { id: activeOrder.id } })}
            />
          )}
          {draftProduct && (
            <DraftCard
              name={draft.name.trim() || draftProduct.name}
              beads={draft.items.length}
              total={designPrice(draftProduct.basePrice, draft.items)}
              onPress={() => router.push('/designer')}
            />
          )}
        </View>
      )}

      <HomeHero onCreate={createOwn} />

      {!!categories?.length && (
        <CategoryRail categories={categories} onOpen={openCategory} onSeeAll={createOwn} />
      )}

      <View style={styles.browseIntro}>
        <Text style={styles.browseTitle}>Find something you love</Text>
        <Text style={ui.body}>Explore ready-made creations, ready to order.</Text>
      </View>
      <View style={styles.search}>
        <Icon name="search-outline" size={19} color={c.muted} />
        <TextInput accessibilityLabel="Search products" placeholder="Search ready-made creations"
          placeholderTextColor={c.muted} value={search} onChangeText={setSearch}
          style={styles.searchInput} />
        {search.length > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search"
            onPress={() => setSearch('')} hitSlop={10}>
            <Icon name="close" size={18} color={c.muted} />
          </Pressable>
        )}
      </View>
      <ReadyMadeCollection search={search} />

      <CommunityCreations
        creations={creations.data ?? []}
        loading={creations.loading || !authenticated || unauthorized}
        error={unauthorized ? '' : creations.error}
        onRetry={creations.retry}
        onOpen={(creation) =>
          router.push({ pathname: '/creation', params: { id: creation.completedOrderId } })}
      />
      {favourites.length > 0 && <FavouriteBeads beads={favourites} />}

      <TrustStrip />
      <ComingNext features={upcoming} />
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    greeting: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 26 },
    browseIntro: { gap: 6, marginTop: 4 },
    browseTitle: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 26 },
    search: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      minHeight: 49,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      gap: 10,
    },
    searchInput: { flex: 1, color: c.text, fontSize: 13, minHeight: 48 },
  });
};

import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Brand,
  Button,
  Icon,
  IconButton,
  Page,
  SectionTitle,
  useUI,
} from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { ProductCard } from '@/components/products/ProductCard';
import { CatalogState } from '@/components/products/CatalogState';
import { loadProducts } from '@/store/catalogStore';
import { useRemote } from '@/hooks/useRemote';
import { type Theme } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function HomeScreen() {
  const toggleTheme = useThemeStore((state) => state.toggle);
  const theme = useTheme();
  const c = theme.colors;
  const ui = useUI();
  const styles = useThemedStyles(createStyles);

  const [search, setSearch] = useState('');
  const result = useRemote(loadProducts);
  const products = result.data ?? [];
  const { width } = useWindowDimensions();
  return (
    <Page>
      <View style={ui.between}>
        <Brand compact={width < 430} />
        <View style={[ui.row, { gap: 6 }]}>
          {width >= 380 && (
            <IconButton
              name="heart-outline"
              label="My saved designs"
              onPress={() => router.push('/designs')}
            />
          )}
          <IconButton
            name="bag-handle-outline"
            label="Open shopping bag"
            onPress={() => router.push('/checkout')}
          />
          <IconButton
            name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
            label={theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onPress={toggleTheme}
          />
        </View>
      </View>
      <LinearGradient
        colors={theme.gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, width > 650 && { minHeight: 365 }]}
      >
        <View style={styles.heroCircle} />
        <View style={styles.heroCircleSmall} />
        <View style={styles.heroCopy}>
          <View style={styles.pill}>
            <View style={styles.dot} />
            <Text style={styles.pillText}>A LITTLE BEAD. A LOT OF YOU.</Text>
          </View>
          <Text style={styles.heroTitle}>
            Small beads.{'\n'}Endless{' '}
            <Text style={{ color: c.gold, fontStyle: 'italic' }}>stories.</Text>
          </Text>
          <Text style={styles.heroBody}>
            Create something made by you.{'\n'}We’ll handcraft it with love.
          </Text>
          <View style={{ alignSelf: 'flex-start', marginTop: 22 }}>
            <Button
              title="Create your own"
              icon="arrow-forward"
              onPress={() => router.push('/categories')}
            />
          </View>
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.heroJewelry,
            {
              right: width > 650 ? 12 : -66,
              bottom: width > 650 ? -22 : -81,
              opacity: width > 650 ? 1 : 0.85,
            },
          ]}
        >
          <CatalogImage imageUrl={products[0]?.imageUrl} name={products[0]?.name ?? 'Your creation'}
            size={width > 650 ? 380 : 250} />
        </View>
        <Text style={styles.heroNote}>one of a kind, just like you</Text>
      </LinearGradient>
      <View style={styles.promises}>
        {[
          { icon: 'diamond-outline' as const, title: 'Uniquely yours' },
          { icon: 'heart-outline' as const, title: 'Made with love' },
          { icon: 'cube-outline' as const, title: 'Delivered to you' },
        ].map((item) => (
          <View key={item.title} style={styles.promise}>
            <Icon name={item.icon} color={c.gold} size={19} />
            <Text style={styles.promiseText}>{item.title}</Text>
          </View>
        ))}
      </View>
      <View style={styles.search}>
        <Icon name="search-outline" size={19} color={c.muted} />
        <TextInput
          accessibilityLabel="Search jewelry"
          placeholder="Find your next little treasure…"
          placeholderTextColor={c.muted}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <Pressable accessibilityLabel="Clear search" onPress={() => setSearch('')} hitSlop={10}>
            <Icon name="close" size={18} color={c.muted} />
          </Pressable>
        )}
      </View>
      <SectionTitle title="Your story starts here" eyebrow="THE COLLECTION" />
      {result.loading || result.error || !products.length ? (
        <CatalogState {...result} error={result.error ?? ''} empty="No products are available yet." />
      ) : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {products.filter((product) => product.name.toLowerCase().includes(search.toLowerCase())).map((product) => (
          <ProductCard key={product.id} product={product} width={(Math.min(width, 760) - 58) / 2} />
        ))}
      </View>}

    </Page>
  );
}
const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    hero: {
      borderRadius: 24,
      padding: 25,
      minHeight: 340,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.heroBorder,
    },
    heroCopy: { zIndex: 2, alignItems: 'flex-start' },
    heroCircle: {
      position: 'absolute',
      width: 380,
      height: 380,
      borderRadius: 190,
      borderWidth: 1,
      borderColor: theme.colors.heroRing,
      right: -120,
      bottom: -150,
    },
    heroCircleSmall: {
      position: 'absolute',
      width: 310,
      height: 310,
      borderRadius: 155,
      borderWidth: 1,
      borderColor: theme.colors.heroRingSoft,
      right: -84,
      bottom: -112,
    },
    pill: { flexDirection: 'row', gap: 7, alignItems: 'center', marginBottom: 21 },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.gold },
    pillText: { color: c.gold, fontSize: 8, letterSpacing: 1.6 },
    heroTitle: {
      fontSize: 39,
      lineHeight: 45,
      color: c.text,
      fontFamily: theme.fonts.editorial,
      letterSpacing: -1.2,
    },
    heroBody: { fontSize: 12, color: theme.colors.heroText, lineHeight: 21, marginTop: 13 },
    heroJewelry: { position: 'absolute', transform: [{ rotate: '-22deg' }] },
    heroNote: {
      position: 'absolute',
      bottom: 17,
      left: 25,
      color: theme.colors.heroNote,
      fontFamily: theme.fonts.editorial,
      fontStyle: 'italic',
      fontSize: 11,
    },
    promises: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    promise: { alignItems: 'center', flexDirection: 'row', gap: 6 },
    promiseText: { color: c.muted, fontSize: 9 },
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
    searchInput: { flex: 1, color: c.text, fontSize: 12, minHeight: 48 },
  });
};

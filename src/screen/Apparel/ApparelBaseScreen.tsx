import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { parseSizes } from '@/api/apparelModels';
import { useApparelStore } from '@/store/apparelStore';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { BaseCard, SizePicker } from './components/BasePicker';
import { useApparelSelection } from './useApparelSelection';

const GAP = 12;

/**
 * Create your own apparel: choose the company product to design on (e.g. Black Essential
 * Hoodie), then an available size, then continue to the Apparel Studio. Nothing is
 * reserved here; stock only changes when the order is placed.
 */
export default function ApparelBaseScreen() {
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const { categoryId = '', baseProductId, edit } =
    useLocalSearchParams<{ categoryId: string; baseProductId?: string; edit?: string }>();
  const draft = useApparelStore();
  const { category, categoryResult, bases, basesResult, base, size } = useApparelSelection(categoryId);

  useEffect(() => {
    if (!category) return;
    // Another category starts a fresh draft; the same one keeps its designs.
    if (edit !== '1' && useApparelStore.getState().categoryId !== category.id)
      useApparelStore.getState().start(category.id, `My ${category.name}`);
    if (baseProductId) useApparelStore.getState().setBase(baseProductId);
  }, [category, baseProductId, edit]);

  if (!category || (!bases.length && (basesResult.loading || basesResult.error)))
    return (
      <Page>
        <Header title="Choose your base" back />
        <CatalogState loading={categoryResult.loading || basesResult.loading}
          error={categoryResult.error || basesResult.error}
          empty="This collection is unavailable." retry={basesResult.retry} />
      </Page>
    );

  const sizes = base ? parseSizes(base.sizes) : [];
  const needsSize = sizes.length > 0;
  const blocker = !base ? 'Choose your base' : needsSize && !size ? 'Choose a size' : null;
  const tileWidth = (Math.min(width, 760) - 44 - GAP) / 2;

  return (
    <Page
      style={{ gap: 18 }}
      footer={
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={ui.between}>
              <Text style={ui.caption} numberOfLines={1}>
                {blocker ?? [base!.name, size].filter(Boolean).join(' · ')}
              </Text>
              {base && <Text style={styles.total}>{money(base.price)}</Text>}
            </View>
            <Button
              title={blocker ?? (edit === '1' ? 'Done' : 'Continue to Apparel Studio')}
              icon={blocker || edit === '1' ? undefined : 'color-palette-outline'}
              disabled={!!blocker}
              onPress={() => (edit === '1' ? router.back() : router.push('/apparel-studio'))}
            />
          </View>
        </SafeAreaView>
      }
    >
      <Header title="Choose your base" subtitle={category.name} back />
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>Start from a piece you love</Text>
        <Text style={ui.body}>
          Pick the {category.name.toLowerCase()} you want to design on, then its size. Your logos and
          artwork are added in the studio.
        </Text>
      </View>

      {bases.length ? (
        <View style={styles.grid}>
          {bases.map((entry) => (
            <BaseCard key={entry.id} product={entry} width={tileWidth} selected={entry.id === base?.id}
              onPress={() => draft.setBase(entry.id)} />
          ))}
        </View>
      ) : (
        <Text style={ui.body}>
          No {category.name.toLowerCase()} are available to design on yet. Please check back soon.
        </Text>
      )}

      {base && needsSize && (
        <View style={styles.section}>
          <View style={ui.between}>
            <Text style={styles.label}>Size</Text>
            {size && <Text style={styles.value}>{size}</Text>}
          </View>
          <SizePicker sizes={sizes} value={size} onChange={draft.setSize} />
          <Text style={ui.caption}>Your size is only reserved when you place the order.</Text>
        </View>
      )}
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 26, lineHeight: 32 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    section: {
      gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    label: { color: c.text, fontSize: 15, fontWeight: '600' },
    value: { color: c.accent, fontSize: 13, fontWeight: '600' },
    footer: { borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bottomBar },
    footerInner: {
      width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 10, gap: 8,
    },
    total: { color: c.text, fontSize: 20, fontWeight: '600' },
  });
};

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { CatalogState } from '@/components/products/CatalogState';
import { useCreateProductMutation } from '@/api/endpoints/productSlice';
import { apiError } from '@/api/apiSlice';
import { useApparelStore } from '@/store/apparelStore';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { saveApparelDesign } from '@/services/apparelDesign';
import { type Theme } from '@/constants/theme';
import { ColourPicker, SizePicker } from './components/GarmentPicker';
import { missingOption, OptionControls } from './components/StudioControls';
import { useApparelSelection } from './useApparelSelection';

/** A garment's page: its photos, colour, size and options, then design it or order it plain. */
export default function ApparelOptionsScreen() {
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const { categoryId = '', garmentId, edit } =
    useLocalSearchParams<{ categoryId: string; garmentId?: string; edit?: string }>();
  const draft = useApparelStore();
  const { category, categoryResult, garmentsResult, garment, variant, price } = useApparelSelection(categoryId);
  const [colour, setColour] = useState<string | null>(variant?.colorValue ?? null);
  const [photo, setPhoto] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useFeedbackState();
  const [createProduct] = useCreateProductMutation();
  const options = category?.options ?? [];

  useEffect(() => {
    if (!category) return;
    // Another category starts a fresh draft; the same one keeps its designs.
    if (edit !== '1' && useApparelStore.getState().categoryId !== category.id)
      useApparelStore.getState().start(category.id, `My ${category.name}`);
    if (garmentId) useApparelStore.getState().setGarment(garmentId);
  }, [category, garmentId, edit]);

  if (!category || !garment)
    return (
      <Page>
        <Header title="Customize" back />
        <CatalogState loading={categoryResult.loading || garmentsResult.loading}
          error={categoryResult.error || garmentsResult.error}
          empty="This piece is no longer available." retry={garmentsResult.retry} />
      </Page>
    );

  // The images the admin uploaded, shown exactly as uploaded.
  const photos = [
    { label: 'Photo', url: garment.imageUrl },
    { label: 'Front', url: garment.frontImageUrl },
    { label: 'Back', url: garment.backImageUrl },
  ].filter((entry, index, all): entry is { label: string; url: string } =>
    !!entry.url && all.findIndex((other) => other.url === entry.url) === index);
  const shown = photos[Math.min(photo, Math.max(photos.length - 1, 0))];
  const imageSize = Math.min(width - 44, 340);
  const shownColour = colour ?? variant?.colorValue ?? null;
  const sizes = garment.variants.filter((entry) => entry.colorValue === shownColour);
  const missing = variant ? missingOption(options, draft.selectedOptions) : null;
  const ready = !!variant && variant.stock > 0 && !missing;
  const designs = draft.placements.length;
  const blocker = !shownColour ? 'Choose a colour' : !variant ? 'Choose a size'
    : missing ? `Choose ${missing.name.toLowerCase()}` : null;

  async function orderPlain() {
    const user = useAuthStore.getState().user;
    if (!user) { router.push('/login'); return; }
    if (!ready || busy || !category) return;
    setBusy(true);
    setError('');
    try {
      const product = await saveApparelDesign(user.id, category.id, async () => '',
        (formData) => createProduct(formData).unwrap(), true);
      useCommerceStore.getState().setCheckout(user.id, product);
      router.push('/checkout');
    } catch (failure) {
      setError(apiError(failure).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page
      style={{ gap: 18 }}
      footer={
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={ui.between}>
              <Text style={ui.caption} numberOfLines={1}>
                {blocker ?? `${variant!.colorName} · ${variant!.size}`}
              </Text>
              <Text style={styles.total}>{money(price)}</Text>
            </View>
            {edit === '1' ? (
              <Button title={blocker ?? 'Done'} onPress={() => router.back()} disabled={!ready} />
            ) : (
              <View style={styles.actions}>
                <View style={{ flex: 1 }}>
                  <Button title={busy ? 'Preparing…' : 'Order plain'} secondary loading={busy}
                    disabled={!ready || busy} onPress={() => void orderPlain()} />
                </View>
                <View style={{ flex: 1.3 }}>
                  <Button title={designs ? `Designs (${designs})` : 'Design it'} icon="color-palette-outline"
                    disabled={!ready || busy} onPress={() => router.push('/apparel-studio')} />
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      }
    >
      <Header title={garment.name} subtitle={category.name} back />

      <View style={{ gap: 10 }}>
        <View style={[styles.photo, { width: imageSize, height: imageSize }]}>
          <CatalogImage imageUrl={shown?.url} name={garment.name} size={imageSize - 16} />
        </View>
        {photos.length > 1 && (
          <View style={styles.thumbs}>
            {photos.map((entry, index) => (
              <Pressable key={entry.url} accessibilityRole="button" accessibilityLabel={`Show ${entry.label}`}
                accessibilityState={{ selected: index === photo }} onPress={() => setPhoto(index)}
                style={[styles.thumb, index === photo && styles.thumbActive]}>
                <CatalogImage imageUrl={entry.url} name={entry.label} size={50} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: 4 }}>
        <Text style={styles.name}>{garment.name}</Text>
        <Text style={styles.price}>{money(price)}</Text>
      </View>

      <View style={styles.section}>
        <View style={ui.between}>
          <Text style={styles.label}>Colour</Text>
          {shownColour && (
            <Text style={styles.value}>
              {garment.variants.find((entry) => entry.colorValue === shownColour)?.colorName}
            </Text>
          )}
        </View>
        <ColourPicker variants={garment.variants} value={shownColour}
          onChange={(value) => { setColour(value); draft.setVariant(null); }} />
        <View style={styles.divider} />
        <View style={ui.between}>
          <Text style={styles.label}>Size</Text>
          {variant && <Text style={styles.value}>{variant.size}</Text>}
        </View>
        {shownColour ? (
          <SizePicker variants={sizes} value={variant?.id ?? null} onChange={(entry) => draft.setVariant(entry.id)} />
        ) : (
          <Text style={ui.caption}>Choose a colour to see the available sizes.</Text>
        )}
      </View>

      {options.length > 0 && (
        <OptionControls options={options} values={draft.selectedOptions} onChange={draft.setOption} />
      )}
      {!!garment.description && <Text style={ui.body}>{garment.description}</Text>}
      <Text style={ui.caption}>
        Order it plain, or add designs, lettering, logos or your own artwork in the studio. Pay cash on delivery.
      </Text>
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
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
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 26, lineHeight: 32 },
    price: { color: c.gold, fontSize: 18, fontWeight: '700' },
    section: {
      gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    divider: { height: 1, backgroundColor: c.border },
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

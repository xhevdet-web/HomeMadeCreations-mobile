import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActionFooter } from '@/components/checkout/ActionFooter';
import { Header, Notice, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { cm } from '@/helper/jewelry';
import {
  artworkOf, MAX_STICKER_MM, parseStickerSize, STICKER_SHAPES, stickerSizeLine, type StickerShape, type StickerSize,
} from '@/helper/stickers';
import { useStickerStore } from '@/store/stickerStore';
import { useFreshStickerSet } from '@/hooks/useFreshStickerSet';
import { StickerShapeSelector } from './components/StickerShapeSelector';
import { StickerSizeSelector } from './components/StickerSizeSelector';

/**
 * Stickers, step 1: the shape and size of the set. Only what the workshop offers (the
 * category's sizes) can be chosen. Opened again from the studio (`edit`), it keeps the
 * designs and asks before re-fitting them to another shape or size.
 */
export default function StickerSetupScreen() {
  const { t } = useTranslation();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { categoryId = '', edit } = useLocalSearchParams<{ categoryId: string; edit?: string }>();
  const category = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId, { skip: !categoryId }));
  useFreshStickerSet();
  const draft = useStickerStore();
  const continuing = draft.categoryId === categoryId;
  // A set left in progress (saved or not) is kept; the customer may start a new one instead.
  const inProgress = continuing && !edit ? draft.designs.filter((design) => artworkOf(design)).length : 0;

  function startNew() {
    Alert.alert(t('stickers.setup.startNewTitle'), t('stickers.setup.startNewMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('stickers.setup.startNew'), style: 'destructive',
        onPress: () => useStickerStore.getState().startOver(t('stickers.defaultName')) },
    ]);
  }
  const sizes = (category.data?.sizes ?? []).flatMap((size) => parseStickerSize(size) ?? []);
  const shapes = STICKER_SHAPES.filter((shape) => sizes.some((size) => size.shape === shape));
  const current = continuing ? draft.size : null;
  const [shape, setShape] = useState<StickerShape | null>(current?.shape ?? null);
  const [sizeId, setSizeId] = useState<string | null>(current?.id ?? null);
  const activeShape = shape && shapes.includes(shape) ? shape : shapes[0] ?? null;
  const shapeSizes = sizes.filter((size) => size.shape === activeShape);
  const chosen = shapeSizes.find((size) => size.id === sizeId) ?? null;

  function chooseShape(next: StickerShape) {
    setShape(next);
    // Keep the size when it exists in the new shape too; otherwise pick again.
    if (!sizes.some((size) => size.id === sizeId && size.shape === next)) setSizeId(null);
  }

  function apply(size: StickerSize) {
    if (!continuing) useStickerStore.getState().start(categoryId, t('stickers.defaultName'));
    useStickerStore.getState().setSize(size);
    if (edit) router.back();
    else router.push('/sticker-studio');
  }

  function next() {
    if (!chosen) return;
    const previous = continuing ? draft.size : null;
    const changed = previous && (previous.shape !== chosen.shape || previous.widthMm !== chosen.widthMm
      || previous.heightMm !== chosen.heightMm);
    const placed = continuing && draft.designs.some((design) => design.imageUri);
    if (changed && placed) {
      // The images stay; only their position and zoom are reset for the new outline.
      Alert.alert(t('stickers.setup.changeTitle'), t('stickers.setup.changeMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('stickers.setup.changeConfirm'), onPress: () => apply(chosen) },
      ]);
      return;
    }
    apply(chosen);
  }

  if (!category.data)
    return (
      <Page>
        <Header title={t('stickers.setup.title')} back />
        <CatalogState loading={category.loading} error={category.error} empty={t('category.unavailable')}
          retry={category.retry} />
      </Page>
    );

  return (
    <Page style={{ gap: 22 }}
      footer={shapes.length ? (
        <ActionFooter caption={chosen ? stickerSizeLine(t, chosen) : t('stickers.setup.pickSize')}
          title={edit ? t('stickers.setup.apply') : t('common.continue')} onPress={next} disabled={!chosen} />
      ) : undefined}>
      <Header title={t('stickers.setup.title')} back />
      <View style={{ gap: 6 }}>
        <Text style={ui.eyebrow}>{t('stickers.eyebrow')}</Text>
        <Text style={styles.title}>{t('stickers.setup.heading')}</Text>
        <Text style={ui.body}>{t('stickers.setup.intro')}</Text>
      </View>

      {inProgress > 0 && (
        <View style={styles.progress}>
          <Text style={[ui.body, { flex: 1 }]}>
            {t('stickers.setup.inProgress', { count: inProgress })}
          </Text>
          <Pressable accessibilityRole="button" onPress={startNew} hitSlop={8}>
            <Text style={ui.textLink}>{t('stickers.setup.startNew')}</Text>
          </Pressable>
        </View>
      )}

      {!shapes.length ? (
        <Notice text={t('stickers.setup.noSizes')} />
      ) : (
        <>
          <View style={{ gap: 12 }}>
            <Text style={styles.step}>{t('stickers.setup.shapeTitle')}</Text>
            <StickerShapeSelector shapes={shapes} selected={activeShape} onSelect={chooseShape} />
          </View>
          <View style={{ gap: 12 }}>
            <Text style={styles.step}>{t('stickers.setup.sizeTitle')}</Text>
            <StickerSizeSelector sizes={shapeSizes} selectedId={chosen?.id ?? null}
              onSelect={(size) => setSizeId(size.id)} />
            <Text style={ui.caption}>
              {t('stickers.maxSize', { size: t('stickers.dimensions', { width: cm(MAX_STICKER_MM),
                height: cm(MAX_STICKER_MM) }) })}
            </Text>
          </View>
        </>
      )}
    </Page>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  title: { color: theme.colors.text, fontFamily: theme.fonts.editorial, fontSize: 28, lineHeight: 34 },
  step: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  progress: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
  },
});

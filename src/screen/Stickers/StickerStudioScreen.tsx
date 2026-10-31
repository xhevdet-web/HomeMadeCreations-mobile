import { useCallback, useRef, useState, type ComponentRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, IconButton, Notice, Page, useUI } from '@/components/common/ui';
import { StageBackground } from '@/components/common/StageBackground';
import { CatalogState } from '@/components/products/CatalogState';
import { CatalogImage } from '@/components/products/CatalogImage';
import type { PickerDrag } from '@/components/studio/ComponentPicker';
import { useGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogComponent } from '@/api/catalogModels';
import { CUSTOM_UPLOAD } from '@/api/builderModels';
import { toast } from '@/store/toastStore';
import { useStickerStore } from '@/store/stickerStore';
import { useFreshStickerSet } from '@/hooks/useFreshStickerSet';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { DEFAULT_TRANSFORM, type Size } from '@/helper/caseStudio';
import {
  artworkOf, fitOf, isLowQualitySticker, LIBRARY_DESIGN_SCALE, stickerAspect, stickerSizeLine,
} from '@/helper/stickers';
import { designWithoutImage } from '@/services/stickerDesign';
import { StickerCanvas } from './components/StickerCanvas';
import { StickerDesignPicker } from './components/StickerDesignPicker';
import { StickerDesignTabs } from './components/StickerDesignTabs';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const GHOST = 72;
type Rect = { x: number; y: number; width: number; height: number };

/**
 * Stickers, step 2: 1–5 designs in the set's shape and size. Each design is one image, the
 * customer's upload or one of our designs (tapped, or held and dragged onto the sticker),
 * fitted inside the sticker (drag, pinch, rotate). Every design keeps its own image and
 * placement while the customer moves between them.
 */
export default function StickerStudioScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width, height } = useWindowDimensions();
  useFreshStickerSet();
  const draft = useStickerStore();
  const categoryId = draft.categoryId ?? '';
  const components = useApiResult<CatalogComponent[]>(
    useGetCategoryComponentsQuery(categoryId, { skip: !categoryId }));
  const [busy, setBusy] = useState(false);
  const artwork = components.data?.find((item) => item.type?.toUpperCase() === CUSTOM_UPLOAD && item.isActive);
  // Our designs: the category's other SubCategories, while active and available.
  const library = (components.data ?? []).filter((item) => item.type?.toUpperCase() !== CUSTOM_UPLOAD
    && item.isActive && !!item.imageUrl && (item.trackStock === false || item.stock > 0));
  const size = draft.size;
  const index = Math.max(draft.designs.findIndex((design) => design.id === draft.activeId), 0);
  const design = draft.designs[index];
  const onImageSize = useCallback((imageSize: Size) => {
    const id = useStickerStore.getState().activeId;
    if (id) useStickerStore.getState().setImageSize(id, imageSize);
  }, []);
  // Dragging one of our designs: a floating copy follows the finger; dropped on the
  // sticker, it lands where it was let go.
  const screenRef = useRef<ComponentRef<typeof View>>(null);
  const canvasRef = useRef<ComponentRef<typeof View>>(null);
  const canvasRect = useRef<Rect | null>(null);
  const [dragging, setDragging] = useState<CatalogComponent | null>(null);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const screenX = useSharedValue(0);
  const screenY = useSharedValue(0);
  const ghostStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value - screenX.value - GHOST / 2 },
      { translateY: dragY.value - screenY.value - GHOST / 2 }],
  }));

  if (!size || !design)
    return (
      <Page style={{ gap: 16 }}>
        <Header title={t('stickers.studio.title')} back />
        <Notice text={t('stickers.errors.chooseSize')} />
        <Button title={t('stickers.setup.title')} onPress={() => router.replace({
          pathname: '/sticker-setup', params: { categoryId } })} />
      </Page>
    );

  const aspect = stickerAspect(size);
  // The sticker gets the stage; tall shapes are limited by height, wide ones by width.
  const budget = Math.min(height * 0.42, 420);
  const canvasWidth = Math.min(budget / aspect, Math.min(width, 760) - 80, 420);
  // Only uploads are checked: our designs are prepared for print.
  const lowQuality = !!design.imageUri && isLowQualitySticker(design.imageSize, size, design.scale);
  const picture = artworkOf(design);
  const ourDesignId = design.imageUri ? null : design.subCategoryId;

  /** Puts one of our designs on the open sticker, centred or where it was dropped. */
  function choose(chosen: CatalogComponent, at?: { x: number; y: number }) {
    if (!chosen.imageUrl) return;
    useStickerStore.getState().setImage(design.id,
      { subCategoryId: chosen.id, designImageUrl: chosen.imageUrl, imageSize: null },
      { scale: LIBRARY_DESIGN_SCALE, ...at });
  }

  const drag: PickerDrag = {
    onDragStart: (chosen, x, y) => {
      dragX.set(x);
      dragY.set(y);
      screenRef.current?.measureInWindow((left, top) => { screenX.set(left); screenY.set(top); });
      canvasRef.current?.measureInWindow((left, top, w, h) => { canvasRect.current = { x: left, y: top, width: w, height: h }; });
      setDragging(chosen);
    },
    onDragMove: (x, y) => { dragX.set(x); dragY.set(y); },
    onDragEnd: (chosen, x, y, canceled) => {
      setDragging(null);
      const rect = canvasRect.current;
      if (canceled || !rect) return;
      const px = (x - rect.x) / rect.width;
      const py = (y - rect.y) / rect.height;
      if (px < 0 || px > 1 || py < 0 || py > 1) return;
      choose(chosen, { x: px, y: py });
    },
  };
  const changeSize = () => router.push({ pathname: '/sticker-setup', params: { categoryId, edit: '1' } });

  async function upload() {
    if (!artwork || busy) return;
    setBusy(true);
    try {
      // The system photo picker needs no permission prompt. Re-encoding at 0.8 turns HEIC
      // into JPEG and keeps phone photos well under the 5 MB upload limit.
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset) return;
      if (!isSupportedPhoto(asset)) { toast.error(t('stickers.studio.unsupportedImage')); return; }
      if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) { toast.error(t('stickers.studio.imageTooLarge')); return; }
      // Only this design changes; a failed pick above leaves every design as it was.
      useStickerStore.getState().setImage(design.id, {
        subCategoryId: artwork.id,
        imageUri: asset.uri,
        imageSize: asset.width && asset.height ? { width: asset.width, height: asset.height } : null,
      });
    } catch {
      toast.error(t('stickers.studio.pickFailed'));
    } finally {
      setBusy(false);
    }
  }

  function step(patch: { scale?: number; rotation?: number }) {
    draft.transform(design.id, {
      ...design,
      scale: design.scale * (patch.scale ?? 1),
      rotation: design.rotation + (patch.rotation ?? 0),
    });
  }

  function remove() {
    const last = draft.designs.length === 1;
    Alert.alert(
      t(last ? 'stickers.studio.removeImageTitle' : 'stickers.studio.removeDesignTitle', { number: index + 1 }),
      t(last ? 'stickers.studio.removeImageMessage' : 'stickers.studio.removeDesignMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => draft.removeDesign(design.id) },
      ],
    );
  }

  function preview() {
    const missing = designWithoutImage(draft.designs);
    if (missing) {
      // Open the design that still needs an image rather than dropping it silently.
      draft.select(missing.id);
      toast.info(t('stickers.errors.addImage', { number: draft.designs.indexOf(missing) + 1 }));
      return;
    }
    router.push('/sticker-preview');
  }

  return (
    <View ref={screenRef} collapsable={false} style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <Page scroll={false} style={{ padding: 0, gap: 0 }}
      footer={
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={{ flex: 1 }}>
              <Text style={ui.caption} numberOfLines={1}>{t('stickers.studio.setOf')}</Text>
              <Text style={styles.footerValue}>{t('stickers.designCount', { count: draft.designs.length })}</Text>
            </View>
            <Button title={t('stickers.studio.preview')} icon="eye-outline" onPress={preview} />
          </View>
        </SafeAreaView>
      }>
      <View style={styles.headerWrap}>
        <Header title={t('stickers.studio.title')} back />
      </View>
      <View style={styles.sizeRow}>
        <Text style={styles.sizeLine} numberOfLines={1}>{stickerSizeLine(t, size)}</Text>
        <Pressable accessibilityRole="button" onPress={changeSize} hitSlop={8}>
          <Text style={ui.textLink}>{t('stickers.studio.changeSize')}</Text>
        </Pressable>
      </View>

      <View style={[styles.stage, dragging && styles.dropTarget]}>
        <StageBackground />
        <Text style={styles.counter} accessibilityRole="header">
          {t('stickers.studio.designOf', { number: index + 1, count: draft.designs.length })}
        </Text>
        <View ref={canvasRef} collapsable={false}>
          <StickerCanvas key={design.id} size={size} width={canvasWidth} imageUri={picture} fit={fitOf(design)}
            imageSize={design.imageSize} transform={picture ? design : DEFAULT_TRANSFORM} editable guides
            onChange={(next) => draft.transform(design.id, next)}
            onAdd={artwork ? () => void upload() : undefined} onImageSize={onImageSize}
            onImageError={() => toast.error(t('stickers.studio.imageFailed'))} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {components.loading || components.error ? (
          <CatalogState loading={components.loading} error={components.error} empty="" retry={components.retry} />
        ) : !artwork && !library.length ? (
          <Notice text={t('stickers.studio.uploadsUnavailable')} />
        ) : !picture ? (
          artwork ? (
            <View style={{ gap: 8 }}>
              <Button title={t('stickers.studio.upload')} icon="images-outline" loading={busy}
                onPress={() => void upload()} />
              <Text style={[ui.caption, { textAlign: 'center' }]}>{t('stickers.studio.uploadHint')}</Text>
            </View>
          ) : null
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={[ui.caption, { textAlign: 'center' }]}>{t('stickers.studio.gestureHint')}</Text>
            <View style={styles.tools}>
              <IconButton name="remove-outline" label={t('cases.studio.zoomOut')} onPress={() => step({ scale: 0.9 })} />
              <IconButton name="add-outline" label={t('cases.studio.zoomIn')} onPress={() => step({ scale: 1.1 })} />
              <IconButton name="arrow-undo-outline" label={t('cases.studio.rotateLeft')}
                onPress={() => step({ rotation: -15 })} />
              <IconButton name="arrow-redo-outline" label={t('cases.studio.rotateRight')}
                onPress={() => step({ rotation: 15 })} />
              <IconButton name="trash-outline" label={t('stickers.studio.removeDesignTitle', { number: index + 1 })}
                onPress={remove} />
            </View>
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button title={t('stickers.studio.reset')} icon="refresh-outline" secondary
                  onPress={() => draft.reset(design.id)} />
              </View>
              {artwork && (
                <View style={{ flex: 1 }}>
                  <Button title={t(design.imageUri ? 'stickers.studio.replace' : 'stickers.studio.useOwnImage')}
                    icon="images-outline" secondary loading={busy} onPress={() => void upload()} />
                </View>
              )}
            </View>
            {lowQuality && (
              <View style={[styles.warning, { borderColor: theme.colors.danger }]} accessibilityRole="alert">
                <Text style={[ui.label, { color: theme.colors.danger }]}>{t('cases.studio.lowQuality')}</Text>
                <Text style={ui.caption}>{t('stickers.studio.lowQualityDescription')}</Text>
              </View>
            )}
          </View>
        )}
        {!components.loading && library.length > 0 && (
          <StickerDesignPicker designs={library} selectedId={ourDesignId} onChoose={(chosen) => choose(chosen)}
            drag={drag} />
        )}
        <Text style={[ui.caption, { textAlign: 'center' }]}>{t('stickers.studio.safeArea')}</Text>
        <StickerDesignTabs designs={draft.designs} activeId={design.id} onSelect={draft.select}
          onAdd={draft.addDesign} />
      </ScrollView>
    </Page>
      {dragging && (
        <Animated.View pointerEvents="none" style={[styles.ghost, ghostStyle]}>
          <CatalogImage imageUrl={dragging.imageUrl} name={dragging.name} size={GHOST - 12} />
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    headerWrap: { paddingHorizontal: 22, paddingTop: 4 },
    sizeRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingBottom: 8,
      width: '100%', maxWidth: 760, alignSelf: 'center',
    },
    sizeLine: { flex: 1, color: c.text, fontSize: 16, fontWeight: '600' },
    stage: {
      marginHorizontal: 16, paddingVertical: 16, gap: 12, borderRadius: 28, overflow: 'hidden',
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border,
      backgroundColor: c.thumbnail,
    },
    counter: { color: c.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
    dropTarget: { borderColor: c.accent, borderWidth: 2 },
    ghost: {
      position: 'absolute', left: 0, top: 0, width: GHOST, height: GHOST, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.accent,
      backgroundColor: c.badge,
      elevation: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
    },
    content: {
      paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, gap: 16, width: '100%', maxWidth: 760,
      alignSelf: 'center',
    },
    tools: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
    actions: { flexDirection: 'row', gap: 10 },
    warning: { gap: 2, padding: 12, borderRadius: 14, borderWidth: 1, backgroundColor: c.surface },
    footer: { borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bottomBar },
    footerInner: {
      flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', maxWidth: 760,
      alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 10,
    },
    footerValue: { color: c.text, fontSize: 18, fontWeight: '600' },
  });
};

/** JPEG, PNG or WebP by type, else by file name; the API checks the file itself too. */
function isSupportedPhoto(asset: ImagePicker.ImagePickerAsset) {
  if (asset.mimeType) return PHOTO_TYPES.includes(asset.mimeType.toLowerCase());
  return /\.(jpe?g|png|webp)$/i.test(asset.fileName ?? asset.uri.split('?')[0]);
}

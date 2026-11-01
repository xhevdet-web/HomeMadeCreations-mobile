import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, IconButton, Notice, Page, useUI } from '@/components/common/ui';
import { StageBackground } from '@/components/common/StageBackground';
import { CatalogImage } from '@/components/products/CatalogImage';
import { CatalogState } from '@/components/products/CatalogState';
import type { PickerDrag } from '@/components/studio/ComponentPicker';
import { DesignLibraryPicker } from '@/components/studio/DesignLibraryPicker';
import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useGetProductsQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory, CatalogComponent } from '@/api/catalogModels';
import type { SavedProduct } from '@/api/commerceModels';
import { CUSTOM_UPLOAD } from '@/api/builderModels';
import { toast } from '@/store/toastStore';
import { useMugStore, type MugImage } from '@/store/mugStore';
import { useFreshMugDesign } from '@/hooks/useFreshStickerSet';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { money } from '@/helper/pricing';
import type { Size } from '@/helper/caseStudio';
import { fitInside, isLowQualityElement, MAX_MUG_ELEMENTS, mugPrintArea, type MugPrintArea } from '@/helper/mugs';
import { TextTool, type TextLook } from '@/screen/CreativeStudio/components/TextTool';
import { MugEditor, mugGeometry, MUG_VIEWS, type MugView } from './components/MugEditor';
import { MugLayers } from './components/MugLayers';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const GHOST = 72;
type Rect = { x: number; y: number; width: number; height: number };

/**
 * Mugs, the studio: ONE design on the flat print of the company's white mug, made of up
 * to five images (uploads or our designs, tapped or dragged onto the print). Each image
 * moves, zooms and rotates on its own, with layers, duplicate and undo. The mug preview
 * comes next.
 */
export default function MugStudioScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  useFreshMugDesign();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const draft = useMugStore();
  const categoryId = params.categoryId || draft.categoryId || '';
  const category = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId, { skip: !categoryId }));
  const products = useApiResult<SavedProduct[]>(
    useGetProductsQuery({ categoryId, origin: 'COMPANY' }, { skip: !categoryId }));
  const components = useApiResult<CatalogComponent[]>(
    useGetCategoryComponentsQuery(categoryId, { skip: !categoryId }));
  // The one blank mug: the mug product with a print area (the others are ready-made).
  const blank = products.data?.find((product) => product.isActive !== false && mugPrintArea(product));
  const area = mugPrintArea(blank);
  const upload = components.data?.find((item) => item.type?.toUpperCase() === CUSTOM_UPLOAD && item.isActive);
  const library = (components.data ?? []).filter((item) => item.type?.toUpperCase() !== CUSTOM_UPLOAD
    && item.isActive && !!item.imageUrl && (item.trackStock === false || item.stock > 0));
  const [busy, setBusy] = useState(false);
  // The side of the mug being designed; positions are always on the whole print.
  const [view, setView] = useState<MugView>('FRONT');
  // One image per mug: its controls are always shown, and a new image takes its place.
  const single = MAX_MUG_ELEMENTS === 1;
  const selectedText = draft.texts.find((text) => text.id === draft.selectedId) ?? null;
  const selected = draft.elements.find((element) => element.id === draft.selectedId)
    ?? (single && !selectedText ? draft.elements[0] ?? null : null);
  const full = draft.elements.length >= MAX_MUG_ELEMENTS;
  const areaRef = useRef<MugPrintArea | null>(null);
  useEffect(() => { areaRef.current = area; });
  const onImageSize = useCallback((id: string, size: Size) => useMugStore.getState().setImageSize(id, size,
    (element) => (areaRef.current ? fitInside(element, areaRef.current, size) : element)), []);

  // A design belongs to its category and mug; another category starts a new one.
  useEffect(() => {
    if (!blank || !categoryId) return;
    const state = useMugStore.getState();
    if (state.categoryId !== categoryId) state.start(categoryId, blank.id, t('mugs.defaultName'));
    else if (state.baseProductId !== blank.id) state.setBase(blank.id);
  }, [blank, categoryId, t]);

  // Dragging one of our designs: a floating copy follows the finger and lands where dropped.
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

  if (!category.data || !products.data)
    return (
      <Page>
        <Header title={t('mugs.studio.title')} back />
        <CatalogState loading={category.loading || products.loading} error={category.error || products.error}
          empty={t('category.unavailable')} retry={products.retry} />
      </Page>
    );

  if (!blank || !area)
    return (
      <Page style={{ gap: 16 }}>
        <Header title={t('mugs.studio.title')} back />
        <Notice text={t('mugs.errors.notReady')} />
      </Page>
    );

  const editorWidth = Math.min(width, 760) - 60;
  const geometry = mugGeometry(area, editorWidth, view);
  const lowQuality = !!selected?.imageUri && isLowQualityElement(selected.imageSize, area, selected.scale);

  /** Straight, at its size and inside the dashed area, as near to `x`/`y` as it fits. */
  const placed = (image: MugImage, x: number, y: number) =>
    fitInside({ x, y, scale: 1, rotation: 0 }, area, image.imageSize);

  function add(image: MugImage, at?: { x: number; y: number }) {
    const state = useMugStore.getState();
    const current = state.elements[0];
    if (single && current) {
      // The new image replaces the mug's image where it was dropped or where the old one
      // was (one undo step).
      state.replace(current.id, image, placed(image, at?.x ?? current.x, at?.y ?? current.y));
      state.select(current.id);
      return;
    }
    // New images land in the middle of the side being viewed, or where they were dropped.
    if (state.add(image, placed(image, at?.x ?? geometry.centre, at?.y ?? 0.5), geometry.centre) === null)
      toast.info(t('mugs.studio.full', { count: MAX_MUG_ELEMENTS }));
  }

  /** Adds an upload, or replaces the selected image with one. */
  async function pick(replace: boolean) {
    if (!upload || busy) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset) return;
      if (!isSupportedPhoto(asset)) { toast.error(t('mugs.studio.unsupportedImage')); return; }
      if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) { toast.error(t('mugs.studio.imageTooLarge')); return; }
      // Only this image changes; a failed pick above leaves the design as it was.
      const image: MugImage = {
        subCategoryId: upload.id,
        imageUri: asset.uri,
        imageSize: asset.width && asset.height ? { width: asset.width, height: asset.height } : null,
      };
      const target = useMugStore.getState().elements.find((element) => element.id === useMugStore.getState().selectedId);
      if (replace && target) useMugStore.getState().replace(target.id, image, placed(image, target.x, target.y));
      else add(image);
    } catch {
      toast.error(t('mugs.studio.pickFailed'));
    } finally {
      setBusy(false);
    }
  }

  const designImage = (design: CatalogComponent): MugImage =>
    ({ subCategoryId: design.id, designImageUrl: design.imageUrl ?? undefined, imageSize: null });

  const drag: PickerDrag = {
    onDragStart: (design, x, y) => {
      dragX.set(x);
      dragY.set(y);
      screenRef.current?.measureInWindow((left, top) => { screenX.set(left); screenY.set(top); });
      canvasRef.current?.measureInWindow((left, top, w, h) => { canvasRect.current = { x: left, y: top, width: w, height: h }; });
      setDragging(design);
    },
    onDragMove: (x, y) => { dragX.set(x); dragY.set(y); },
    onDragEnd: (design, x, y, canceled) => {
      setDragging(null);
      const rect = canvasRect.current;
      if (canceled || !rect) return;
      // Dropped on the mug: from stage points to a position on the whole print.
      const inStage = x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
      const px = (x - rect.x - geometry.frame.left) / geometry.frame.width;
      const py = (y - rect.y - geometry.frame.top) / geometry.frame.height;
      if (!inStage || px < 0 || px > 1 || py < 0 || py > 1) return;
      add(designImage(design), { x: px, y: py });
    },
  };

  function step(patch: { scale?: number; rotation?: number }) {
    if (!selected || !area) return;
    draft.update(selected.id, fitInside({
      ...selected,
      scale: selected.scale * (patch.scale ?? 1),
      rotation: selected.rotation + (patch.rotation ?? 0),
    }, area, selected.imageSize));
  }

  /** New text in the middle of the side being viewed; it stays inside the dashed area. */
  function addText(text: string, look: TextLook) {
    draft.addText({ text, x: geometry.centre, y: 0.5, scale: look.scale, rotation: 0, font: look.font,
      color: look.color, weight: look.weight, italic: look.italic });
  }

  const index = selected ? draft.elements.indexOf(selected) : -1;

  return (
    <View ref={screenRef} collapsable={false} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Page scroll={false} style={{ padding: 0, gap: 0 }}
        footer={
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <View style={styles.footerInner}>
              <View style={{ flex: 1 }}>
                <Text style={ui.caption} numberOfLines={1}>{t('mugs.studio.priceLabel')}</Text>
                <Text style={styles.footerValue}>{money(blank.price)}</Text>
              </View>
              <Button title={t('mugs.studio.preview')} icon="cafe-outline"
                disabled={!draft.elements.length && !draft.texts.length}
                onPress={() => { draft.select(null); router.push('/mug-preview'); }} />
            </View>
          </SafeAreaView>
        }>
        <View style={styles.headerWrap}>
          <Header title={t('mugs.studio.title')} back right={
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <IconButton name="arrow-undo-outline" label={t('mugs.studio.undo')} onPress={draft.undo}
                disabled={draft.historyIndex <= 0} />
              <IconButton name="arrow-redo-outline" label={t('mugs.studio.redo')} onPress={draft.redo}
                disabled={draft.historyIndex >= draft.history.length - 1} />
            </View>
          } />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={{ gap: 4 }}>
            <Text style={styles.title}>{t('mugs.studio.heading')}</Text>
            <Text style={ui.caption}>
              {t('mugs.studio.printArea', { width: area.widthMm / 10, height: area.heightMm / 10 })}
            </Text>
          </View>

          {geometry.turns && (
            <View style={styles.views} accessibilityRole="tablist">
              {MUG_VIEWS.map((entry) => (
                <Pressable key={entry} accessibilityRole="tab" accessibilityState={{ selected: entry === view }}
                  onPress={() => setView(entry)} style={[styles.viewTab, entry === view && styles.viewTabActive]}>
                  <Text style={[styles.viewText, entry === view && styles.viewTextActive]}>
                    {t(`mugs.studio.views.${entry}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={[styles.stage, dragging && styles.dropTarget]}>
            <StageBackground />
            <View ref={canvasRef} collapsable={false}>
              <MugEditor area={area} width={editorWidth} view={view} elements={draft.elements} texts={draft.texts}
                selectedId={draft.selectedId} onSelect={draft.select} onChange={draft.update}
                onTextChange={(id, next) => draft.updateText(id, next)} onRemove={draft.remove}
                onImageSize={onImageSize} />
            </View>
          </View>
          <Text style={[ui.caption, { textAlign: 'center' }]}>{t('mugs.studio.safeArea')}</Text>
          {!single && (
            <MugLayers elements={draft.elements} selectedId={draft.selectedId} onSelect={(element) => {
              draft.select(element.id);
              setView(geometry.viewFor(element.x));
            }} />
          )}

          {selected ? (
            <View style={[ui.card, styles.controls]}>
              <Text style={ui.label}>
                {single ? t('mugs.studio.yourImage') : t('mugs.studio.selected', { number: index + 1 })}
              </Text>
              <View style={styles.tools}>
                <IconButton name="remove-outline" label={t('cases.studio.zoomOut')} onPress={() => step({ scale: 0.9 })} />
                <IconButton name="add-outline" label={t('cases.studio.zoomIn')} onPress={() => step({ scale: 1.1 })} />
                <IconButton name="refresh-outline" label={t('cases.studio.rotateRight')}
                  onPress={() => step({ rotation: 15 })} />
                {!single && (
                  <>
                    <IconButton name="arrow-up-outline" label={t('mugs.studio.forward')}
                      disabled={index >= draft.elements.length - 1} onPress={() => draft.moveLayer(selected.id, 1)} />
                    <IconButton name="arrow-down-outline" label={t('mugs.studio.backward')} disabled={index <= 0}
                      onPress={() => draft.moveLayer(selected.id, -1)} />
                  </>
                )}
              </View>
              <View style={styles.actions}>
                {upload && (
                  <View style={styles.action}>
                    <Button title={t('mugs.studio.replace')} icon="images-outline" secondary loading={busy}
                      onPress={() => void pick(true)} />
                  </View>
                )}
                {!single && (
                  <View style={styles.action}>
                    <Button title={t('mugs.studio.duplicate')} icon="copy-outline" secondary disabled={full}
                      onPress={() => draft.duplicate(selected.id)} />
                  </View>
                )}
                <View style={styles.action}>
                  <Button title={t('mugs.studio.reset')} icon="scan-outline" secondary
                    onPress={() => draft.update(selected.id,
                      fitInside({ ...selected, scale: 1, rotation: 0 }, area, selected.imageSize))} />
                </View>
                <View style={styles.action}>
                  <Button title={t('common.delete')} icon="trash-outline" secondary
                    onPress={() => draft.remove(selected.id)} />
                </View>
              </View>
              {lowQuality && (
                <View style={[styles.warning, { borderColor: theme.colors.danger }]} accessibilityRole="alert">
                  <Text style={[ui.label, { color: theme.colors.danger }]}>{t('mugs.studio.lowQuality')}</Text>
                  <Text style={ui.caption}>{t('mugs.studio.lowQualityDescription')}</Text>
                </View>
              )}
            </View>
          ) : !selectedText && (
            <Text style={[ui.caption, { textAlign: 'center' }]}>
              {draft.elements.length ? t('mugs.studio.gestureHint') : t('mugs.studio.startHint')}
            </Text>
          )}

          {/* Text: with a text selected it edits it, otherwise it adds a new line. */}
          <View style={{ gap: 8 }}>
            <Text style={styles.section}>{t('mugs.studio.textTitle')}</Text>
            <TextTool selected={selectedText} count={draft.texts.length} onAdd={addText}
              onChange={(patch, record) => selectedText && draft.updateText(selectedText.id, patch, record)}
              onRemove={() => selectedText && draft.remove(selectedText.id)} onDone={() => draft.select(null)} />
          </View>

          {components.loading || components.error ? (
            <CatalogState loading={components.loading} error={components.error} empty="" retry={components.retry} />
          ) : (
            <>
              {upload && !(single && draft.elements.length) && (
                <View style={{ gap: 6 }}>
                  <Button title={single ? t('mugs.studio.upload') : t('mugs.studio.addImage')} icon="image-outline"
                    loading={busy} disabled={full} onPress={() => void pick(false)} />
                  {!single && (
                    <Text style={[ui.caption, { textAlign: 'center' }]}>
                      {t('mugs.studio.imageCount', { count: draft.elements.length, max: MAX_MUG_ELEMENTS })}
                    </Text>
                  )}
                </View>
              )}
              {library.length > 0 && (
                <DesignLibraryPicker designs={library} selectedId={selected?.imageUri ? null : selected?.subCategoryId ?? null}
                  onChoose={(design) => add(designImage(design))} drag={drag} title={t('mugs.studio.ourDesigns')}
                  hint={t('mugs.studio.ourDesignsHint')} useLabel={(name) => t('mugs.studio.useDesign', { name })} />
              )}
              {!upload && !library.length && <Notice text={t('mugs.studio.nothingToAdd')} />}
            </>
          )}
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
    content: {
      paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28, gap: 14, width: '100%', maxWidth: 760,
      alignSelf: 'center',
    },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 24, lineHeight: 30 },
    section: { color: c.text, fontSize: 16, fontWeight: '600' },
    stage: {
      paddingVertical: 22, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border, backgroundColor: c.thumbnail,
    },
    dropTarget: { borderColor: c.accent, borderWidth: 2 },
    views: {
      flexDirection: 'row', padding: 4, gap: 4, borderRadius: 14, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface,
    },
    viewTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
    viewTabActive: { backgroundColor: c.primary },
    viewText: { color: c.text, fontSize: 13, fontWeight: '600' },
    viewTextActive: { color: c.onPrimary },
    controls: { padding: 14, gap: 12 },
    tools: { flexDirection: 'row', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    action: { flexGrow: 1, flexBasis: '45%' },
    warning: { gap: 2, padding: 12, borderRadius: 14, borderWidth: 1, backgroundColor: c.surface },
    ghost: {
      position: 'absolute', left: 0, top: 0, width: GHOST, height: GHOST, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.accent,
      backgroundColor: c.badge,
      elevation: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
    },
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

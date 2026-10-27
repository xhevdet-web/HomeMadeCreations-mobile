import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { EmptyState, Header, Icon, IconButton, Notice, Page, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { CatalogState } from '@/components/products/CatalogState';
import { ComponentPicker, remainingStock, type PickerDrag } from '@/components/studio/ComponentPicker';
import type { Transform } from '@/components/studio/PlacedItem';
import { useGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useCreateProductMutation } from '@/api/endpoints/productSlice';
import { choicePrice, sceneWrap } from '@/api/packagingModels';
import { apiError } from '@/api/apiSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogComponent } from '@/api/catalogModels';
import { CUSTOM_UPLOAD } from '@/api/builderModels';
import { useCanvasStore } from '@/store/canvasStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import {
  boundsFor, clampInside, DEFAULT_TEXT, dropPosition, groupOf, groupsFor, hasKnownGroup, pieceBox, TEXT_BOX,
  type Transform as Placement,
} from '@/helper/canvasStudio';
import { componentCount } from '@/helper/builders';
import { saveCanvasDesign } from '@/services/canvasDesign';
import { type Theme } from '@/constants/theme';
import { DesignerFooter } from '@/screen/Designer/components/DesignerFooter';
import { StageOverlay } from '@/screen/Designer/components/StageOverlay';
import { CanvasToolbar } from './components/CanvasToolbar';
import { CompositionList } from './components/CompositionList';
import { FreeDesignCanvas } from './components/FreeDesignCanvas';
import { PhotoStage } from './components/PhotoStage';
import { TextTool } from './components/TextTool';
import { useCanvasCapture } from './components/useCanvasCapture';
import { PackagingSummaryBar } from './components/packaging/PackagingSummaryBar';
import { GiftPriceSummary } from './components/packaging/GiftPriceSummary';

type Rect = { x: number; y: number; width: number; height: number };
const ALL = 'ALL';
const TEXT = 'TEXT';

// Each studio speaks the language of what is being made: canvasStudio.BOUQUET / .GIFT.

/**
 * Bouquet and Gift Studio: a free design canvas on the chosen base product. We provide
 * the materials (the category's components, with their real price and stock); the
 * customer decides where every piece goes, its size, rotation and layer order.
 */
export default function CanvasStudioScreen() {
  const theme = useTheme();
  const ui = useUI();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const { width, height } = useWindowDimensions();
  const draft = useCanvasStore();
  const builder = draft.builderType;
  const categoryId = draft.categoryId ?? '';
  const result = useApiResult<CatalogComponent[]>(useGetCategoryComponentsQuery(categoryId, { skip: !categoryId }));
  const [createProduct] = useCreateProductMutation();
  const gift = builder === 'GIFT';
  // Chosen before the studio opened; the studio draws and prices it without loading it again.
  const packaging = gift ? draft.packaging : null;
  const wrap = sceneWrap(packaging);
  const [message, setMessage] = useFeedbackState('info');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<string | null>(null);
  const [dragging, setDragging] = useState<CatalogComponent | null>(null);
  const { ref: canvasRef, exporting, capture } = useCanvasCapture();
  const screenRef = useRef<View>(null);

  // A different box shape changes where pieces may sit: fit every placed piece into the
  // new box once, in one undo step, instead of leaving pieces hanging outside it.
  const catalog = result.data;
  const hasBasePhoto = !!draft.base?.imageUrl;
  useEffect(() => {
    if (builder !== 'GIFT' || !catalog) return;
    const area = boundsFor(builder, hasBasePhoto, wrap?.shape);
    const types = Object.fromEntries(catalog.map((entry) => [entry.id, entry.type]));
    useCanvasStore.getState().refit((placement) =>
      clampInside(placement, pieceBox(groupOf(builder, types[placement.subCategoryId])), area));
  }, [builder, catalog, hasBasePhoto, wrap?.shape]);
  const canvasRect = useRef<Rect | null>(null);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const screenX = useSharedValue(0);
  const screenY = useSharedValue(0);
  const ghostStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value - screenX.value - 36 }, { translateY: dragY.value - screenY.value - 36 }],
  }));

  if (!builder || !categoryId)
    return (
      <Page>
        <Header title={t('canvasStudio.emptyTitleHeader')} back />
        <EmptyState icon="color-palette-outline" title={t('canvasStudio.chooseTitle')}
          description={t('canvasStudio.chooseBody')} action={t('canvasStudio.browseCategories')}
          onPress={() => router.replace('/categories')} />
      </Page>
    );

  const copy = {
    title: t(`canvasStudio.${builder}.title`),
    list: t(`canvasStudio.${builder}.list`),
    picker: t(`canvasStudio.${builder}.picker`),
    start: t(`canvasStudio.${builder}.start`),
    edit: t(`canvasStudio.${builder}.edit`),
    noun: t(builder === 'BOUQUET' ? 'canvasStudio.bouquet' : 'canvasStudio.gift'),
  };
  // Apparel's own-design upload never belongs here; inactive components can't be added.
  const components = (result.data ?? []).filter((component) =>
    component.isActive !== false && component.type?.toUpperCase() !== CUSTOM_UPLOAD);
  const byId: Record<string, CatalogComponent> = Object.fromEntries(components.map((entry) => [entry.id, entry]));
  const groupFor = (component?: CatalogComponent) => groupOf(builder, component?.type);
  // Filters come from the data: only groups that actually have components, then Text.
  const tabs = [
    { key: ALL, label: t('studio.tabAll') },
    ...groupsFor(builder).filter((group) => components.some((component) =>
      hasKnownGroup(builder, component.type) && groupFor(component).key === group.key))
      .map((group) => ({ key: group.key, label: t(`studio.groups.${group.key}`) })),
    { key: TEXT, label: t('studio.tabText') },
  ];
  const selectedText = draft.texts.find((layer) => layer.id === draft.selectedId) ?? null;
  const selected = draft.placements.find((item) => item.id === draft.selectedId) ?? null;
  const activeTab = selectedText ? TEXT : tabs.some((entry) => entry.key === tab) ? tab! : ALL;
  const visible = activeTab === ALL ? components : components.filter((component) =>
    hasKnownGroup(builder, component.type) && groupFor(component).key === activeTab);

  const usage: Record<string, number> = {};
  for (const item of draft.placements) usage[item.subCategoryId] = (usage[item.subCategoryId] ?? 0) + 1;
  const count = draft.placements.length;
  // Live estimate; the backend recalculates every price from its own catalog on save.
  const contents = (draft.base?.price ?? 0)
    + draft.placements.reduce((sum, item) => sum + (byId[item.subCategoryId]?.price ?? 0), 0);
  const total = contents + choicePrice(packaging);
  /** Back to the packaging screen; whatever is placed stays as it is. */
  const changePackaging = () => router.push({ pathname: '/design-base', params: { categoryId, change: '1' } });
  const stageSize = Math.min(Math.min(width, 760) - 32, height * 0.46, 480);
  // Pieces and text go into the drawn gift bag or box; a base photo or bouquet uses the canvas.
  const bounds = boundsFor(builder, hasBasePhoto, wrap?.shape);
  const fitPiece = (next: Placement, component?: CatalogComponent) =>
    clampInside(next, pieceBox(groupFor(component)), bounds);
  const fitText = (next: Placement) => clampInside(next, TEXT_BOX, bounds);

  // The only real-world limit: what is in stock (counting what is already on this design).
  function inStock(component: CatalogComponent, quiet = false) {
    if (remainingStock(component, usage[component.id] ?? 0) > 0) return true;
    if (!quiet) toast.info(component.trackStock !== false && component.stock <= 0
      ? t('canvasStudio.soldOut', { name: component.name })
      : t('canvasStudio.allUsed', { name: component.name }));
    return false;
  }

  function add(component: CatalogComponent, at?: { x: number; y: number }) {
    if (!inStock(component)) return;
    draft.add(component.id, fitPiece(at ? { ...at, scale: 1, rotation: 0 } : dropPosition(count, bounds), component));
    setMessage('');
  }

  // Dragged from the picker: the piece lands exactly where it is dropped.
  const drag: PickerDrag = {
    onDragStart: (component, x, y) => {
      dragX.set(x);
      dragY.set(y);
      screenRef.current?.measureInWindow((left, top) => { screenX.set(left); screenY.set(top); });
      canvasRef.current?.measureInWindow((left, top, w, h) => { canvasRect.current = { x: left, y: top, width: w, height: h }; });
      setDragging(component);
    },
    onDragMove: (x, y) => { dragX.set(x); dragY.set(y); },
    onDragEnd: (component, x, y, canceled) => {
      setDragging(null);
      const rect = canvasRect.current;
      if (canceled || !rect) return;
      const px = (x - rect.x) / rect.width;
      const py = (y - rect.y) / rect.height;
      if (px < 0 || px > 1 || py < 0 || py > 1) return;
      add(component, { x: px, y: py });
    },
  };

  /** Resizes or rotates the selected piece or text by one step. */
  function step(patch: { scale?: number; rotation?: number }) {
    const target = selected ?? selectedText;
    if (!target) return;
    const next = {
      x: target.x,
      y: target.y,
      scale: target.scale * (patch.scale ?? 1),
      rotation: target.rotation + (patch.rotation ?? 0),
    };
    if (selected) draft.update(selected.id, fitPiece(next, byId[selected.subCategoryId]));
    else if (selectedText) draft.updateText(selectedText.id, fitText(next));
  }

  function duplicate() {
    if (selected) {
      const component = byId[selected.subCategoryId];
      if (!component || !inStock(component)) return;
      draft.add(component.id, fitPiece({ ...selected, x: selected.x + 0.06, y: selected.y + 0.04 }, component));
    } else if (selectedText) {
      const { id: _id, text, ...style } = selectedText;
      draft.addText(text, { ...style, ...fitText({ ...style, x: style.x + 0.05, y: style.y + 0.06 }) });
    }
  }

  /** − in the list: the most recently added piece of that kind leaves. */
  function removeOne(component: CatalogComponent) {
    const last = [...draft.placements].reverse().find((item) => item.subCategoryId === component.id);
    if (last) draft.remove(last.id);
  }

  async function save() {
    const user = useAuthStore.getState().user;
    if (!user) { router.push('/login'); return; }
    if (saving) return;
    setSaving(true);
    setMessage('');
    try {
      await saveCanvasDesign(user.id, () => capture(draft.placements.map((item) => byId[item.subCategoryId]?.imageUrl)),
        (formData) => createProduct(formData).unwrap());
      toast.success(t('studio.savedToDesigns'));
    } catch (failure) {
      setMessage(t('studio.stillHere', { message: apiError(failure).message }), 'error');
    } finally {
      setSaving(false);
    }
  }

  // Layer order is list order (back to front): pieces among pieces, text among text.
  const layers: { id: string }[] = selected ? draft.placements : draft.texts;
  const layerIndex = layers.findIndex((entry) => entry.id === draft.selectedId);
  const selectedName = selected ? byId[selected.subCategoryId]?.name ?? t('studio.piece')
    : selectedText ? `“${selectedText.text}”` : '';
  const lines = [...new Set(draft.placements.map((item) => item.subCategoryId))]
    .filter((id) => byId[id])
    .map((id) => ({ component: byId[id], count: usage[id] ?? 0 }));

  return (
    <View ref={screenRef} collapsable={false} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Page scroll={false} style={{ padding: 0, gap: 0 }}>
        <View style={styles.headerWrap}>
          <Header title={copy.title} subtitle={draft.base?.name ?? draft.categoryName}
            back right={<IconButton name="bookmark-outline" label={t('studio.saveDesign')} onPress={() => void save()}
              disabled={!count || saving} />} />
          {gift && <PackagingSummaryBar packaging={packaging} onChange={changePackaging} />}
        </View>
        <View style={[styles.stage, { width: stageSize, height: stageSize }, dragging && styles.dropTarget]}>
          {/* Captured as the preview: backdrop, base product, pieces and text. Never handles or controls. */}
          <View ref={canvasRef} collapsable={false} testID="design-preview-canvas"
            style={{ width: stageSize, height: stageSize }}>
            <PhotoStage tone={builder} />
            <FreeDesignCanvas
              builder={builder}
              size={stageSize}
              base={draft.base}
              placements={draft.placements}
              texts={draft.texts}
              components={byId}
              wrap={wrap}
              selectedId={draft.selectedId}
              editable={!exporting}
              onSelect={draft.select}
              onChange={(id, transform: Transform) => draft.update(id, transform)}
              onRemove={draft.remove}
              onTextChange={(id, transform) => draft.updateText(id, transform)}
            />
          </View>
          {!exporting && (
            <StageOverlay
              label={(draft.base?.name ?? copy.noun).toUpperCase()}
              counter={componentCount(t, count, builder)}
              full={false}
              onUndo={draft.undo}
              onRedo={draft.redo}
              canUndo={draft.historyIndex !== 0}
              canRedo={draft.historyIndex < draft.history.length - 1}
              onClear={() => { draft.clear(); setMessage(t('canvasStudio.cleared')); }}
              canClear={count > 0 || draft.texts.length > 0}
            />
          )}
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {selected || selectedText ? (
            <CanvasToolbar
              name={selectedName}
              canDuplicate={!!selectedText || (!!selected && !!byId[selected.subCategoryId]
                && remainingStock(byId[selected.subCategoryId], usage[selected.subCategoryId] ?? 0) > 0)}
              canForward={layerIndex >= 0 && layerIndex < layers.length - 1}
              canBackward={layerIndex > 0}
              onSmaller={() => step({ scale: 0.9 })}
              onLarger={() => step({ scale: 1.1 })}
              onRotateLeft={() => step({ rotation: -15 })}
              onRotateRight={() => step({ rotation: 15 })}
              onForward={() => draft.selectedId && draft.shiftLayer(draft.selectedId, 1)}
              onBackward={() => draft.selectedId && draft.shiftLayer(draft.selectedId, -1)}
              onDuplicate={duplicate}
              onRemove={() => draft.selectedId && draft.remove(draft.selectedId)}
              onDone={() => draft.select(null)}
            />
          ) : (
            <View style={styles.hint}>
              <Icon name="sparkles-outline" size={16} color={theme.colors.accent} />
              <Text style={[ui.caption, { flex: 1 }]}>
                {count || draft.texts.length ? copy.edit : copy.start}
              </Text>
            </View>
          )}
          {message ? <Notice text={message} /> : null}
          <CompositionList
            title={copy.list}
            lines={lines}
            total={total}
            canAdd={(component) => inStock(component, true)}
            onAdd={(component) => add(component)}
            onRemove={removeOne}
          />
          <Text style={[ui.sectionTitle, { fontSize: 18 }]}>{copy.picker}</Text>
          {result.loading || result.error ? (
            <CatalogState loading={result.loading} error={result.error} empty="" retry={result.retry} />
          ) : (
            <ComponentPicker
              tabs={tabs}
              tab={activeTab}
              onTab={(key) => { setTab(key); if (selectedText) draft.select(null); }}
              components={activeTab === TEXT ? [] : visible}
              usage={usage}
              chosen={new Set()}
              onAdd={(component) => add(component)}
              drag={drag}
              empty={components.length ? t('canvasStudio.emptyGroup') : t('canvasStudio.noComponents')}
              extra={activeTab === TEXT ? (
                <TextTool
                  selected={selectedText}
                  count={draft.texts.length}
                  onAdd={(text, { scale, ...style }) => draft.addText(text, { ...style, ...fitText({
                    ...DEFAULT_TEXT, scale, y: DEFAULT_TEXT.y + (draft.texts.length % 3) * 0.1 }) })}
                  onChange={(patch, record) => selectedText && draft.updateText(selectedText.id,
                    patch.scale === undefined ? patch : { ...patch, ...fitText({ ...selectedText, ...patch }) }, record)}
                  onRemove={() => selectedText && draft.remove(selectedText.id)}
                  onDone={() => draft.select(null)}
                />
              ) : undefined}
            />
          )}
          {gift && packaging && count > 0 && (
            <GiftPriceSummary contents={contents} count={componentCount(t, count, builder)}
              packaging={packaging} />
          )}
        </ScrollView>
      </Page>
      {dragging && (
        <Animated.View pointerEvents="none" testID="drag-preview" style={[styles.ghost, ghostStyle]}>
          <CatalogImage imageUrl={dragging.imageUrl} name={dragging.name} size={60} />
        </Animated.View>
      )}
      <DesignerFooter
        total={total}
        beads={count}
        label={count ? componentCount(t, count, builder) : undefined}
        disabled={!count}
        onPreview={() => router.push('/studio-preview')}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    headerWrap: { paddingHorizontal: 22, paddingVertical: 8, gap: 8 },
    stage: {
      alignSelf: 'center', borderRadius: 28, overflow: 'hidden', backgroundColor: c.thumbnail,
      borderWidth: 1, borderColor: c.border,
    },
    dropTarget: { borderColor: c.accent },
    content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 32, gap: 10 },
    hint: {
      flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9,
      borderRadius: 12, backgroundColor: c.soft,
    },
    ghost: {
      position: 'absolute', left: 0, top: 0, width: 72, height: 72, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.accent,
      backgroundColor: c.badge,
      elevation: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
    },
  });
};

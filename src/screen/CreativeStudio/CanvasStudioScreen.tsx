import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { EmptyState, Header, Icon, IconButton, Notice, Page, useUI } from '@/components/common/ui';
import { StageBackground } from '@/components/common/StageBackground';
import { CatalogImage } from '@/components/products/CatalogImage';
import { CatalogState } from '@/components/products/CatalogState';
import { ComponentPicker, remainingStock, type PickerDrag } from '@/components/studio/ComponentPicker';
import type { Transform } from '@/components/studio/PlacedItem';
import { useGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useCreateProductMutation } from '@/api/endpoints/productSlice';
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
  clampForGroup, clampText, DEFAULT_TEXT, defaultPosition, groupOf, groupsFor, hasKnownGroup, type CanvasBuilder,
} from '@/helper/canvasStudio';
import { componentCount } from '@/helper/builders';
import { saveCanvasDesign } from '@/services/canvasDesign';
import { type Theme } from '@/constants/theme';
import { DesignerFooter } from '@/screen/Designer/components/DesignerFooter';
import { StageOverlay } from '@/screen/Designer/components/StageOverlay';
import { CanvasToolbar } from './components/CanvasToolbar';
import { DesignCanvas } from './components/DesignCanvas';
import { useCanvasCapture } from './components/useCanvasCapture';
import { TextTool } from './gift/TextTool';

type Rect = { x: number; y: number; width: number; height: number };
const ALL = 'ALL';
const TEXT = 'TEXT';

const COPY: Record<CanvasBuilder, { noun: string; hint: string; full: string }> = {
  BOUQUET: {
    noun: 'bouquet',
    hint: 'Tap a flower, or hold and drag it onto your bouquet.',
    full: 'Your bouquet is full. Remove a stem to add another.',
  },
  GIFT: {
    noun: 'gift',
    hint: 'Tap an item, or hold and drag it onto your gift.',
    full: 'Your gift is full. Remove an item to add another.',
  },
};

/** Bouquet and Gift Studio: one canvas, components placed freely in a valid zone. */
export default function CanvasStudioScreen() {
  const theme = useTheme();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width, height } = useWindowDimensions();
  const draft = useCanvasStore();
  const builder = draft.builderType;
  const categoryId = draft.categoryId ?? '';
  const result = useApiResult<CatalogComponent[]>(useGetCategoryComponentsQuery(categoryId, { skip: !categoryId }));
  const [createProduct] = useCreateProductMutation();
  const [message, setMessage] = useFeedbackState('info');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<string | null>(null);
  const [dragging, setDragging] = useState<CatalogComponent | null>(null);
  const { ref: canvasRef, exporting, capture } = useCanvasCapture();
  const screenRef = useRef<View>(null);
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
        <Header title="Your creative studio" back />
        <EmptyState icon="color-palette-outline" title="Choose what to create"
          description="Pick a bouquet or a gift category to start designing." action="Browse categories"
          onPress={() => router.replace('/categories')} />
      </Page>
    );

  const copy = COPY[builder];
  // The admin's own-design upload belongs to apparel; inactive components can't be added.
  const components = (result.data ?? []).filter((component) =>
    component.isActive !== false && component.type?.toUpperCase() !== CUSTOM_UPLOAD);
  const byId: Record<string, CatalogComponent> = Object.fromEntries(components.map((entry) => [entry.id, entry]));
  const groupFor = (component?: CatalogComponent) => groupOf(builder, component?.type);
  const groupTabs = groupsFor(builder).filter((group) => components.some((component) =>
    hasKnownGroup(builder, component.type) && groupFor(component).key === group.key));
  // Gift: Items, Decorations, Text, then the rest.
  const tabs = [
    { key: ALL, label: 'All' },
    ...groupTabs.slice(0, builder === 'GIFT' ? 2 : groupTabs.length),
    ...(builder === 'GIFT' ? [{ key: TEXT, label: 'Text' }, ...groupTabs.slice(2)] : []),
  ];
  const selectedText = draft.texts.find((layer) => layer.id === draft.selectedId) ?? null;
  const selected = draft.placements.find((item) => item.id === draft.selectedId) ?? null;
  // Default to the main group (Flowers, Items) when the catalog has it, like the jewelry tabs.
  const mainTab = tabs.find((entry) => entry.key === groupOf(builder, null).key)?.key ?? ALL;
  const activeTab = selectedText ? TEXT : tabs.some((entry) => entry.key === tab) ? tab! : mainTab;
  const visible = activeTab === ALL ? components : components.filter((component) =>
    hasKnownGroup(builder, component.type) && groupFor(component).key === activeTab);

  const usage: Record<string, number> = {};
  for (const item of draft.placements) usage[item.subCategoryId] = (usage[item.subCategoryId] ?? 0) + 1;
  const chosen = new Set(draft.placements
    .filter((item) => groupFor(byId[item.subCategoryId]).single).map((item) => item.subCategoryId));
  const capacity = draft.size?.maxItems;
  const count = draft.placements.length;
  const full = !!capacity && count >= capacity;
  const total = draft.placements.reduce((sum, item) => sum + (byId[item.subCategoryId]?.price ?? 0), 0);
  const container = draft.placements.find((item) => groupFor(byId[item.subCategoryId]).key === 'CONTAINER');
  // Leave room below for the hint, tabs and a row of cards.
  const stageSize = Math.min(Math.min(width, 760) - 48, height * 0.4, 440);
  const label = [builder, draft.size?.name ?? (builder === 'GIFT'
    ? byId[container?.subCategoryId ?? '']?.name ?? 'Clear bag' : null)]
    .filter(Boolean).join(' · ').toUpperCase();

  function canAdd(component: CatalogComponent, replacing: boolean) {
    if (remainingStock(component, usage[component.id] ?? 0) <= 0) {
      toast.info(component.trackStock !== false && component.stock <= 0
        ? `${component.name} is sold out.`
        : `All available ${component.name} are already on your ${copy.noun}.`);
      return false;
    }
    if (full && !replacing) {
      toast.info(copy.full);
      return false;
    }
    return true;
  }

  function add(component: CatalogComponent, at?: { x: number; y: number }) {
    const group = groupFor(component);
    const inGroup = draft.placements.filter((item) => groupFor(byId[item.subCategoryId]).key === group.key);
    if (group.single) {
      // Tapping the chosen wrap/bag again takes it off; another one replaces it.
      const same = inGroup.find((item) => item.subCategoryId === component.id);
      if (same) { draft.remove(same.id); return; }
      if (!canAdd(component, inGroup.length > 0)) return;
      draft.add(component.id, defaultPosition(builder!, group, 0), inGroup.map((item) => item.id));
    } else {
      if (!canAdd(component, false)) return;
      const position = at ? clampForGroup({ ...at, scale: 1, rotation: 0 }, group)
        : defaultPosition(builder!, group, inGroup.length);
      draft.add(component.id, position);
    }
    setMessage('');
  }

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
      // Dropped off the canvas: nothing is added. Inside it: snap into the valid zone.
      if (px < 0 || px > 1 || py < 0 || py > 1) return;
      add(component, { x: px, y: py });
    },
  };

  function step(patch: { scale?: number; rotation?: number }) {
    if (!selected) return;
    const group = groupFor(byId[selected.subCategoryId]);
    draft.update(selected.id, clampForGroup({
      ...selected,
      scale: selected.scale * (patch.scale ?? 1),
      rotation: selected.rotation + (patch.rotation ?? 0),
    }, group));
  }
  function duplicate() {
    const component = selected && byId[selected.subCategoryId];
    if (!selected || !component || !canAdd(component, false)) return;
    draft.add(component.id, clampForGroup({ ...selected, x: selected.x + 0.07, y: selected.y + 0.04 },
      groupFor(component)));
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
      toast.success('Saved to My Designs.');
    } catch (failure) {
      setMessage(apiError(failure).message + ' Your design is still here.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const hint = selected
    ? 'Drag to move. Pinch or use the corner handle to resize and rotate.'
    : full ? copy.full : copy.hint;
  const selectedComponent = selected ? byId[selected.subCategoryId] : undefined;

  return (
    <View ref={screenRef} collapsable={false} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Page scroll={false} style={{ padding: 0, gap: 0 }}>
        <View style={styles.headerWrap}>
          <Header title="Your creative studio" subtitle={[draft.categoryName, draft.size?.name].filter(Boolean).join(' • ')}
            back right={<IconButton name="bookmark-outline" label="Save design" onPress={() => void save()}
              disabled={!count || saving} />} />
        </View>
        <View style={[styles.stage, { width: stageSize, height: stageSize }, dragging && styles.dropTarget]}>
          <StageBackground />
          <View ref={canvasRef} collapsable={false} testID="design-preview-canvas"
            style={{ width: stageSize, height: stageSize }}>
            <DesignCanvas
              builder={builder}
              size={stageSize}
              placements={draft.placements}
              texts={draft.texts}
              components={byId}
              selectedId={draft.selectedId}
              editable={!exporting}
              showZone={!!dragging || !count}
              onSelect={draft.select}
              onChange={(id, transform: Transform) => draft.update(id, transform)}
              onRemove={draft.remove}
              onTextChange={(id, transform) => draft.updateText(id, transform)}
            />
          </View>
          {!exporting && (
            <StageOverlay
              label={label}
              counter={capacity ? `${count} / ${capacity} ${builder === 'BOUQUET' ? 'flowers' : 'items'}`
                : componentCount(count, builder)}
              full={full}
              progress={capacity ? count / capacity : undefined}
              onUndo={draft.undo}
              onRedo={draft.redo}
              canUndo={draft.historyIndex !== 0}
              canRedo={draft.historyIndex < draft.history.length - 1}
              onClear={() => { draft.clear(); setMessage('Canvas cleared. Tap Undo to bring it back.'); }}
              canClear={count > 0 || draft.texts.length > 0}
            />
          )}
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {selected ? (
            <CanvasToolbar
              name={selectedComponent?.name ?? 'Item'}
              fixed={groupFor(selectedComponent).fixed}
              canDuplicate={!groupFor(selectedComponent).single && !full && !!selectedComponent
                && remainingStock(selectedComponent, usage[selectedComponent.id] ?? 0) > 0}
              onSmaller={() => step({ scale: 0.9 })}
              onLarger={() => step({ scale: 1.1 })}
              onRotateLeft={() => step({ rotation: -15 })}
              onRotateRight={() => step({ rotation: 15 })}
              onForward={() => draft.bringForward(selected.id)}
              onDuplicate={duplicate}
              onRemove={() => draft.remove(selected.id)}
              onDone={() => draft.select(null)}
            />
          ) : (
            <View style={styles.hint}>
              <Icon name={full ? 'checkmark-circle-outline' : 'sparkles-outline'} size={16} color={theme.colors.accent} />
              <Text style={[ui.caption, { flex: 1 }]}>{selectedText ? 'Edit your text below, or drag it on the bag.' : hint}</Text>
            </View>
          )}
          {message ? <Notice text={message} /> : null}
          <Text style={[ui.sectionTitle, { fontSize: 18 }]}>Choose your details</Text>
          {result.loading || result.error ? (
            <CatalogState loading={result.loading} error={result.error} empty="" retry={result.retry} />
          ) : (
            <ComponentPicker
              tabs={tabs}
              tab={activeTab}
              onTab={(key) => { setTab(key); if (selectedText) draft.select(null); }}
              components={visible}
              usage={usage}
              chosen={chosen}
              disabled={full}
              onAdd={(component) => add(component)}
              drag={drag}
              empty={components.length ? 'Nothing in this group yet.' : 'No components are available in this category yet.'}
              extra={activeTab === TEXT ? (
                <TextTool
                  selected={selectedText}
                  count={draft.texts.length}
                  onAdd={(text, style) => draft.addText(text, { ...clampText({
                    ...DEFAULT_TEXT, y: DEFAULT_TEXT.y + (draft.texts.length % 3) * 0.1 }), ...style })}
                  onChange={(patch, record) => selectedText && draft.updateText(selectedText.id, patch, record)}
                  onRemove={() => selectedText && draft.remove(selectedText.id)}
                  onDone={() => draft.select(null)}
                />
              ) : undefined}
            />
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
        label={count ? componentCount(count, builder) : undefined}
        disabled={!count}
        onPreview={() => router.push('/studio-preview')}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    headerWrap: { paddingHorizontal: 22, paddingVertical: 8 },
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

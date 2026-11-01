import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { memo, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { items as localItems } from '@/services/catalog';
import { CustomizationItem, ItemType } from '@/types/models';
import { type Theme } from '@/constants/theme';
import { money } from '@/helper/pricing';
import { Chips, Icon, useUI } from '@/components/common/ui';
import { DesignItem } from './DesignItem';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDesignStore } from '@/store/designStore';
const categories: Record<'All' | 'Beads' | 'Charms' | 'Letters' | 'Spacers', ItemType | undefined> = {
  All: undefined,
  Beads: 'bead',
  Charms: 'charm',
  Letters: 'letter',
  Spacers: 'spacer',
};
type Category = keyof typeof categories;
// The material filter stores ANY or a catalog value.
const ANY = '';
export function BeadPicker({
  onPick,
  initialCategory = 'All',
  replacing,
  disabled = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  sourceItems,
  fitOf,
}: {
  sourceItems?: CustomizationItem[];
  /** Bracelets: why a component can't go on right now (no room, no physical size), else null. */
  fitOf?: (item: CustomizationItem) => string | null;
  onPick: (item: CustomizationItem) => void;
  replacing: boolean;
  initialCategory?: string;
  disabled?: boolean;
  onDragStart?: (item: CustomizationItem, x: number, y: number) => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (item: CustomizationItem, x: number, y: number, canceled: boolean) => void;
}) {
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const items = sourceItems ?? localItems;

  const { t } = useTranslation();
  const [category, setCategory] = useState<Category>(initialCategory in categories ? initialCategory as Category : 'All');
  const [material, setMaterial] = useState(ANY);
  const materials = useMemo(
    () => [...new Set(items.map((item) => item.material).filter((value): value is string => !!value))]
      .sort((a, b) => a.localeCompare(b)),
    [items],
  );
  // One material means nothing to choose: the grid takes the full width.
  const sidebar = materials.length > 1;
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (!categories[category] || item.type === categories[category]) &&
          (material === ANY || item.material === material),
      ),
    [items, category, material],
  );
  const columns = sidebar ? (width < 360 ? 2 : 3) : (width < 360 ? 3 : 4);
  const materialOption = (value: string, label: string, accessibilityLabel: string) => {
    const active = material === value;
    return (
      <Pressable key={value || 'all'} accessibilityRole="button" accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: active }} onPress={() => setMaterial(value)}
        style={({ pressed }) => [styles.material, active && styles.materialActive, { opacity: pressed ? 0.7 : 1 }]}>
        <Text numberOfLines={2} style={[styles.materialText, active && styles.materialTextActive]}>{label}</Text>
      </Pressable>
    );
  };
  return (
    <View style={{ flex: 1, gap: 12 }}>
      <Text style={styles.hint}>
        {disabled
          ? t('jewelry.pickerFull')
          : replacing
            ? t('jewelry.pickerReplace')
            : t('jewelry.pickerAdd')}
      </Text>
      {!sourceItems && (
        <Chips options={(Object.keys(categories) as Category[]).map((key) => t(`jewelry.categories.${key}`))}
          value={t(`jewelry.categories.${category}`)}
          onChange={(label) => setCategory((Object.keys(categories) as Category[])
            .find((key) => t(`jewelry.categories.${key}`) === label) ?? 'All')} />
      )}
      {/* The material list and the grid scroll on their own, so long lists of either stay reachable. */}
      <View style={styles.body}>
        {sidebar && (
          <ScrollView style={styles.sidebar} contentContainerStyle={styles.sidebarContent}
            accessibilityLabel={t('jewelry.materialsLabel')} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {materialOption(ANY, t('jewelry.allMaterials'), t('jewelry.allMaterialsLabel'))}
            {materials.map((value) => materialOption(value, value, t('jewelry.materialLabel', { material: value })))}
          </ScrollView>
        )}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false} nestedScrollEnabled>
          <View style={styles.grid}>
            {visible.map((item) => (
              <DraggableBead key={item.id} item={item} replacing={replacing} disabled={disabled}
                fit={fitOf?.(item) ?? null}
                columns={columns} onPick={onPick} onDragStart={onDragStart}
                onDragMove={onDragMove} onDragEnd={onDragEnd} />
            ))}
          </View>
          {!visible.length && (
            <View style={{ alignItems: 'center', gap: 8, padding: 20 }}>
              <Text style={[ui.body, { textAlign: 'center' }]}>{t('jewelry.noMatch')}</Text>
              {material !== ANY && (
                <Pressable accessibilityRole="button" onPress={() => setMaterial(ANY)} hitSlop={8}>
                  <Text style={ui.textLink}>{t('jewelry.resetFilters')}</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const DraggableBead = memo(function DraggableBead({ item, replacing, disabled, fit, columns, onPick, onDragStart,
  onDragMove, onDragEnd }: {
  item: CustomizationItem;
  replacing: boolean;
  disabled: boolean;
  /** Why it doesn't fit the bracelet, shown apart from stock problems. */
  fit: string | null;
  /** Tiles per row; the grid is narrower beside the material list. */
  columns: number;
  onPick: (item: CustomizationItem) => void;
  onDragStart?: (item: CustomizationItem, x: number, y: number) => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (item: CustomizationItem, x: number, y: number, canceled: boolean) => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const quantity = useDesignStore((state) => state.items.filter((entry) => entry.itemId === item.id).length);
  const { t } = useTranslation();
  const replaceSame = useDesignStore((state) => state.items.some((entry) => entry.id === state.selectedId && entry.itemId === item.id));
  const atStockLimit = quantity - (replaceSame ? 1 : 0) >= item.stock;
  const outOfStock = !item.available || atStockLimit;
  // Stock and physical fit are different reasons, so each gets its own message.
  const unavailable = outOfStock || !!fit;
  const gesture = useMemo(() => Gesture.Pan().activateAfterLongPress(220).runOnJS(true)
    .enabled(!unavailable)
    .onStart((event) => onDragStart?.(item, event.absoluteX, event.absoluteY))
    .onUpdate((event) => onDragMove?.(event.absoluteX, event.absoluteY))
    .onFinalize((event, success) => onDragEnd?.(item, event.absoluteX, event.absoluteY, !success)),
  [item, unavailable, onDragStart, onDragMove, onDragEnd]);
  return (
    <GestureDetector gesture={gesture}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[
          t(replacing ? 'jewelry.replaceWith' : 'jewelry.addItem', { name: item.name,
            price: t('jewelry.perBead', { price: money(item.price) }) }),
          item.color ? t('jewelry.color', { color: item.color }) : null,
          item.lengthMm ? t('jewelry.pieceSize', { size: item.lengthMm }) : null,
          !outOfStock ? fit : null,
        ].filter(Boolean).join(', ')}
        disabled={unavailable}
        onPress={() => onPick(item)}
        style={({ pressed }) => [
          styles.item,
          item.categoryId && styles.tile,
          { width: `${Math.floor(100 / columns) - 2}%`, maxWidth: `${100 / columns}%` },
          quantity > 0 && { borderColor: theme.colors.accent },
          { opacity: unavailable ? 0.45 : pressed ? 0.6 : 1 },
        ]}
      >
        {quantity > 0 && (
          <View style={styles.count} accessibilityElementsHidden>
            <Text style={styles.countText}>×{quantity}</Text>
          </View>
        )}
        <DesignItem item={item} size={item.categoryId ? (columns <= 3 ? 44 : 36) : 48} />
        <Text numberOfLines={1} style={[styles.name, item.categoryId && styles.tileName]}>
          {item.name}
        </Text>
        {item.categoryId ? (
          <>
            <Text numberOfLines={1} style={styles.tilePrice}>{money(item.price)}</Text>
            <Text numberOfLines={1} style={[styles.stock, (!item.stock || (!outOfStock && fit)) && { color: theme.colors.danger }]}>
              {!item.stock ? t('readyMade.outOfStock') : atStockLimit ? t('jewelry.allInUse', { count: item.stock })
                : fit ?? [item.lengthMm ? t('jewelry.pieceSize', { size: item.lengthMm }) : null,
                  t('jewelry.stockLeft', { count: item.stock })].filter(Boolean).join(' · ')}
            </Text>
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Text style={styles.price}>{money(item.price)}</Text>
            <Icon name={disabled ? 'hand-left-outline' : 'add-circle'} size={22} color={theme.colors.primary} />
          </View>
        )}
      </Pressable>
    </GestureDetector>
  );
});
const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    hint: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
    body: { flex: 1, flexDirection: 'row', gap: 10 },
    sidebar: { width: 96, flexGrow: 0 },
    sidebarContent: { gap: 8, paddingBottom: 16 },
    material: {
      minHeight: 40, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 999, alignItems: 'center',
      justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
    },
    materialActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    materialText: { color: theme.colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    materialTextActive: { color: theme.colors.onPrimary, fontWeight: '700' },
    item: {
      flexGrow: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      padding: 8,
      alignItems: 'center',
      gap: 6,
    },
    tile: { paddingVertical: 8, paddingHorizontal: 4, gap: 2, borderRadius: 12 },
    tileName: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    tilePrice: { fontSize: 11, color: theme.colors.gold, fontWeight: '700' },
    stock: { fontSize: 9, color: theme.colors.muted, textAlign: 'center' },
    count: {
      position: 'absolute', top: 4, right: 4, zIndex: 1,
      minWidth: 22, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 9,
      backgroundColor: theme.colors.primary, alignItems: 'center',
    },
    countText: { fontSize: 9, fontWeight: '700', color: theme.colors.onPrimary },
    name: { fontSize: 10, color: theme.colors.text, textAlign: 'center' },
    price: { fontSize: 10, color: theme.colors.text, fontWeight: '600' },
  });
};

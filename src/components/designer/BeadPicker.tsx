import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
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
// Filters store ANY or a catalog value; only the "any" labels are translated.
const ANY = '';
export function BeadPicker({
  onPick,
  initialCategory = 'All',
  expanded = false,
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
  expanded?: boolean;
  disabled?: boolean;
  onDragStart?: (item: CustomizationItem, x: number, y: number) => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (item: CustomizationItem, x: number, y: number, canceled: boolean) => void;
}) {
  const theme = useTheme();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const items = sourceItems ?? localItems;

  const { t } = useTranslation();
  const [category, setCategory] = useState<Category>(initialCategory in categories ? initialCategory as Category : 'All');
  const [filterOpen, setFilterOpen] = useState(expanded);
  const [color, setColor] = useState(ANY);
  const [material, setMaterial] = useState(ANY);
  const [shape, setShape] = useState(ANY);
  const [cheap, setCheap] = useState(false);
  const [search, setSearch] = useState('');
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (!categories[category] || item.type === categories[category]) &&
          (color === ANY || item.color === color) &&
          (material === ANY || item.material === material) &&
          (shape === ANY || item.shape === shape) &&
          (!cheap || item.price <= 50) &&
          item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, category, color, material, shape, cheap, search],
  );
  const activeCount = [color !== ANY, material !== ANY, shape !== ANY, cheap].filter(Boolean).length;
  const reset = () => {
    setColor(ANY);
    setMaterial(ANY);
    setShape(ANY);
    setCheap(false);
    setSearch('');
  };
  // A chip row of one "any" label plus catalog values; picking the label clears the filter.
  const filterChips = (label: string, anyLabel: string, values: string[], value: string,
    onChange: (next: string) => void) => (
    <View style={{ gap: 6 }}>
      <Text style={styles.filterLabel}>{label}</Text>
      <Chips options={[anyLabel, ...values]} value={value === ANY ? anyLabel : value}
        onChange={(next) => onChange(next === anyLabel ? ANY : next)} />
    </View>
  );
  const valuesOf = (key: 'color' | 'material' | 'shape') =>
    [...new Set(items.map((item) => item[key]).filter((value): value is string => !!value))];
  const priceLabels = [t('jewelry.anyPrice'), t('jewelry.upToPrice', { price: money(50) })];
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 2 }}>
        <View style={ui.between}>
          <Text style={styles.title}>{t('jewelry.chooseDetails')}</Text>
          <Text style={styles.results}>{t('counts.piece', { count: visible.length })}</Text>
        </View>
        <Text style={styles.hint}>
          {disabled
            ? t('jewelry.pickerFull')
            : replacing
              ? t('jewelry.pickerReplace')
              : t('jewelry.pickerAdd')}
        </Text>
      </View>
      <View style={styles.toolbar}>
        <View style={styles.search}>
          <Icon name="search-outline" size={16} color={theme.colors.muted} />
          <TextInput
            accessibilityLabel={t('jewelry.searchLabel')}
            placeholder={t('jewelry.searchPlaceholder')}
            placeholderTextColor={theme.colors.muted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {!!search && (
            <Pressable accessibilityRole="button" accessibilityLabel={t('home.clearSearch')}
              onPress={() => setSearch('')} hitSlop={10}>
              <Icon name="close-circle" size={16} color={theme.colors.muted} />
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('jewelry.toggleFilters')}
          accessibilityState={{ expanded: filterOpen }}
          onPress={() => setFilterOpen(!filterOpen)}
          style={[styles.filterButton, (filterOpen || activeCount > 0) && styles.filterButtonActive]}
        >
          <Icon name="options-outline" size={18}
            color={activeCount > 0 || filterOpen ? theme.colors.accent : theme.colors.text} />
          <Text style={[styles.filterText, (activeCount > 0 || filterOpen) && { color: theme.colors.accent }]}>
            {t('jewelry.filters')}
          </Text>
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
      {!sourceItems && (
        <Chips options={(Object.keys(categories) as Category[]).map((key) => t(`jewelry.categories.${key}`))}
          value={t(`jewelry.categories.${category}`)}
          onChange={(label) => setCategory((Object.keys(categories) as Category[])
            .find((key) => t(`jewelry.categories.${key}`) === label) ?? 'All')} />
      )}
      {filterOpen && (
        <View style={styles.filters}>
          {valuesOf('color').length > 1 &&
            filterChips(t('jewelry.filterColor'), t('jewelry.anyColor'), valuesOf('color'), color, setColor)}
          {valuesOf('material').length > 1 &&
            filterChips(t('jewelry.filterMaterial'), t('jewelry.anyMaterial'), valuesOf('material'), material, setMaterial)}
          {valuesOf('shape').length > 1 &&
            filterChips(t('jewelry.filterShape'), t('jewelry.anyShape'), valuesOf('shape'), shape, setShape)}
          <View style={{ gap: 6 }}>
            <Text style={styles.filterLabel}>{t('jewelry.filterPrice')}</Text>
            <Chips options={priceLabels} value={priceLabels[cheap ? 1 : 0]}
              onChange={(label) => setCheap(label === priceLabels[1])} />
          </View>
          {(activeCount > 0 || !!search) && (
            <Pressable accessibilityRole="button" onPress={reset} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
              <Text style={ui.textLink}>{t('jewelry.resetFilters')}</Text>
            </Pressable>
          )}
        </View>
      )}
      <View style={styles.grid}>
        {visible.map((item) => (
          <DraggableBead key={item.id} item={item} replacing={replacing} disabled={disabled}
            fit={fitOf?.(item) ?? null}
            narrow={width < 360} onPick={onPick} onDragStart={onDragStart}
            onDragMove={onDragMove} onDragEnd={onDragEnd} />
        ))}
      </View>
      {!visible.length && (
        <View style={{ alignItems: 'center', gap: 8, padding: 20 }}>
          <Text style={[ui.body, { textAlign: 'center' }]}>{t('jewelry.noMatch')}</Text>
          {(activeCount > 0 || !!search) && (
            <Pressable accessibilityRole="button" onPress={reset} hitSlop={8}>
              <Text style={ui.textLink}>{t('jewelry.resetFilters')}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const DraggableBead = memo(function DraggableBead({ item, replacing, disabled, fit, narrow, onPick, onDragStart,
  onDragMove, onDragEnd }: {
  item: CustomizationItem;
  replacing: boolean;
  disabled: boolean;
  /** Why it doesn't fit the bracelet, shown apart from stock problems. */
  fit: string | null;
  narrow: boolean;
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
          narrow && styles.itemNarrow,
          quantity > 0 && { borderColor: theme.colors.accent },
          { opacity: unavailable ? 0.45 : pressed ? 0.6 : 1 },
        ]}
      >
        {quantity > 0 && (
          <View style={styles.count} accessibilityElementsHidden>
            <Text style={styles.countText}>×{quantity}</Text>
          </View>
        )}
        <DesignItem item={item} size={item.categoryId ? 36 : 48} />
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
    title: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
    results: { color: theme.colors.muted, fontSize: 12 },
    hint: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    search: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 12,
      borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
    },
    searchInput: { flex: 1, height: 38, fontSize: 13, color: theme.colors.text, paddingVertical: 0 },
    filterButton: {
      flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 12, borderRadius: 12,
      borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
    },
    filterButtonActive: { borderColor: theme.colors.accent },
    filterText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
    filterBadge: {
      minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.colors.accent,
    },
    filterBadgeText: { color: theme.colors.onPrimary, fontSize: 10, fontWeight: '700' },
    filters: {
      gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    filterLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
    item: {
      width: '23%',
      flexGrow: 1,
      maxWidth: '25%',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      padding: 8,
      alignItems: 'center',
      gap: 6,
    },
    itemNarrow: { width: '30%', maxWidth: '33%' },
    tile: { width: '23%', maxWidth: '25%', paddingVertical: 8, paddingHorizontal: 4, gap: 2, borderRadius: 12 },
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

import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { items as localItems } from '@/services/catalog';
import { CustomizationItem, ItemType } from '@/types/models';
import { type Theme } from '@/constants/theme';
import { money } from '@/helper/pricing';
import { Chips, Field, Icon, useUI } from '@/components/common/ui';
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
}: {
  sourceItems?: CustomizationItem[];
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
  const active = color !== ANY || material !== ANY || shape !== ANY || cheap;
  // A chip row of one "any" label plus catalog values; picking the label clears the filter.
  const filterChips = (anyLabel: string, values: string[], value: string, onChange: (next: string) => void) => (
    <Chips options={[anyLabel, ...values]} value={value === ANY ? anyLabel : value}
      onChange={(next) => onChange(next === anyLabel ? ANY : next)} />
  );
  const priceLabels = [t('jewelry.anyPrice'), t('jewelry.upToPrice', { price: money(50) })];
  return (
    <View style={{ gap: 16 }}>
      <View style={ui.between}>
        <View>
          <Text style={[ui.sectionTitle, { fontSize: 19 }]}>{t('jewelry.chooseDetails')}</Text>
          <Text style={ui.caption}>
            {disabled
              ? t('jewelry.pickerFull')
              : replacing
                ? t('jewelry.pickerReplace')
                : t('jewelry.pickerAdd')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('jewelry.toggleFilters')}
          onPress={() => setFilterOpen(!filterOpen)}
          style={[ui.iconButton, active && { borderColor: theme.colors.accent }]}
        >
          <Icon name="options-outline" color={active ? theme.colors.accent : theme.colors.text} />
        </Pressable>
      </View>
      {!sourceItems && (
        <Chips options={(Object.keys(categories) as Category[]).map((key) => t(`jewelry.categories.${key}`))}
          value={t(`jewelry.categories.${category}`)}
          onChange={(label) => setCategory((Object.keys(categories) as Category[])
            .find((key) => t(`jewelry.categories.${key}`) === label) ?? 'All')} />
      )}
      {filterOpen && (
        <View style={ui.card}>
          <Field
            label={t('jewelry.searchLabel')}
            placeholder={t('jewelry.searchPlaceholder')}
            value={search}
            onChangeText={setSearch}
          />
          {filterChips(t('jewelry.anyColor'), [...new Set(items.map((item) => item.color))], color, setColor)}
          {filterChips(t('jewelry.anyMaterial'), [...new Set(items.map((item) => item.material))], material, setMaterial)}
          {filterChips(t('jewelry.anyShape'), [...new Set(items.map((item) => item.shape))], shape, setShape)}
          <Chips options={priceLabels} value={priceLabels[cheap ? 1 : 0]} onChange={(label) => setCheap(label === priceLabels[1])} />
          <Pressable
            onPress={() => {
              setColor(ANY);
              setMaterial(ANY);
              setShape(ANY);
              setCheap(false);
              setSearch('');
            }}
          >
            <Text style={ui.textLink}>{t('jewelry.resetFilters')}</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.grid}>
        {visible.map((item) => (
          <DraggableBead key={item.id} item={item} replacing={replacing} disabled={disabled}
            narrow={width < 360} onPick={onPick} onDragStart={onDragStart}
            onDragMove={onDragMove} onDragEnd={onDragEnd} />
        ))}
      </View>
      {!visible.length && (
        <Text style={[ui.body, { textAlign: 'center', padding: 20 }]}>
          {t('jewelry.noMatch')}
        </Text>
      )}
    </View>
  );
}

const DraggableBead = memo(function DraggableBead({ item, replacing, disabled, narrow, onPick, onDragStart, onDragMove, onDragEnd }: {
  item: CustomizationItem;
  replacing: boolean;
  disabled: boolean;
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
  const unavailable = !item.available || atStockLimit;
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
        accessibilityLabel={
          t(replacing ? 'jewelry.replaceWith' : 'jewelry.addItem', { name: item.name, price: money(item.price) })
        }
        disabled={unavailable}
        onPress={() => onPick(item)}
        style={({ pressed }) => [
          styles.item,
          narrow && styles.itemNarrow,
          item.categoryId && styles.tile,
          quantity > 0 && { borderColor: theme.colors.accent },
          { opacity: unavailable ? 0.45 : pressed ? 0.6 : 1 },
        ]}
      >
        {quantity > 0 && (
          <View style={styles.count} accessibilityElementsHidden>
            <Text style={styles.countText}>×{quantity}</Text>
          </View>
        )}
        <DesignItem item={item} size={item.categoryId ? 44 : 48} />
        <Text numberOfLines={1} style={[styles.name, item.categoryId && styles.tileName]}>
          {item.name}
        </Text>
        {item.categoryId ? (
          <>
            <Text numberOfLines={1} style={styles.stock}>{t('jewelry.color', { color: item.color })}</Text>
            <Text numberOfLines={1} style={styles.tilePrice}>{t('jewelry.perBead', { price: money(item.price) })}</Text>
            <Text numberOfLines={1} style={[styles.stock, !item.stock && { color: theme.colors.danger }]}>
              {!item.stock ? t('readyMade.outOfStock') : atStockLimit ? t('jewelry.allInUse', { count: item.stock }) : t('counts.available', { count: item.stock })}
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
    tile: { width: '31%', maxWidth: '33%', paddingVertical: 10, gap: 3 },
    tileName: { fontSize: 11, fontWeight: '600', marginTop: 3 },
    tilePrice: { fontSize: 11, color: theme.colors.gold, fontWeight: '600' },
    stock: { fontSize: 9, color: theme.colors.muted },
    count: {
      position: 'absolute', top: 6, right: 6, zIndex: 1,
      minWidth: 22, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 9,
      backgroundColor: theme.colors.primary, alignItems: 'center',
    },
    countText: { fontSize: 9, fontWeight: '700', color: theme.colors.onPrimary },
    name: { fontSize: 10, color: theme.colors.text, textAlign: 'center' },
    price: { fontSize: 10, color: theme.colors.text, fontWeight: '600' },
  });
};

import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { items } from '@/services/catalog';
import { CustomizationItem, ItemType } from '@/types/models';
import { type Theme } from '@/constants/theme';
import { money } from '@/helper/pricing';
import { Chips, Field, Icon, useUI } from '@/components/common/ui';
import { DesignItem } from './DesignItem';
const categories: Record<string, ItemType | undefined> = {
  All: undefined,
  Beads: 'bead',
  Charms: 'charm',
  Letters: 'letter',
  Spacers: 'spacer',
};
export function BeadPicker({
  onPick,
  initialCategory = 'All',
  expanded = false,
  replacing,
  disabled = false,
}: {
  onPick: (item: CustomizationItem) => void;
  replacing: boolean;
  initialCategory?: string;
  expanded?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);

  const [category, setCategory] = useState(initialCategory in categories ? initialCategory : 'All');
  const [filterOpen, setFilterOpen] = useState(expanded);
  const [color, setColor] = useState('Any color');
  const [material, setMaterial] = useState('Any material');
  const [shape, setShape] = useState('Any shape');
  const [price, setPrice] = useState('Any price');
  const [search, setSearch] = useState('');
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (!categories[category] || item.type === categories[category]) &&
          (color === 'Any color' || item.color === color) &&
          (material === 'Any material' || item.material === material) &&
          (shape === 'Any shape' || item.shape === shape) &&
          (price === 'Any price' || item.price <= 50) &&
          item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [category, color, material, shape, price, search],
  );
  const active =
    color !== 'Any color' ||
    material !== 'Any material' ||
    shape !== 'Any shape' ||
    price !== 'Any price';
  return (
    <View style={{ gap: 16 }}>
      <View style={ui.between}>
        <View>
          <Text style={ui.sectionTitle}>The bead box</Text>
          <Text style={ui.caption}>
            {replacing
              ? 'Tap a piece to replace your selection'
              : 'Tap a little detail to add it to your story'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle bead filters"
          onPress={() => setFilterOpen(!filterOpen)}
          style={[ui.iconButton, active && { borderColor: theme.colors.accent }]}
        >
          <Icon name="options-outline" color={active ? theme.colors.accent : theme.colors.text} />
        </Pressable>
      </View>
      <Chips options={Object.keys(categories)} value={category} onChange={setCategory} />
      {filterOpen && (
        <View style={ui.card}>
          <Field
            label="Search components"
            placeholder="Find a bead, charm, or letter…"
            value={search}
            onChangeText={setSearch}
          />
          <Chips
            options={['Any color', ...new Set(items.map((item) => item.color))]}
            value={color}
            onChange={setColor}
          />
          <Chips
            options={['Any material', ...new Set(items.map((item) => item.material))]}
            value={material}
            onChange={setMaterial}
          />
          <Chips
            options={['Any shape', ...new Set(items.map((item) => item.shape))]}
            value={shape}
            onChange={setShape}
          />
          <Chips options={['Any price', 'Up to €0.50']} value={price} onChange={setPrice} />
          <Pressable
            onPress={() => {
              setColor('Any color');
              setMaterial('Any material');
              setShape('Any shape');
              setPrice('Any price');
              setSearch('');
            }}
          >
            <Text style={ui.textLink}>Reset filters</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.grid}>
        {visible.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={
              (replacing ? 'Replace with ' : 'Add ') + item.name + ', ' + money(item.price)
            }
            disabled={disabled || !item.available}
            onPress={() => onPick(item)}
            style={({ pressed }) => [styles.item, { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}
          >
            <DesignItem item={item} size={48} />
            <Text numberOfLines={1} style={styles.name}>
              {item.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}><Text style={styles.price}>{money(item.price)}</Text><Icon name="add-circle" size={24} color={theme.colors.primary} /></View>
          </Pressable>
        ))}
      </View>
      {!visible.length && (
        <Text style={[ui.body, { textAlign: 'center', padding: 20 }]}>
          No little treasures match these filters.
        </Text>
      )}
    </View>
  );
}
const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    item: {
      width: '30%',
      flexGrow: 1,
      maxWidth: '33%',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      padding: 8,
      alignItems: 'center',
      gap: 6,
    },
    name: { fontSize: 11, color: theme.colors.text },
    price: { fontSize: 11, color: theme.colors.text, fontWeight: '500' },
  });
};

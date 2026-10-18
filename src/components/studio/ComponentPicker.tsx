import { memo, useMemo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { CatalogComponent } from '@/api/catalogModels';
import { CatalogImage } from '@/components/products/CatalogImage';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';

export type PickerDrag = {
  onDragStart: (component: CatalogComponent, x: number, y: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (component: CatalogComponent, x: number, y: number, canceled: boolean) => void;
};

export interface PickerTab { key: string; label: string }

/** How many more of a component can be added; Infinity when stock is not tracked. */
export function remainingStock(component: CatalogComponent, used: number) {
  return component.trackStock === false ? Infinity : Math.max(component.stock - used, 0);
}

const ComponentCard = memo(function ComponentCard({ component, used, chosen, disabled, onAdd, drag }: {
  component: CatalogComponent;
  used: number;
  /** For one-of-a-kind groups (a wrap, a bag): this one is on the canvas. */
  chosen: boolean;
  disabled: boolean;
  onAdd: (component: CatalogComponent) => void;
  drag: PickerDrag;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const soldOut = component.trackStock !== false && component.stock <= 0;
  const left = remainingStock(component, used);
  const blocked = !chosen && (soldOut || left <= 0 || disabled);
  const gesture = useMemo(() => Gesture.Pan().activateAfterLongPress(220).runOnJS(true)
    .enabled(!blocked && !chosen)
    .onStart((event) => drag.onDragStart(component, event.absoluteX, event.absoluteY))
    .onUpdate((event) => drag.onDragMove(event.absoluteX, event.absoluteY))
    .onFinalize((event, success) => drag.onDragEnd(component, event.absoluteX, event.absoluteY, !success)),
  [component, blocked, chosen, drag]);
  const status = soldOut ? 'Sold out'
    : chosen ? 'On your design'
      : left === Infinity ? 'Available'
        : left <= 0 ? `All ${component.stock} in use` : `${left} available`;
  return (
    <GestureDetector gesture={gesture}>
      <Pressable accessibilityRole="button"
        accessibilityLabel={`${chosen ? 'Remove' : 'Add'} ${component.name}, ${money(component.price)}, ${status}`}
        accessibilityState={{ disabled: blocked, selected: chosen }}
        disabled={blocked} onPress={() => onAdd(component)}
        style={({ pressed }) => [styles.card, (used > 0 || chosen) && styles.cardUsed,
          { opacity: blocked ? 0.45 : pressed ? 0.7 : 1 }]}>
        {used > 0 && !chosen && (
          <View style={styles.count} accessibilityElementsHidden>
            <Text style={styles.countText}>×{used}</Text>
          </View>
        )}
        <View style={styles.image}>
          <CatalogImage imageUrl={component.imageUrl} name={component.name} size={64} />
        </View>
        <Text style={styles.name} numberOfLines={1}>{component.name}</Text>
        <Text style={styles.price}>{money(component.price)}</Text>
        <View style={styles.bottom}>
          <Text style={[styles.stock, soldOut && { color: theme.colors.danger }]} numberOfLines={1}>{status}</Text>
          <View style={[styles.add, blocked && styles.addOff, chosen && { backgroundColor: theme.colors.accent }]}>
            <Icon name={chosen ? 'checkmark' : 'add'} size={14} color={theme.colors.onPrimary} />
          </View>
        </View>
      </Pressable>
    </GestureDetector>
  );
});

/**
 * Filter chips over the already-loaded SubCategories, and a row of cards. Tap a card to
 * add it, or hold and drag it onto the canvas. `extra` renders a studio tool (e.g. Text)
 * when its tab is active instead of cards.
 */
export function ComponentPicker({ tabs, tab, onTab, components, usage, chosen, disabled, onAdd, drag, extra,
  empty }: {
  tabs: PickerTab[];
  tab: string;
  onTab: (key: string) => void;
  components: CatalogComponent[];
  usage: Record<string, number>;
  chosen: Set<string>;
  disabled?: boolean;
  onAdd: (component: CatalogComponent) => void;
  drag: PickerDrag;
  extra?: ReactNode;
  empty: string;
}) {
  const ui = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 12 }}>
      {tabs.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}
          accessibilityRole="tablist">
          {tabs.map((entry) => {
            const active = entry.key === tab;
            return (
              <Pressable key={entry.key} accessibilityRole="tab" accessibilityState={{ selected: active }}
                onPress={() => onTab(entry.key)} style={[ui.tab, active && ui.tabActive]}>
                <Text style={[ui.tabText, active && ui.tabTextActive]}>{entry.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      {extra ?? (components.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}
          keyboardShouldPersistTaps="handled">
          {components.map((component) => (
            <ComponentCard key={component.id} component={component} used={usage[component.id] ?? 0}
              chosen={chosen.has(component.id)} disabled={!!disabled} onAdd={onAdd} drag={drag} />
          ))}
        </ScrollView>
      ) : (
        <Text style={ui.empty}>{empty}</Text>
      ))}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    tab: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    tabActive: { backgroundColor: c.primary, borderColor: c.primary },
    tabText: { color: c.text, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: c.onPrimary },
    card: {
      width: 112, padding: 8, gap: 2, borderRadius: 16, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface,
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
    },
    cardUsed: { borderColor: c.accent },
    image: {
      height: 78, borderRadius: 12, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4, overflow: 'hidden',
    },
    name: { color: c.text, fontSize: 12, fontWeight: '600' },
    price: { color: c.gold, fontSize: 12, fontWeight: '700' },
    bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginTop: 2 },
    stock: { flex: 1, color: c.muted, fontSize: 10 },
    add: {
      width: 24, height: 24, borderRadius: 12, backgroundColor: c.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    addOff: { backgroundColor: c.border },
    count: {
      position: 'absolute', top: 6, right: 6, zIndex: 1, minWidth: 22, paddingHorizontal: 5,
      paddingVertical: 1, borderRadius: 9, backgroundColor: c.primary, alignItems: 'center',
    },
    countText: { color: c.onPrimary, fontSize: 9, fontWeight: '700' },
    empty: { color: c.muted, fontSize: 13, paddingVertical: 12 },
  });
};

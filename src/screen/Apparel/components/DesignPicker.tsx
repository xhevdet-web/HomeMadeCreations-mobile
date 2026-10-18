import { memo, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { CatalogComponent } from '@/api/catalogModels';
import { CatalogImage } from '@/components/products/CatalogImage';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';

type DragHandlers = {
  onDragStart: (design: CatalogComponent, x: number, y: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (design: CatalogComponent, x: number, y: number, canceled: boolean) => void;
};

const DesignTile = memo(function DesignTile({ design, used, onAdd, drag, strip }: {
  design: CatalogComponent;
  used: number;
  strip: boolean;
  onAdd: (design: CatalogComponent) => void;
  drag: DragHandlers;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  // Printed designs (trackStock false) are unlimited.
  const soldOut = design.trackStock !== false && used >= design.stock;
  const gesture = useMemo(() => Gesture.Pan().activateAfterLongPress(220).runOnJS(true)
    .enabled(!soldOut)
    .onStart((event) => drag.onDragStart(design, event.absoluteX, event.absoluteY))
    .onUpdate((event) => drag.onDragMove(event.absoluteX, event.absoluteY))
    .onFinalize((event, success) => drag.onDragEnd(design, event.absoluteX, event.absoluteY, !success)),
  [design, soldOut, drag]);
  return (
    <GestureDetector gesture={gesture}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Add ${design.name}, ${money(design.price)}`}
        disabled={soldOut} onPress={() => onAdd(design)}
        style={({ pressed }) => [styles.tile, strip && styles.stripTile, used > 0 && { borderColor: theme.colors.accent },
          { opacity: soldOut ? 0.45 : pressed ? 0.7 : 1 }]}>
        {used > 0 && (
          <View style={styles.count}>
            <Text style={styles.countText}>×{used}</Text>
          </View>
        )}
        <View style={styles.image}>
          <CatalogImage imageUrl={design.imageUrl} name={design.name} size={58} />
        </View>
        <Text style={styles.name} numberOfLines={1}>{design.name}</Text>
        <Text style={styles.price}>{money(design.price)}</Text>
        {soldOut && <Text style={styles.stock}>{design.stock ? 'All in use' : 'Out of stock'}</Text>}
      </Pressable>
    </GestureDetector>
  );
});

// Tab order and labels for the design types the dashboard uses.
const TYPES: Record<string, string> = {
  ICON: 'Icons', LOGO: 'Logos', LETTERING: 'Lettering', ILLUSTRATION: 'Illustrations',
};

/** "Upload your own design" tile: the customer's artwork for a fixed, admin-set price. */
function UploadTile({ price, used, disabled, onPress, strip }: UploadOffer & { strip: boolean }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={`Upload your own design, ${money(price)} once${used ? `, ${used} uploaded` : ''}`}
      disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.tile, strip && styles.stripTile, styles.uploadTile,
        { opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}>
      <View style={[styles.image, styles.uploadImage]}>
        <Icon name="cloud-upload-outline" size={26} color={theme.colors.accent} />
      </View>
      <Text style={styles.name} numberOfLines={1}>Your design</Text>
      <Text style={styles.price}>{used ? 'Added' : `${money(price)} once`}</Text>
    </Pressable>
  );
}

export interface UploadOffer {
  /** Charged once per design, however many own images are placed. */
  price: number;
  used: number;
  disabled: boolean;
  onPress: () => void;
}

export function DesignPicker({ designs, usage, onAdd, drag, layout = 'grid', upload }: {
  /** `strip` is one horizontal row, so the studio controls stay on screen. */
  layout?: 'grid' | 'strip';
  /** Shown first when the category offers "Your own design". */
  upload?: UploadOffer;
  designs: CatalogComponent[];
  usage: Record<string, number>;
  onAdd: (design: CatalogComponent) => void;
  drag: DragHandlers;
}) {
  const styles = useThemedStyles(createStyles);
  const [type, setType] = useState<string | null>(null);
  // Only show tabs for types that actually have designs.
  const types = Object.keys(TYPES).filter((key) =>
    designs.some((design) => design.type?.toUpperCase() === key));
  const visible = type ? designs.filter((design) => design.type?.toUpperCase() === type) : designs;
  return (
    <View style={{ gap: 10 }}>
      {layout === 'grid' ? (
        <View>
          <Text style={styles.heading}>Designs</Text>
          <Text style={styles.hint}>Tap to add, or hold and drag onto your piece.</Text>
        </View>
      ) : (
        <Text style={styles.label}>Designs</Text>
      )}
      {types.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[null, ...types].map((key) => {
            const active = key === type;
            return (
              <Pressable key={key ?? 'all'} accessibilityRole="tab" accessibilityState={{ selected: active }}
                onPress={() => setType(key)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {key ? TYPES[key] : 'All'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      {layout === 'strip' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}
          keyboardShouldPersistTaps="handled">
          {upload && <UploadTile {...upload} strip />}
          {visible.map((design) => (
            <DesignTile key={design.id} design={design} used={usage[design.id] ?? 0} onAdd={onAdd}
              drag={drag} strip />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.grid}>
          {upload && <UploadTile {...upload} strip={false} />}
          {visible.map((design) => (
            <DesignTile key={design.id} design={design} used={usage[design.id] ?? 0} onAdd={onAdd}
              drag={drag} strip={false} />
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    heading: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 19 },
    hint: { color: c.muted, fontSize: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tab: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    tabActive: { backgroundColor: c.primary, borderColor: c.primary },
    tabText: { color: c.text, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: c.onPrimary },
    stripTile: { width: 100 },
    label: { color: c.text, fontSize: 14, fontWeight: '600' },
    uploadTile: { borderStyle: 'dashed', borderColor: c.accent },
    uploadImage: { backgroundColor: c.soft },
    tile: {
      width: '31.5%', padding: 8, gap: 3, alignItems: 'center', borderRadius: 14,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    image: {
      width: '100%', height: 70, borderRadius: 10, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', marginBottom: 3,
    },
    name: { color: c.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },
    price: { color: c.gold, fontSize: 11, fontWeight: '600' },
    stock: { color: c.danger, fontSize: 9 },
    count: {
      position: 'absolute', top: 6, right: 6, zIndex: 1, minWidth: 22, paddingHorizontal: 5,
      paddingVertical: 1, borderRadius: 9, backgroundColor: c.primary, alignItems: 'center',
    },
    countText: { color: c.onPrimary, fontSize: 9, fontWeight: '700' },
  });
};

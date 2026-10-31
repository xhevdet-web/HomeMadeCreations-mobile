import { memo, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { CatalogComponent } from '@/api/catalogModels';
import type { PickerDrag } from '@/components/studio/ComponentPicker';
import { CatalogImage } from '@/components/products/CatalogImage';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

const TILE = 88;
const ALL = '';

/** A type as admins write it ("QUOTE", "flower-art") shown as a filter: "Quote", "Flower art". */
const typeLabel = (type: string) => {
  const words = type.trim().replace(/[_-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const DesignTile = memo(function DesignTile({ design, selected, onChoose, drag }: {
  design: CatalogComponent;
  selected: boolean;
  onChoose: (design: CatalogComponent) => void;
  drag: PickerDrag;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  // A short hold starts the drag, so a quick swipe still scrolls the row.
  const gesture = useMemo(() => Gesture.Pan().activateAfterLongPress(220).runOnJS(true)
    .onStart((event) => drag.onDragStart(design, event.absoluteX, event.absoluteY))
    .onUpdate((event) => drag.onDragMove(event.absoluteX, event.absoluteY))
    .onFinalize((event, success) => drag.onDragEnd(design, event.absoluteX, event.absoluteY, !success)),
  [design, drag]);
  return (
    <GestureDetector gesture={gesture}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected }}
        accessibilityLabel={t('stickers.studio.useDesign', { name: design.name })} onPress={() => onChoose(design)}
        style={({ pressed }) => [styles.tile, selected && styles.selected, { opacity: pressed ? 0.75 : 1 }]}>
        <View style={styles.image}>
          <CatalogImage imageUrl={design.imageUrl} name={design.name} size={TILE - 22} />
          {selected && (
            <View style={styles.check}>
              <Icon name="checkmark" size={12} color={theme.colors.onPrimary} />
            </View>
          )}
        </View>
        <Text style={styles.name} numberOfLines={1}>{design.name}</Text>
      </Pressable>
    </GestureDetector>
  );
});

/**
 * HomeMade's own sticker designs (the category's SubCategories). Tap one to put it on the
 * open design, or hold and drag it onto the sticker to drop it where you want.
 */
export function StickerDesignPicker({ designs, selectedId, onChoose, drag }: {
  designs: CatalogComponent[];
  /** The design of ours currently on the open sticker, if any. */
  selectedId: string | null;
  onChoose: (design: CatalogComponent) => void;
  drag: PickerDrag;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [type, setType] = useState(ALL);
  const types = [...new Set(designs.flatMap((design) => design.type?.trim() ? [design.type.trim().toUpperCase()] : []))];
  const shown = type === ALL ? designs : designs.filter((design) => design.type?.trim().toUpperCase() === type);
  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 2 }}>
        <Text style={styles.title}>{t('stickers.studio.ourDesigns')}</Text>
        <Text style={styles.hint}>{t('stickers.studio.ourDesignsHint')}</Text>
      </View>
      {types.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}
          accessibilityRole="tablist">
          {[ALL, ...types].map((entry) => {
            const active = entry === type;
            return (
              <Pressable key={entry || 'all'} accessibilityRole="tab" accessibilityState={{ selected: active }}
                onPress={() => setType(entry)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {entry === ALL ? t('stickers.studio.allDesigns') : typeLabel(entry)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {shown.map((design) => (
          <DesignTile key={design.id} design={design} selected={design.id === selectedId} onChoose={onChoose}
            drag={drag} />
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    title: { color: c.text, fontSize: 16, fontWeight: '600' },
    hint: { color: c.muted, fontSize: 12, lineHeight: 17 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { color: c.text, fontSize: 12, fontWeight: '600' },
    chipTextActive: { color: c.onPrimary },
    tile: {
      width: TILE, padding: 6, gap: 4, borderRadius: 16, borderWidth: 1.5, borderColor: c.border,
      backgroundColor: c.surface,
    },
    selected: { borderColor: c.accent },
    image: {
      height: TILE - 14, borderRadius: 12, backgroundColor: c.thumbnail, alignItems: 'center',
      justifyContent: 'center', overflow: 'hidden',
    },
    check: {
      position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10,
      backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center',
    },
    name: { color: c.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  });
};

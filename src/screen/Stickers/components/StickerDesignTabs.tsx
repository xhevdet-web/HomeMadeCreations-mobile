import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { artworkOf, MAX_STICKER_DESIGNS } from '@/helper/stickers';
import type { StickerDesign } from '@/store/stickerStore';

/** "Your designs": one numbered tab per design (✓ once it has artwork) and "+" up to five. */
export function StickerDesignTabs({ designs, activeId, onSelect, onAdd }: {
  designs: StickerDesign[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const full = designs.length >= MAX_STICKER_DESIGNS;
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.heading}>
        <Text style={styles.title}>{t('stickers.studio.yourDesigns')}</Text>
        <Text style={styles.caption}>{t('stickers.studio.maxDesigns', { count: MAX_STICKER_DESIGNS })}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}
        accessibilityRole="tablist">
        {designs.map((design, index) => {
          const active = design.id === activeId;
          const done = !!artworkOf(design);
          return (
            <Pressable key={design.id} accessibilityRole="tab" accessibilityState={{ selected: active }}
              accessibilityLabel={t(done ? 'stickers.studio.designTabDone' : 'stickers.studio.designTab',
                { number: index + 1 })}
              onPress={() => onSelect(design.id)}
              style={({ pressed }) => [styles.tab, active && styles.active, { opacity: pressed ? 0.8 : 1 }]}>
              <Text style={[styles.number, active && styles.activeText]}>{index + 1}</Text>
              {done && (
                <Icon name="checkmark-circle" size={15} color={active ? theme.colors.onPrimary : theme.colors.success} />
              )}
            </Pressable>
          );
        })}
        {!full && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('stickers.studio.addDesign')} onPress={onAdd}
            style={({ pressed }) => [styles.tab, styles.add, { opacity: pressed ? 0.8 : 1 }]}>
            <Icon name="add" size={18} color={theme.colors.accent} />
            <Text style={styles.addText}>{t('stickers.studio.addShort')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
    title: { color: c.text, fontSize: 16, fontWeight: '600' },
    caption: { color: c.muted, fontSize: 12 },
    row: { gap: 8 },
    tab: {
      minWidth: 52, height: 44, paddingHorizontal: 14, borderRadius: 14, flexDirection: 'row', gap: 5,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: c.border,
      backgroundColor: c.surface,
    },
    active: { borderColor: c.primary, backgroundColor: c.primary },
    number: { color: c.text, fontSize: 15, fontWeight: '700' },
    activeText: { color: c.onPrimary },
    add: { borderStyle: 'dashed', borderColor: c.accent },
    addText: { color: c.accent, fontSize: 13, fontWeight: '600' },
  });
};

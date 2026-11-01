import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { elementImage } from '@/services/mugDesign';
import type { MugElement } from '@/store/mugStore';

const THUMB = 52;

/**
 * Every image of the design, front first: tap one to select it, even when another image
 * covers it on the mug.
 */
export function MugLayers({ elements, selectedId, onSelect }: {
  /** In layer order, back to front. */
  elements: MugElement[];
  selectedId: string | null;
  onSelect: (element: MugElement) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  if (!elements.length) return null;
  const front = elements.map((element, index) => ({ element, number: index + 1 })).reverse();
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.title}>{t('mugs.studio.layers')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {front.map(({ element, number }) => {
          const active = element.id === selectedId;
          const uri = elementImage(element);
          return (
            <Pressable key={element.id} accessibilityRole="button" accessibilityState={{ selected: active }}
              accessibilityLabel={t('mugs.studio.selected', { number })} onPress={() => onSelect(element)}
              style={({ pressed }) => [styles.thumb, active && styles.active, { opacity: pressed ? 0.75 : 1 }]}>
              {uri && <Image source={{ uri }} resizeMode="contain" style={styles.image} />}
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{number}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    title: { color: c.text, fontSize: 14, fontWeight: '600' },
    thumb: {
      width: THUMB + 10, height: THUMB + 10, borderRadius: 14, borderWidth: 1.5, borderColor: c.border,
      // Images are shown on white, as on the mug.
      backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    },
    active: { borderColor: c.accent, borderWidth: 2 },
    image: { width: THUMB, height: THUMB },
    badge: {
      position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 4,
      alignItems: 'center', justifyContent: 'center', backgroundColor: c.elevated,
    },
    badgeActive: { backgroundColor: c.accent },
    badgeText: { color: c.text, fontSize: 11, fontWeight: '700' },
    badgeTextActive: { color: c.onPrimary },
  });
};

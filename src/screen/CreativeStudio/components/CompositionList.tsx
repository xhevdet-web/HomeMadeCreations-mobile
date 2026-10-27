import { StyleSheet, Text, View } from 'react-native';
import type { CatalogComponent } from '@/api/catalogModels';
import { IconButton } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export interface CompositionLine {
  component: CatalogComponent;
  count: number;
}

/**
 * Exactly what the customer is ordering, like a receipt: every piece with its quantity
 * and price, and − / + to change the quantity without hunting for it on the canvas.
 */
export function CompositionList({ title, lines, total, canAdd, onAdd, onRemove }: {
  title: string;
  lines: CompositionLine[];
  total: number;
  canAdd: (component: CatalogComponent) => boolean;
  onAdd: (component: CatalogComponent) => void;
  onRemove: (component: CatalogComponent) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  if (!lines.length) return null;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.total}>{money(total)}</Text>
      </View>
      {lines.map(({ component, count }) => (
        <View key={component.id} style={styles.row}>
          <View style={styles.thumb}>
            <CatalogImage imageUrl={component.imageUrl} name={component.name} size={34} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{component.name}</Text>
            <Text style={styles.meta}>{count} × {money(component.price)}</Text>
          </View>
          <View style={styles.stepper}>
            <IconButton name="remove" label={t('studio.removeOne', { name: component.name })} onPress={() => onRemove(component)} />
            <Text style={styles.count} accessibilityLabel={t('studio.countOf', { count, name: component.name })}>{count}</Text>
            <IconButton name="add" label={t('studio.addAnother', { name: component.name })} onPress={() => onAdd(component)}
              disabled={!canAdd(component)} />
          </View>
        </View>
      ))}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      gap: 10, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 18 },
    total: { color: c.gold, fontSize: 16, fontWeight: '700' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    thumb: {
      width: 42, height: 42, borderRadius: 12, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    name: { color: c.text, fontSize: 14, fontWeight: '600' },
    meta: { color: c.muted, fontSize: 12 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    count: { color: c.text, fontSize: 15, fontWeight: '700', minWidth: 18, textAlign: 'center' },
  });
};

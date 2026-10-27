import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme } from '@/hooks/useTheme';
import { CatalogComponent } from '@/api/catalogModels';
import { money } from '@/helper/pricing';

export function ComponentCard({
  component,
  selected,
  setSelected,
}: {
  component: CatalogComponent;
  selected: number;
  setSelected: (quantity: number) => void;
}) {
  const ui = useUI();
  const { t } = useTranslation();
  const theme = useTheme();
  const quantity = Math.min(selected, component.stock);
  return (
    <View
      style={{
        padding: 14,
        gap: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <CatalogImage imageUrl={component.imageUrl} name={component.name} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={ui.sectionTitle}>{component.name}</Text>
          <Text style={ui.caption}>{t('jewelry.color', { color: component.color || t('jewelry.notSpecified') })}</Text>
          <Text style={ui.caption}>{t('jewelry.typeLabel', { type: component.type || t('jewelry.notSpecified') })}</Text>
          <Text style={ui.label}>{t('jewelry.perBead', { price: money(component.price) })}</Text>
          <Text style={ui.caption}>
            {component.stock ? t('counts.available', { count: component.stock }) : t('readyMade.outOfStock')}
          </Text>
        </View>
      </View>
      <View style={[ui.between, { flexWrap: 'wrap', gap: 8 }]}>
        <Text style={ui.body}>{t('jewelry.quantity')}</Text>
        <View style={[ui.row, { gap: 12 }]}>
          <IconButton
            name="remove"
            label={t('jewelry.decrease', { name: component.name })}
            disabled={quantity === 0}
            onPress={() => setSelected(Math.max(0, quantity - 1))}
          />
          <Text accessibilityLabel={t('jewelry.quantityOf', { name: component.name, count: quantity })} style={ui.label}>
            {quantity}
          </Text>
          <IconButton
            name="add"
            label={t('jewelry.increase', { name: component.name })}
            disabled={quantity >= component.stock}
            onPress={() => setSelected(Math.min(component.stock, quantity + 1))}
          />
        </View>
      </View>
      <Text accessibilityLiveRegion="polite" style={ui.label}>
        {t('jewelry.subtotal', { price: money(component.price * quantity) })}
      </Text>
    </View>
  );
}

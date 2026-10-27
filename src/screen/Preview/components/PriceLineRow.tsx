import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton, useUI } from '@/components/common/ui';
import { money } from '@/helper/pricing';
import { OrderItem } from '@/types/models';

export function PriceLineRow({
  line,
  disabled,
  addDisabled,
  onRemove,
  onAdd,
}: {
  line: OrderItem;
  disabled: boolean;
  addDisabled: boolean;
  onRemove: () => void;
  onAdd: () => void;
}) {
  const ui = useUI();
  const { t } = useTranslation();
  return (
    <View style={{ gap: 8 }}>
      <View style={ui.between}>
        <Text style={[ui.label, { flex: 1 }]}>{line.name}</Text>
        <Text style={ui.label}>{money(line.quantity * line.unitPrice)}</Text>
      </View>
      <View style={ui.between}>
        <Text style={ui.caption}>{t('jewelry.each', { price: money(line.unitPrice) })}</Text>
        <View style={ui.row}>
          <IconButton
            name="remove"
            label={t('jewelry.removeOne', { name: line.name })}
            disabled={disabled}
            onPress={onRemove}
          />
          <Text style={ui.label}>{line.quantity}</Text>
          <IconButton
            name="add"
            label={t('jewelry.addOne', { name: line.name })}
            disabled={disabled || addDisabled}
            onPress={onAdd}
          />
        </View>
      </View>
    </View>
  );
}

import { Text, View } from 'react-native';
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
  return (
    <View style={{ gap: 8 }}>
      <View style={ui.between}>
        <Text style={[ui.label, { flex: 1 }]}>{line.name}</Text>
        <Text style={ui.label}>{money(line.quantity * line.unitPrice)}</Text>
      </View>
      <View style={ui.between}>
        <Text style={ui.caption}>{money(line.unitPrice)} each</Text>
        <View style={ui.row}>
          <IconButton
            name="remove"
            label={'Remove one ' + line.name}
            disabled={disabled}
            onPress={onRemove}
          />
          <Text style={ui.label}>{line.quantity}</Text>
          <IconButton
            name="add"
            label={'Add one ' + line.name}
            disabled={disabled || addDisabled}
            onPress={onAdd}
          />
        </View>
      </View>
    </View>
  );
}

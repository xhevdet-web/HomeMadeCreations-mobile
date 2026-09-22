import { useTheme } from '@/hooks/useTheme';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Design } from '@/types/models';
import { productById } from '@/services/catalog';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { Button, IconButton, useUI } from '@/components/common/ui';
import { designPrice, money } from '@/helper/pricing';
import { useDesignStore } from '@/store/designStore';
import { useCartStore } from '@/store/cartStore';

export function SavedDesignCard({
  design,
  onDuplicate,
  onDelete,
}: {
  design: Design;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const ui = useUI();

  const product = productById[design.productId];
  return (
    <View style={ui.card}>
      <View style={ui.row}>
        <View style={{ backgroundColor: theme.colors.thumbnail, borderRadius: 16 }}>
          <JewelryCanvas items={design.items} type={product.type} size={104} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text
            style={{ color: theme.colors.text, fontFamily: theme.fonts.editorial, fontSize: 21 }}
          >
            {design.name}
          </Text>
          <Text style={ui.caption}>
            {product.type} · {design.items.length} details
          </Text>
          <Text style={{ color: theme.colors.gold, fontSize: 17 }}>
            {money(designPrice(product.basePrice, design.items))}
          </Text>
        </View>
      </View>
      <View style={ui.between}>
        <View style={ui.row}>
          <IconButton
            name="create-outline"
            label={'Edit ' + design.name}
            onPress={() => {
              useDesignStore.getState().load(design);
              router.push('/designer');
            }}
          />
          <IconButton
            name="copy-outline"
            label={'Duplicate ' + design.name}
            onPress={onDuplicate}
          />
          <IconButton name="trash-outline" label={'Delete ' + design.name} onPress={onDelete} />
        </View>
        <Button
          title="Order"
          icon="arrow-forward"
          disabled={!design.items.length}
          onPress={() => {
            useCartStore.getState().setDesign(design);
            router.push('/checkout');
          }}
        />
      </View>
    </View>
  );
}

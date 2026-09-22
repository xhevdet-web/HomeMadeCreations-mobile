import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, Field, Header, Notice, Page, useUI } from '@/components/common/ui';
import { PriceBreakdown } from '@/components/common/PriceBreakdown';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { useDesignStore } from '@/store/designStore';
import { useAuthStore } from '@/store/authStore';
import { useSavedStore } from '@/store/savedStore';
import { useCartStore } from '@/store/cartStore';
import { itemById, productById } from '@/services/catalog';

export default function PreviewScreen() {
  const theme = useTheme();
  const ui = useUI();

  const design = useDesignStore();
  const [saved, setSaved] = useState(false);
  const { width } = useWindowDimensions();
  const product = productById[design.productId];
  function snapshot() {
    return design.snapshot(useAuthStore.getState().user?.id ?? 'guest');
  }
  if (!design.items.length)
    return (
      <Page>
        <Header title="Your preview" back />
        <EmptyState
          icon="sparkles-outline"
          title="Every story starts somewhere."
          description="Choose a few beads to see your own creation here."
          action="Open the studio"
          onPress={() => router.replace('/designer')}
        />
      </Page>
    );
  const beadCount = design.items.filter((item) => itemById[item.itemId].type === 'bead').length;
  const charmCount = design.items.filter((item) => itemById[item.itemId].type === 'charm').length;
  return (
    <Page>
      <Header title="Made by you" back />
      <View
        style={{ backgroundColor: theme.colors.preview, borderRadius: 24, paddingVertical: 12 }}
      >
        <Text style={[ui.eyebrow, { textAlign: 'center', marginTop: 15 }]}>ONE OF A KIND</Text>
        <JewelryCanvas items={design.items} type={product.type} size={Math.min(width - 54, 370)} />
      </View>
      <View>
        <Text style={ui.title}>Look what you made.</Text>
        <Text style={[ui.body, { marginTop: 9 }]}>
          A little piece of your personality, ready to wear.
        </Text>
      </View>
      <Field
        label="Give your creation a name"
        value={design.name}
        onChangeText={(name) => {
          design.rename(name);
          setSaved(false);
        }}
        maxLength={60}
      />
      <Text style={ui.body}>
        {product.name} · {design.size}
      </Text>
      <View style={[ui.card, ui.between]}>
        {[
          { label: 'Beads', count: beadCount },
          { label: 'Charms', count: charmCount },
          { label: 'Total details', count: design.items.length },
        ].map((stat) => (
          <View key={stat.label} style={{ alignItems: 'center', gap: 6 }}>
            <Text
              style={{ color: theme.colors.gold, fontSize: 23, fontFamily: theme.fonts.editorial }}
            >
              {stat.count}
            </Text>
            <Text style={ui.caption}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <View style={ui.card}>
        <Text style={ui.eyebrow}>EVERY LITTLE DETAIL</Text>
        <PriceBreakdown
          productName={product.name}
          basePrice={product.basePrice}
          items={design.items}
        />
      </View>
      {saved && <Notice text="Your creation is safely tucked away in My Designs." />}
      <Button
        title="Continue to order"
        icon="arrow-forward"
        onPress={() => {
          useCartStore.getState().setDesign(snapshot());
          router.push('/checkout');
        }}
      />
      <Button
        title={saved ? 'Design saved' : 'Save to My Designs'}
        secondary
        icon="heart-outline"
        onPress={() => {
          const entry = snapshot();
          useSavedStore.getState().save(entry);
          design.markSaved(entry.id);
          setSaved(true);
        }}
      />
      <Button title="Keep creating" secondary icon="create-outline" onPress={() => router.back()} />
    </Page>
  );
}

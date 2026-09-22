import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Chips, Header, Icon, Page, useUI } from '@/components/common/ui';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { productById, sampleItems } from '@/services/catalog';
import { money } from '@/helper/pricing';
import { useDesignStore } from '@/store/designStore';

export default function DetailsScreen() {
  const theme = useTheme();
  const ui = useUI();

  const { id } = useLocalSearchParams<{ id: string }>();
  const product = productById[id ?? 'bracelet-classic'];
  const [size, setSize] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  if (!product)
    return (
      <Page>
        <Header title="Piece not found" back />
        <Button title="Explore the collection" onPress={() => router.replace('/')} />
      </Page>
    );
  const selectedSize = size ?? product.sizes[1];
  return (
    <Page>
      <Header title="A beautiful beginning" back />
      <LinearGradient colors={theme.gradients.details} style={{ borderRadius: 24, padding: 12 }}>
        <Text style={[ui.eyebrow, { textAlign: 'center', marginTop: 15 }]}>
          {product.tag ?? 'MAKE IT YOURS'}
        </Text>
        <JewelryCanvas
          items={sampleItems(product)}
          type={product.type}
          size={Math.min(width - 70, 370)}
          decorative
        />
        <Text style={[ui.caption, { textAlign: 'center', marginBottom: 12 }]}>
          An idea to inspire you. Your design starts with a blank base.
        </Text>
      </LinearGradient>
      <View>
        <Text style={ui.eyebrow}>{product.type.toUpperCase()} COLLECTION</Text>
        <Text style={ui.title}>{product.name}</Text>
      </View>
      <View style={ui.between}>
        <Text style={ui.body}>Your blank canvas, from</Text>
        <Text style={{ fontSize: 25, color: theme.colors.accent }}>{money(product.basePrice)}</Text>
      </View>
      <Text style={ui.body}>{product.description}</Text>
      <View style={{ gap: 12 }}>
        <Text style={ui.label}>Choose your size</Text>
        <Chips options={product.sizes} value={selectedSize} onChange={setSize} />
      </View>
      <View style={ui.card}>
        <View style={ui.row}>
          <Icon name="diamond-outline" color={theme.colors.gold} />
          <Text style={ui.body}>Thoughtfully selected materials</Text>
        </View>
        <View style={ui.row}>
          <Icon name="heart-outline" color={theme.colors.gold} />
          <Text style={ui.body}>Handcrafted to your design</Text>
        </View>
      </View>
      <Button
        title="Create your design"
        icon="sparkles-outline"
        onPress={() => {
          useDesignStore.getState().start(product.id, selectedSize);
          router.push('/designer');
        }}
      />
      <Text style={[ui.caption, { textAlign: 'center' }]}>
        Beads and charms are priced individually as you create.
      </Text>
    </Page>
  );
}

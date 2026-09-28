import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { SavedProduct } from '@/services/commerceApi';
import { CatalogImage } from './CatalogImage';

export function ProductImagePreview({ product, onClose }: {
  product: SavedProduct | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const ui = useUI();
  const [imageSize, setImageSize] = useState(0);

  return <Modal visible={!!product} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
    <SafeAreaProvider>
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        {product && <View testID="product-image-preview" accessibilityViewIsModal style={styles.content}>
          <View style={styles.header}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[ui.eyebrow, { marginBottom: 0 }]}>A CLOSER LOOK</Text>
              <Text style={ui.caption}>Product preview</Text>
            </View>
            <IconButton name="close" label="Close image preview" onPress={onClose} />
          </View>

          <View style={[styles.imageStage, { backgroundColor: theme.colors.preview }]}
            onLayout={({ nativeEvent: { layout } }) => setImageSize(Math.max(0, Math.min(layout.width, layout.height) - 32))}>
            {imageSize > 0 && <CatalogImage key={product.id}
              imageUrl={product.designPreviewUrl ?? product.imageUrl} name={product.name} size={imageSize} />}
          </View>

          <View style={[styles.footer, { borderColor: theme.colors.border }]}>
            <Text numberOfLines={2} style={[ui.title, { fontSize: 28, lineHeight: 34 }]}>{product.name}</Text>
            <Text style={[ui.label, { fontSize: 16 }]}>{money(product.price)}</Text>
          </View>
        </View>}
      </SafeAreaView>
    </SafeAreaProvider>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: 960, alignSelf: 'center', padding: 22, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  imageStage: { flex: 1, minHeight: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  footer: { borderTopWidth: 1, paddingTop: 20, paddingBottom: 8, gap: 10 },
});

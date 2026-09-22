import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Product } from '@/types/models';
import { type Theme } from '@/constants/theme';
import { sampleItems } from '@/services/catalog';
import { money } from '@/helper/pricing';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { Icon, useUI } from '@/components/common/ui';

export function ProductCard({ product, width }: { product: Product; width: number }) {
  const theme = useTheme();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Customize ${product.name}, starting from ${money(product.basePrice)}`}
      onPress={() => router.push({ pathname: '/details', params: { id: product.id } })}
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.8 : 1 }]}
    >
      <LinearGradient
        colors={product.id === 'bracelet-pearl' ? theme.gradients.pearl : theme.gradients.product}
        style={styles.image}
      >
        {product.tag && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{product.tag}</Text>
          </View>
        )}
        <View style={{ marginTop: 12 }}>
          <JewelryCanvas
            items={sampleItems(product)}
            type={product.type}
            size={Math.min(width - 12, 265)}
            decorative
          />
        </View>
      </LinearGradient>
      <View style={styles.info}>
        <Text style={styles.type}>{product.type.toUpperCase()} · YOUR OWN STORY</Text>
        <Text style={styles.name}>{product.name}</Text>
        <View style={ui.between}>
          <View>
            <Text style={styles.from}>Starting from</Text>
            <Text style={styles.price}>{money(product.basePrice)}</Text>
          </View>
          <View style={styles.arrow}>
            <Icon name="arrow-forward" size={18} color={theme.colors.onPrimary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    card: {
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    image: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    tag: {
      position: 'absolute',
      top: 13,
      left: 12,
      zIndex: 1,
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: theme.colors.badge,
      borderRadius: 5,
    },
    tagText: { color: theme.colors.gold, fontSize: 7, letterSpacing: 1.1 },
    info: { padding: 15, gap: 10 },
    type: { fontSize: 7, color: theme.colors.muted, letterSpacing: 1 },
    name: { fontFamily: theme.fonts.editorial, fontSize: 20, color: theme.colors.text },
    from: { color: theme.colors.muted, fontSize: 10 },
    price: { color: theme.colors.text, fontSize: 16, fontWeight: '600', marginTop: 3 },
    arrow: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};

import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CatalogImage } from '@/components/products/CatalogImage';
import type { PackagingChoice } from '@/api/packagingModels';
import { PhotoStage } from '../PhotoStage';
import { PackagingArt } from './PackagingArt';

/**
 * The gift as it arrives, closed: the colour's own photo, else the packaging photo, else a
 * drawn box in the chosen colour and shape. Shown over the design; the design stays below.
 */
export function PackagedPreview({ packaging, size }: { packaging: PackagingChoice; size: number }) {
  const { color } = packaging;
  const photo = color?.imageUrl ?? packaging.imageUrl;
  return (
    <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, styles.center]}>
      <PhotoStage tone="GIFT" />
      {photo
        ? <CatalogImage imageUrl={photo} name={packaging.name} size={size * 0.82} />
        : <PackagingArt closed hex={color?.hex} shape={packaging.shape} size={size * 0.82} />}
      {/* A colour photo is the real thing; a general photo gets a swatch-coloured band. */}
      {!color?.imageUrl && photo && color && (
        <View style={[styles.band, { backgroundColor: color.hex }]} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  band: {
    position: 'absolute', bottom: 18, width: 64, height: 10, borderRadius: 5,
    borderWidth: 1, borderColor: '#00000022',
  },
});

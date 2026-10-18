import { Image } from 'react-native';

/** A garment image exactly as the admin uploaded it (never recoloured). */
export function GarmentImage({ uri, size }: { uri: string; size: number }) {
  return (
    <Image source={{ uri }} resizeMode="contain" style={{ width: size, height: size }}
      accessibilityIgnoresInvertColors />
  );
}

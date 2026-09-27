import { useState } from 'react';
import { Image } from 'react-native';

const placeholder = require('../../../assets/catalog-placeholder.png');

export function CatalogImage({ imageUrl, name, size }: { imageUrl?: string | null; name: string; size?: number }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const uri =
    typeof imageUrl === 'string' && /^https?:\/\//i.test(imageUrl.trim()) ? imageUrl.trim() : null;
  return (
    <Image
      source={uri && failedUrl !== uri ? { uri } : placeholder}
      defaultSource={placeholder}
      onError={() => setFailedUrl(uri)}
      accessibilityLabel={`${name} image`}
      resizeMode="contain"
      style={{ width: size ?? 96, height: size ?? 112, backgroundColor: 'transparent' }}
    />
  );
}

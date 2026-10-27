import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';

const placeholder = require('../../../assets/catalog-placeholder.png');

export function CatalogImage({ imageUrl, name, size }: { imageUrl?: string | null; name: string; size?: number }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { t } = useTranslation();
  const uri =
    // Remote catalog images, plus local picks (e.g. a customer's uploaded artwork).
    typeof imageUrl === 'string' && /^(https?:\/\/|file:|content:|blob:|data:image\/)/i.test(imageUrl.trim())
      ? imageUrl.trim() : null;
  return (
    <Image
      source={uri && failedUrl !== uri ? { uri } : placeholder}
      defaultSource={placeholder}
      onError={() => setFailedUrl(uri)}
      accessibilityLabel={t('productDetails.imageOf', { name })}
      resizeMode="contain"
      style={{ width: size ?? 96, height: size ?? 112, backgroundColor: 'transparent' }}
    />
  );
}

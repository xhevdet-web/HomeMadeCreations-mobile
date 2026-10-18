import { Image, Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { itemById } from './catalog';
import { DesignItem } from '@/types/models';

/** Captures a design view as an 840×840 PNG once its remote images have loaded. */
export async function captureViewPreview(view: View | null, imageUrls: (string | null | undefined)[]): Promise<string> {
  if (!view) throw new Error('The design preview is not ready. Please retry.');
  const urls = [...new Set(imageUrls.filter(
    (url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url),
  ))];
  // Allow the on-screen images to finish loading before the single capture on save.
  await Promise.allSettled(urls.map((url) => Image.prefetch(url)));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  try {
    const uri = await captureRef(view, {
      format: 'png',
      result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
      width: 840,
      height: 840,
    });
    if (!uri) throw new Error('Empty capture');
    return uri;
  } catch {
    throw new Error('Could not capture your design preview. Your design is safe; please retry.');
  }
}

export function captureDesignPreview(view: View | null, items: DesignItem[]): Promise<string> {
  return captureViewPreview(view, items.map((entry) => itemById[entry.itemId]?.imageUrl));
}

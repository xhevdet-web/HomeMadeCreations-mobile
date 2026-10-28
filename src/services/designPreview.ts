import { Image, PixelRatio, Platform, View } from 'react-native';
import i18n from '@/i18n';
import { File } from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { itemById } from './catalog';
import { DesignItem } from '@/types/models';

// The API accepts images up to 5 MB; stay well below it.
const MAX_PREVIEW_BYTES = 4.5 * 1024 * 1024;

/**
 * PNG keeps transparency (jewelry and apparel previews sit on any background). A JPEG
 * suits designs captured with their own backdrop (bouquets, gifts) and is several times
 * smaller: typically a few hundred KB instead of megabytes.
 */
export type PreviewFormat = {
  format: 'png' | 'jpg';
  /** Width in pixels. */
  pixels: number;
  /** Height divided by width; square (1) by default. Phone cases are tall. */
  aspect?: number;
};
const PNG_PREVIEW: PreviewFormat = { format: 'png', pixels: 840 };

/**
 * Captures at the requested real pixel size. Native snapshots are scaled by the screen
 * density (3× on most phones), so the size is given in points; if a design is still too
 * large, it is captured again smaller. Component photos are never embedded at their
 * original resolution: the preview only represents the design.
 */
async function capturePreview(view: Parameters<typeof captureRef>[0], output: PreviewFormat) {
  let side = output.pixels / (Platform.OS === 'web' ? 1 : PixelRatio.get());
  for (let attempt = 0; attempt < 3; attempt++) {
    const uri = await captureRef(view, {
      format: output.format,
      quality: output.format === 'jpg' ? 0.85 : 1,
      result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
      width: side,
      height: side * (output.aspect ?? 1),
    });
    if (!uri) throw new Error('Empty capture');
    if (Platform.OS === 'web') return uri;
    const file = new File(uri.startsWith('/') ? 'file://' + uri : uri);
    if (!file.exists || file.size <= MAX_PREVIEW_BYTES) return uri;
    side *= 0.7;
  }
  throw new Error('Preview too large');
}

/** Captures a design view (840×840 PNG by default) once its remote images have loaded. */
export async function captureViewPreview(view: View | null, imageUrls: (string | null | undefined)[],
  output: PreviewFormat = PNG_PREVIEW): Promise<string> {
  if (!view) throw new Error(i18n.t('studioMessages.previewNotReady'));
  const urls = [...new Set(imageUrls.filter(
    (url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url),
  ))];
  // Allow the on-screen images to finish loading before the single capture on save.
  await Promise.allSettled(urls.map((url) => Image.prefetch(url)));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  try {
    return await capturePreview(view as unknown as Parameters<typeof captureRef>[0], output);
  } catch {
    throw new Error(i18n.t('studioMessages.captureFailed'));
  }
}

export function captureDesignPreview(view: View | null, items: DesignItem[]): Promise<string> {
  return captureViewPreview(view, items.map((entry) => itemById[entry.itemId]?.imageUrl));
}

import { View } from 'react-native';
import i18n from '@/i18n';
import html2canvas from 'html2canvas';
import { DesignItem } from '@/types/models';

import type { PreviewFormat } from './designPreview';

const PNG_PREVIEW: PreviewFormat = { format: 'png', pixels: 840 };

/** Captures a design view (840×840 PNG by default) once its images have decoded. */
export async function captureViewPreview(view: View | null, _imageUrls: (string | null | undefined)[],
  output: PreviewFormat = PNG_PREVIEW): Promise<string> {
  if (!view) throw new Error(i18n.t('studioMessages.previewNotReady'));
  try {
    const element = view as unknown as HTMLElement;
    await Promise.all(Array.from(element.querySelectorAll('img')).map(image =>
      image.decode().catch(() => undefined)));
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      useCORS: true,
      logging: false,
      scale: output.pixels / element.getBoundingClientRect().width,
    });
    const result = document.createElement('canvas');
    const height = Math.round(output.pixels * (output.aspect ?? 1));
    result.width = output.pixels;
    result.height = height;
    const context = result.getContext('2d');
    if (!context) throw new Error('Preview canvas unavailable');
    context.drawImage(canvas, 0, 0, output.pixels, height);
    return output.format === 'jpg' ? result.toDataURL('image/jpeg', 0.85) : result.toDataURL('image/png');
  } catch {
    throw new Error(i18n.t('studioMessages.captureFailed'));
  }
}

export function captureDesignPreview(view: View | null, _items: DesignItem[]): Promise<string> {
  return captureViewPreview(view, []);
}

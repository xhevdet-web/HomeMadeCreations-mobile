import { useRef, useState } from 'react';
import { View } from 'react-native';
import { captureViewPreview, type PreviewFormat } from '@/services/designPreview';

// The canvas is captured with its studio backdrop, so no transparency is needed: a
// compressed JPEG keeps bouquet and gift previews small however many pieces they have.
const CANVAS_PREVIEW: PreviewFormat = { format: 'jpg', pixels: 1080 };

/**
 * Captures only the canvas (container, items, text) with editing handles hidden, using
 * the shared react-native-view-shot / html2canvas preview pipeline.
 */
export function useCanvasCapture() {
  const ref = useRef<View>(null);
  const [exporting, setExporting] = useState(false);
  async function capture(imageUrls: (string | null | undefined)[]) {
    setExporting(true);
    try {
      // Let React commit the clean canvas before taking its snapshot.
      await new Promise<void>((resolve) => requestAnimationFrame(() =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      return await captureViewPreview(ref.current, imageUrls, CANVAS_PREVIEW);
    } finally {
      setExporting(false);
    }
  }
  return { ref, exporting, capture };
}

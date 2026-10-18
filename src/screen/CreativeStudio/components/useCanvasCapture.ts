import { useRef, useState } from 'react';
import { View } from 'react-native';
import { captureViewPreview } from '@/services/designPreview';

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
      return await captureViewPreview(ref.current, imageUrls);
    } finally {
      setExporting(false);
    }
  }
  return { ref, exporting, capture };
}

import { useRef, useState } from 'react';
import { View } from 'react-native';
import { DesignItem } from '@/types/models';
import { captureDesignPreview } from '@/services/designPreview';

export function useDesignPreviewCapture() {
  const ref = useRef<View>(null);
  const [exporting, setExporting] = useState(false);
  async function capture(items: DesignItem[]) {
    setExporting(true);
    try {
      // Let React commit the clean canvas before taking its snapshot.
      await new Promise<void>(resolve => requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())));
      return await captureDesignPreview(ref.current, items);
    } finally {
      setExporting(false);
    }
  }
  return { ref, exporting, capture };
}

import { View } from 'react-native';
import html2canvas from 'html2canvas';
import { DesignItem } from '@/types/models';

export async function captureDesignPreview(view: View | null, _items: DesignItem[]): Promise<string> {
  if (!view) throw new Error('The design preview is not ready. Please retry.');
  try {
    const element = view as unknown as HTMLElement;
    await Promise.all(Array.from(element.querySelectorAll('img')).map(image =>
      image.decode().catch(() => undefined)));
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      useCORS: true,
      logging: false,
      scale: 840 / element.getBoundingClientRect().width,
    });
    const output = document.createElement('canvas');
    output.width = 840;
    output.height = 840;
    const context = output.getContext('2d');
    if (!context) throw new Error('Preview canvas unavailable');
    context.drawImage(canvas, 0, 0, 840, 840);
    return output.toDataURL('image/png');
  } catch {
    throw new Error('Could not capture your design preview. Your design is safe; please retry.');
  }
}

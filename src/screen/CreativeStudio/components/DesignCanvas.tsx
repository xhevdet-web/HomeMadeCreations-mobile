import type { TextLayer } from '@/api/builderModels';
import type { Transform } from '@/components/studio/PlacedItem';
import type { CanvasBuilder } from '@/helper/canvasStudio';
import { BouquetCanvas } from '../bouquet/BouquetCanvas';
import { GiftCanvas } from '../gift/GiftCanvas';
import type { CanvasItemsProps } from './CanvasItem';

/** The builder's own canvas; positioning rules live inside each canvas. */
export function DesignCanvas({ builder, texts, onTextChange, ...props }: CanvasItemsProps & {
  builder: CanvasBuilder;
  texts: TextLayer[];
  onTextChange?: (id: string, transform: Transform) => void;
}) {
  return builder === 'GIFT'
    ? <GiftCanvas {...props} texts={texts} onTextChange={onTextChange} />
    : <BouquetCanvas {...props} />;
}

import { View } from 'react-native';
import { DEFAULT_TRANSFORM } from '@/helper/caseStudio';
import { artworkOf, fitOf, stickerAspect, type StickerSize } from '@/helper/stickers';
import type { StickerDesign } from '@/store/stickerStore';
import { StickerCanvas } from './StickerCanvas';

const GAP = 0.06;

/**
 * All designs of a set laid out together in a square, as the set's product picture (it is
 * what gets captured as the design preview). 1–2 designs sit in one row, 3–4 in two rows of
 * two, and 5 in rows of three and two.
 */
export function StickerSetPreview({ size, designs, width }: {
  size: StickerSize;
  designs: StickerDesign[];
  /** Side of the square. */
  width: number;
}) {
  const count = Math.max(designs.length, 1);
  const columns = count <= 2 ? count : count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / columns);
  const gap = width * GAP;
  const cell = Math.min((width - gap * (columns + 1)) / columns, (width - gap * (rows + 1)) / rows);
  const aspect = stickerAspect(size);
  // Every sticker is the same size: as large as the cell allows at its proportions.
  const stickerWidth = aspect > 1 ? cell / aspect : cell;
  const lines = Array.from({ length: rows }, (_, row) => designs.slice(row * columns, row * columns + columns));
  return (
    <View style={{ width, height: width, justifyContent: 'center', gap }}>
      {lines.map((line, row) => (
        <View key={row} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap }}>
          {line.map((design) => (
            <View key={design.id} style={{ width: cell, height: cell, alignItems: 'center', justifyContent: 'center' }}>
              <StickerCanvas size={size} width={stickerWidth} imageUri={artworkOf(design)} fit={fitOf(design)}
                imageSize={design.imageSize} transform={artworkOf(design) ? design : DEFAULT_TRANSFORM} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

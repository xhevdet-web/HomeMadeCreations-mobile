import type { TFunction } from 'i18next';
import { cm } from '@/helper/jewelry';

/**
 * Stickers. A set is one shape and size (a size the admin offers on the Stickers category)
 * with 1–5 designs; each design is the customer's artwork placed like a phone case photo:
 * its centre (x/y, 0–1 of the sticker), a scale relative to "cover" and a rotation. These
 * are the values saved on each ProductItem, so a set restores the same on every phone.
 */
export const STICKER_SHAPES = ['SQUARE', 'CIRCLE', 'RECTANGLE', 'OVAL'] as const;
export type StickerShape = (typeof STICKER_SHAPES)[number];

/** The largest sticker that can be produced: 7 × 7 cm. Millimetres are authoritative. */
export const MAX_STICKER_MM = 70;
export const MAX_STICKER_DESIGNS = 5;
export const MAX_STICKERS_PER_DESIGN = 1000;
/** The fewest stickers in one order: of a ready-made sticker, or in a whole set. */
export const MIN_STICKERS_PER_ORDER = 5;
export const DEFAULT_STICKER_QUANTITY = 10;
/** Important artwork stays this far inside the cut edge. */
const SAFE_MARGIN_MM = 3;
/** Square and rectangle stickers are cut with slightly rounded corners. */
const CORNER_MM = 2;

/** How each shape is drawn and picked. A new shape is one more entry here. */
const SHAPES: Record<StickerShape, { outline: 'rect' | 'ellipse'; equalSides: boolean }> = {
  SQUARE: { outline: 'rect', equalSides: true },
  CIRCLE: { outline: 'ellipse', equalSides: true },
  RECTANGLE: { outline: 'rect', equalSides: false },
  OVAL: { outline: 'ellipse', equalSides: false },
};

export interface StickerSize {
  id: string;
  name: string;
  shape: StickerShape;
  widthMm: number;
  heightMm: number;
  /** Price of one printed sticker, in cents. */
  price: number;
}

const millimetres = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= MAX_STICKER_MM;

/** A category size (or a saved set's size snapshot) as a sticker size, else null. */
export function parseStickerSize(value: unknown): StickerSize | null {
  const size = value as Partial<StickerSize> | null;
  if (!size || typeof size !== 'object' || !STICKER_SHAPES.includes(size.shape as StickerShape)) return null;
  const shape = size.shape as StickerShape;
  if (typeof size.id !== 'string' || typeof size.name !== 'string' || !millimetres(size.widthMm)
      || !millimetres(size.heightMm) || (SHAPES[shape].equalSides && size.widthMm !== size.heightMm)
      || !Number.isSafeInteger(size.price) || size.price! < 0)
    return null;
  return { id: size.id, name: size.name, shape, widthMm: size.widthMm, heightMm: size.heightMm,
    price: size.price! };
}

export const shapeName = (t: TFunction, shape: StickerShape) => t(`stickers.shapes.${shape}`);

/** "⌀ 5 cm" for a circle, else "7 × 4 cm". */
export const stickerDimensions = (t: TFunction, size: Pick<StickerSize, 'shape' | 'widthMm' | 'heightMm'>) =>
  size.shape === 'CIRCLE'
    ? t('stickers.diameter', { size: cm(size.widthMm) })
    : t('stickers.dimensions', { width: cm(size.widthMm), height: cm(size.heightMm) });

/** "Square • 5 × 5 cm" */
export const stickerSizeLine = (t: TFunction, size: StickerSize) =>
  `${shapeName(t, size.shape)} • ${stickerDimensions(t, size)}`;

/** Height ÷ width of the sticker. */
export const stickerAspect = (size: Pick<StickerSize, 'widthMm' | 'heightMm'>) => size.heightMm / size.widthMm;

interface Frame { left: number; top: number; width: number; height: number }

function roundedRect({ left: x, top: y, width: w, height: h }: Frame, radius: number) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  return `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} `
    + `A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} `
    + `V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
}

function ellipse({ left, top, width, height }: Frame) {
  const rx = width / 2;
  const ry = height / 2;
  const cy = top + ry;
  return `M${left},${cy} A${rx},${ry} 0 1 0 ${left + width},${cy} A${rx},${ry} 0 1 0 ${left},${cy} Z`;
}

/**
 * SVG paths for a sticker drawn `width` points wide: the cut edge (the artwork is clipped
 * to it) and the dashed safe area inside it.
 */
export function stickerOutline(size: StickerSize, width: number) {
  const height = width * stickerAspect(size);
  const perMm = width / size.widthMm;
  const edge = { left: 0, top: 0, width, height };
  const inset = SAFE_MARGIN_MM * perMm;
  const safe = { left: inset, top: inset, width: width - inset * 2, height: height - inset * 2 };
  const rect = SHAPES[size.shape].outline === 'rect';
  return {
    height,
    edge: rect ? roundedRect(edge, CORNER_MM * perMm) : ellipse(edge),
    safe: rect ? roundedRect(safe, Math.max(0, CORNER_MM - SAFE_MARGIN_MM) * perMm) : ellipse(safe),
  };
}

/** About 150 dpi. A simple pixel check that only warns about images that will look soft. */
const MIN_PIXELS_PER_MM = 6;

/** Whether the image has too few pixels for the sticker's real size at the current zoom. */
export function isLowQualitySticker(image: { width: number; height: number } | null | undefined,
  size: Pick<StickerSize, 'widthMm' | 'heightMm'>, scale: number) {
  if (!image?.width || !image.height) return false;
  // Millimetres one image pixel covers at scale 1 ("cover"), then at the current zoom.
  const mmPerPixel = Math.max(size.widthMm / image.width, size.heightMm / image.height) / scale;
  return 1 / mmPerPixel < MIN_PIXELS_PER_MM;
}

/**
 * A design's picture: the customer's upload, else the chosen design of ours. Uploads are
 * photos that fill the sticker ("cover"); our designs are transparent PNGs that sit inside
 * it ("contain"), so their scale is relative to that fit. Which one it is follows from the
 * saved item: an uploaded image, or the SubCategory's image.
 */
export const artworkOf = (design: { imageUri?: string; designImageUrl?: string }) =>
  design.imageUri ?? design.designImageUrl;
export const fitOf = (design: { imageUri?: string }) => (design.imageUri ? 'cover' : 'contain');
/** Our designs start a little inside the cut edge. */
export const LIBRARY_DESIGN_SCALE = 0.8;

/** Physical stickers in a set. */
export const stickerCount = (designs: { quantity: number }[]) =>
  designs.reduce((sum, design) => sum + design.quantity, 0);

export const clampQuantity = (quantity: number) =>
  Math.min(Math.max(Math.round(quantity) || 1, 1), MAX_STICKERS_PER_DESIGN);

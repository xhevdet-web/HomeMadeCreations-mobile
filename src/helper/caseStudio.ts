/**
 * Phone case geometry. The one design is placed by its centre (x/y, 0–1 of the printable
 * area), a scale relative to "cover" (1 fills the area edge to edge, like
 * resizeMode="cover") and a rotation in degrees. These are the values saved on the
 * ProductItem, so a design restores the same on every screen and every phone.
 */
export interface CaseTransform { x: number; y: number; scale: number; rotation: number }
export interface Size { width: number; height: number }

export const DEFAULT_TRANSFORM: CaseTransform = { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
// The API accepts 0.1–5; below 0.3 a design is too small to place by hand.
export const MIN_CASE_SCALE = 0.3;
export const MAX_CASE_SCALE = 5;

/** Size of the image at scale 1: the smallest size that covers the whole area. */
export function coverSize(area: Size, image: Size): Size {
  const factor = Math.max(area.width / image.width, area.height / image.height);
  return { width: image.width * factor, height: image.height * factor };
}

const round = (value: number) => Math.round(value * 10000) / 10000;

/** Keeps the centre on the area and the scale usable; rotation is kept within ±180°. */
export function clampTransform(next: CaseTransform): CaseTransform {
  const rotation = ((((next.rotation + 180) % 360) + 360) % 360) - 180;
  return {
    x: round(Math.min(Math.max(next.x, 0), 1)),
    y: round(Math.min(Math.max(next.y, 0), 1)),
    scale: round(Math.min(Math.max(next.scale, MIN_CASE_SCALE), MAX_CASE_SCALE)),
    rotation: Math.round(rotation * 10) / 10,
  };
}

/**
 * About 150 dpi across a phone case back (≈ 7–8 cm). This is a simple pixel check, not a
 * print-quality guarantee: it only warns about images that will clearly look soft.
 */
const MIN_PIXELS_ACROSS = 450;

/**
 * Whether the photo has too few pixels for the area at the current zoom. `areaAspect` is
 * the printable area's height divided by its width.
 */
export function isLowQuality(image: Size | null | undefined, areaAspect: number, scale: number) {
  if (!image?.width || !image.height) return false;
  const cover = Math.max(1 / image.width, areaAspect / image.height);
  return 1 / (cover * scale) < MIN_PIXELS_ACROSS;
}

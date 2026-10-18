// Category builders decide which studio a category opens. Never infer a builder from a
// category name; categories without a builderType keep the original jewelry studio.
export const BUILDER_TYPES = ['JEWELRY', 'BOUQUET', 'GIFT', 'APPAREL'] as const;
export type BuilderType = (typeof BUILDER_TYPES)[number];

export const DESIGN_SIDES = ['FRONT', 'BACK'] as const;

/** SubCategory type of the admin's "Your own design": the customer uploads the image. */
export const CUSTOM_UPLOAD = 'CUSTOM_UPLOAD';
/** Backend limit for uploaded images per design. */
export const MAX_CUSTOM_UPLOADS = 4;
export type DesignSide = (typeof DESIGN_SIDES)[number];

export type CategoryOption =
  | { key: string; name: string; required: boolean; type: 'select'; values: string[] }
  | { key: string; name: string; required: boolean; type: 'color'; values: { name: string; value: string }[] }
  | { key: string; name: string; required: boolean; type: 'number'; min?: number; max?: number }
  | { key: string; name: string; required: boolean; type: 'text'; maxLength?: number };

/** What the customer picked; colours are sent as their configured `value`. */
export type SelectedOptions = Record<string, string | number>;

/** Fractions (0–1) of a garment mockup. */
export interface PrintArea { x: number; y: number; width: number; height: number }

/** Builder-wide category settings, e.g. { silhouette: 'NECKLACE' } for a strand. */
export interface BuilderConfig {
  silhouette?: string;
}

/** One design placed on a garment side. x/y are the centre, 0–1 within the print area. */
export interface ApparelPlacement {
  id: string;
  subCategoryId: string;
  side: DesignSide;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  /** Customer artwork (local file, data URI or stored URL) for a CUSTOM_UPLOAD design. */
  imageUri?: string;
}

/**
 * One component placed freely on a one-canvas builder (BOUQUET, GIFT). x/y are the
 * centre, 0–1 of the canvas, so a design restores the same on every screen size.
 * Array order is the stacking order within a layer (later = in front).
 */
export interface CanvasPlacement {
  id: string;
  subCategoryId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export const TEXT_FONTS = ['SERIF', 'SANS', 'SCRIPT'] as const;
export type TextFont = (typeof TEXT_FONTS)[number];
/** Backend limit for personalised text layers on a gift. */
export const MAX_TEXT_LAYERS = 6;
export const MAX_TEXT_LENGTH = 80;

/** Personalised text on a GIFT canvas. Not a SubCategory: it is free and has no stock. */
export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color?: string;
  font?: TextFont;
}

const finite = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/** Text layers stored on a Product; drops anything the app cannot render. */
export function parseTextLayers(value: unknown): TextLayer[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): TextLayer[] => {
    if (!isObject(raw) || typeof raw.id !== 'string' || typeof raw.text !== 'string' || !raw.text.trim())
      return [];
    return [{
      id: raw.id,
      text: raw.text,
      x: finite(raw.x, 0.5),
      y: finite(raw.y, 0.5),
      scale: finite(raw.scale, 1),
      rotation: finite(raw.rotation, 0),
      ...(typeof raw.color === 'string' ? { color: raw.color } : {}),
      ...(TEXT_FONTS.includes(raw.font as TextFont) ? { font: raw.font as TextFont } : {}),
    }];
  });
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export function parseBuilderType(value: unknown): BuilderType | null {
  return BUILDER_TYPES.includes(value as BuilderType) ? (value as BuilderType) : null;
}

// Options are validated by the backend; drop anything the app cannot render.
export function parseCategoryOptions(value: unknown): CategoryOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): CategoryOption[] => {
    if (!isObject(raw) || typeof raw.key !== 'string' || typeof raw.name !== 'string') return [];
    const base = { key: raw.key, name: raw.name, required: raw.required === true };
    if (raw.type === 'select' && Array.isArray(raw.values))
      return [{ ...base, type: 'select', values: raw.values.filter((v): v is string => typeof v === 'string') }];
    if (raw.type === 'color' && Array.isArray(raw.values))
      return [{
        ...base, type: 'color',
        values: raw.values.filter((v): v is { name: string; value: string } =>
          isObject(v) && typeof v.name === 'string' && typeof v.value === 'string'),
      }];
    if (raw.type === 'number')
      return [{ ...base, type: 'number',
        min: typeof raw.min === 'number' ? raw.min : undefined,
        max: typeof raw.max === 'number' ? raw.max : undefined }];
    if (raw.type === 'text')
      return [{ ...base, type: 'text', maxLength: typeof raw.maxLength === 'number' ? raw.maxLength : undefined }];
    return [];
  });
}

export function parseBuilderConfig(value: unknown): BuilderConfig | null {
  if (!isObject(value)) return null;
  return typeof value.silhouette === 'string' ? { silhouette: value.silhouette } : {};
}

/** Human-readable value of a selected option, e.g. "Black" for a colour value. */
export function optionLabel(option: CategoryOption | undefined, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (option?.type === 'color') {
    const raw = typeof value === 'object' && value && 'value' in value
      ? String((value as { value: unknown }).value) : String(value);
    const named = typeof value === 'object' && value && 'name' in value
      ? String((value as { name: unknown }).name) : undefined;
    return named ?? option.values.find((color) => color.value === raw)?.name ?? raw;
  }
  return String(value);
}

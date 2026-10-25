import { Platform, Text, View } from 'react-native';
import type { TextFont, TextLayer as TextLayerModel, TextWeight } from '@/api/builderModels';
import { PlacedItem, type Frame, type Transform } from '@/components/studio/PlacedItem';
import { clampInside, TEXT_BOX, type Bounds } from '@/helper/canvasStudio';

export const TEXT_COLORS = [
  { name: 'Navy', value: '#2D3250' },
  { name: 'Rose', value: '#C2577A' },
  { name: 'Gold', value: '#A67C2E' },
  { name: 'Black', value: '#1E1E1E' },
  { name: 'White', value: '#FFFFFF' },
];

export const FONT_LABELS: Record<TextFont, string> = { SERIF: 'Classic', SANS: 'Modern', SCRIPT: 'Script' };

export const WEIGHT_LABELS: Record<TextWeight, string> = { LIGHT: 'Light', REGULAR: 'Regular', BOLD: 'Bold' };

export function fontFamily(font: TextFont | undefined, weight: TextWeight = 'REGULAR') {
  if (font === 'SANS') {
    // Android's sans-serif families carry their own weight.
    const android = weight === 'LIGHT' ? 'sans-serif-light' : weight === 'BOLD' ? 'sans-serif' : 'sans-serif-medium';
    return Platform.select({ ios: 'Avenir Next', android, default: 'system-ui, sans-serif' });
  }
  if (font === 'SCRIPT')
    return Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: '"Brush Script MT", "Segoe Script", cursive' });
  return Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
}

/** Font, weight and slant of a text, as React Native text style. */
export function textStyle(layer: Pick<TextLayerModel, 'font' | 'weight' | 'italic'>) {
  const weight = layer.weight ?? 'REGULAR';
  return {
    fontFamily: fontFamily(layer.font, weight),
    fontWeight: weight === 'BOLD' ? '700' : weight === 'LIGHT' ? '300' : layer.font === 'SANS' ? '500' : '400',
    fontStyle: layer.italic ? 'italic' : 'normal',
  } as const;
}

// Inside a garment's print area the text box starts at 90% of the area's width.
const AREA_TEXT_WIDTH = 0.9;
const WHOLE: Bounds = { left: 0, top: 0, right: 1, bottom: 1 };

/**
 * Personalised text, moved, resized and rotated like any item. On a canvas (gift, bouquet)
 * x/y are fractions of the canvas and `bounds` keeps it on the gift bag; with a `frame`
 * (a garment's print area, in pixels) x/y are within that area and it stays inside it.
 */
export function TextLayer({ layer, size, bounds, frame, selected, editable, zIndex, onSelect, onChange,
  onRemove }: {
  layer: TextLayerModel;
  size: number;
  bounds: Bounds | null;
  frame?: Frame;
  selected: boolean;
  editable: boolean;
  zIndex: number;
  onSelect?: (id: string) => void;
  onChange?: (id: string, transform: Transform) => void;
  onRemove?: (id: string) => void;
}) {
  const area = frame ?? { left: 0, top: 0, width: size, height: size };
  const width = frame ? AREA_TEXT_WIDTH * frame.width : TEXT_BOX.width * size;
  const height = width * (TEXT_BOX.height / TEXT_BOX.width);
  // The box as shares of the area it moves in, for keeping all of it inside.
  const box = { width: width / area.width, height: height / area.height };
  const script = layer.font === 'SCRIPT';
  return (
    <PlacedItem
      transform={layer}
      frame={area}
      width={width}
      height={height}
      clamp={(next) => clampInside(next, box, frame ? WHOLE : bounds)}
      label={`Text “${layer.text}”`}
      name="text"
      selected={selected}
      editable={editable}
      zIndex={zIndex}
      onSelect={() => onSelect?.(layer.id)}
      onChange={(transform) => onChange?.(layer.id, transform)}
      onRemove={() => onRemove?.(layer.id)}
    >
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
        <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}
          style={{
            maxWidth: width, textAlign: 'center',
            fontSize: width * (script ? 0.125 : 0.1), ...textStyle(layer),
            color: layer.color ?? TEXT_COLORS[0].value,
          }}>
          {layer.text}
        </Text>
      </View>
    </PlacedItem>
  );
}

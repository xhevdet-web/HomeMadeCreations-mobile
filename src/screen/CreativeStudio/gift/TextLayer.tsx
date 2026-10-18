import { Platform, Text, View } from 'react-native';
import type { TextFont, TextLayer as TextLayerModel } from '@/api/builderModels';
import { PlacedItem, type Transform } from '@/components/studio/PlacedItem';
import { clampText, TEXT_BOX } from '@/helper/canvasStudio';

export const TEXT_COLORS = [
  { name: 'Navy', value: '#2D3250' },
  { name: 'Rose', value: '#C2577A' },
  { name: 'Gold', value: '#A67C2E' },
  { name: 'Black', value: '#1E1E1E' },
  { name: 'White', value: '#FFFFFF' },
];

export const FONT_LABELS: Record<TextFont, string> = { SERIF: 'Classic', SANS: 'Modern', SCRIPT: 'Script' };

export function fontFamily(font: TextFont | undefined) {
  if (font === 'SANS') return Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium', default: 'system-ui, sans-serif' });
  if (font === 'SCRIPT')
    return Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: '"Brush Script MT", "Segoe Script", cursive' });
  return Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
}

/** Personalised text on the gift: moved, resized and rotated like any item. */
export function TextLayer({ layer, size, selected, editable, zIndex, onSelect, onChange, onRemove }: {
  layer: TextLayerModel;
  size: number;
  selected: boolean;
  editable: boolean;
  zIndex: number;
  onSelect?: (id: string) => void;
  onChange?: (id: string, transform: Transform) => void;
  onRemove?: (id: string) => void;
}) {
  const width = TEXT_BOX.width * size;
  const height = TEXT_BOX.height * size;
  const script = layer.font === 'SCRIPT';
  return (
    <PlacedItem
      transform={layer}
      frame={{ left: 0, top: 0, width: size, height: size }}
      width={width}
      height={height}
      clamp={clampText}
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
            fontSize: size * (script ? 0.07 : 0.056), fontFamily: fontFamily(layer.font),
            fontWeight: layer.font === 'SANS' ? '600' : '400',
            color: layer.color ?? TEXT_COLORS[0].value,
          }}>
          {layer.text}
        </Text>
      </View>
    </PlacedItem>
  );
}

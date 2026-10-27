import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CanvasPlacement, TextLayer as TextLayerModel } from '@/api/builderModels';
import type { CatalogComponent } from '@/api/catalogModels';
import type { Transform } from '@/components/studio/PlacedItem';
import { CatalogImage } from '@/components/products/CatalogImage';
import { boundsFor, groupOf, type CanvasBuilder } from '@/helper/canvasStudio';
import type { CanvasBase } from '@/store/canvasStore';
import { CanvasItem } from './CanvasItem';
import { StudioScene } from './StudioScene';
import { TextLayer } from './TextLayer';

/** Layers, back to front: base product, pieces (in their own order), text, the piece being edited. */
const Z = { base: 1, items: 10, text: 5000, lifted: 9000 };

/**
 * The shared free-design canvas of the Bouquet and Gift studios. The base product photo is
 * the fixed reference, or, without a photo, a line drawing of a bouquet or gift bag; every
 * piece and text is placed, sized, rotated and layered by the customer. Nothing here
 * decides how the design should look. Positions are fractions of the canvas, so a design
 * renders the same on every screen size.
 */
export function FreeDesignCanvas({ builder, size, base, placements, components, texts, selectedId,
  editable = true, onSelect, onChange, onRemove, onTextChange }: {
  builder: CanvasBuilder;
  size: number;
  base: CanvasBase | null;
  /** In layer order, back to front. */
  placements: CanvasPlacement[];
  components: Record<string, CatalogComponent>;
  texts: TextLayerModel[];
  selectedId?: string | null;
  editable?: boolean;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, transform: Transform) => void;
  onRemove?: (id: string) => void;
  onTextChange?: (id: string, transform: Transform) => void;
}) {
  // The drawn gift bag holds the pieces; a base photo or a bouquet uses the whole canvas.
  const bounds = boundsFor(builder, !!base?.imageUrl);
  const { t } = useTranslation();
  const lifted = (id: string, zIndex: number) => (editable && id === selectedId ? Z.lifted : zIndex);
  return (
    <View style={{ width: size, height: size }}
      accessibilityLabel={t(texts.length ? 'canvasStudio.canvasLabelText' : 'canvasStudio.canvasLabel', {
        name: base?.name ?? t(builder === 'BOUQUET' ? 'canvasStudio.bouquet' : 'canvasStudio.gift'),
        pieces: t('counts.piece', { count: placements.length }), count: texts.length })}>
      <Pressable accessible={false} style={[StyleSheet.absoluteFill, { zIndex: 0 }]} disabled={!editable}
        onPress={() => onSelect?.(null)}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, { zIndex: Z.base }]}>
          {base?.imageUrl
            ? <CatalogImage imageUrl={base.imageUrl} name={base.name} size={size} />
            : <StudioScene builder={builder} size={size} labels={editable} />}
        </View>
      </Pressable>
      {placements.map((placement, index) => (
        <CanvasItem key={placement.id} placement={placement} component={components[placement.subCategoryId]}
          group={groupOf(builder, components[placement.subCategoryId]?.type)} size={size} bounds={bounds}
          selected={placement.id === selectedId} editable={editable}
          zIndex={lifted(placement.id, Z.items + index)} onSelect={onSelect} onChange={onChange}
          onRemove={onRemove} />
      ))}
      {texts.map((layer, index) => (
        <TextLayer key={layer.id} layer={layer} size={size} bounds={bounds} selected={layer.id === selectedId}
          editable={editable} zIndex={lifted(layer.id, Z.text + index)}
          onSelect={(id) => onSelect?.(id)} onChange={onTextChange} onRemove={onRemove} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});

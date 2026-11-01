import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Rect } from 'react-native-svg';
import { Icon } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import type { CaseTransform, Size } from '@/helper/caseStudio';
import type { TextLayer as TextLayerModel } from '@/api/builderModels';
import { printAspect, safeBounds, textBoxShare, type MugPrintArea } from '@/helper/mugs';
import { TextLayer } from '@/screen/CreativeStudio/components/TextLayer';
import type { MugElement } from '@/store/mugStore';
import { MugArtworkElement } from './MugArtworkElement';

// The mug is white: the print is drawn on white whatever the app theme.
const PAPER = '#FFFFFF';
const noop = () => undefined;

/**
 * The flat print of the mug, at the real print area's proportions: everything here is
 * printed, and nothing outside it. While editing, a dashed line shows the safe area.
 * Without guides it is exactly the print file (captured for production).
 */
export function MugPrintCanvas({ area, width, elements, texts = [], selectedId = null, editable = false,
  guides = false, onSelect, onChange, onImageSize, onAdd }: {
  area: MugPrintArea;
  width: number;
  elements: MugElement[];
  texts?: TextLayerModel[];
  selectedId?: string | null;
  editable?: boolean;
  guides?: boolean;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, next: CaseTransform) => void;
  onImageSize?: (id: string, size: Size) => void;
  onAdd?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const height = width * printAspect(area);
  const perMm = width / area.widthMm;
  const safe = area.safeMm;
  return (
    <View style={[styles.print, { width, height }]}
      accessibilityLabel={elements.length ? t('mugs.studio.canvasLabel') : t('mugs.studio.canvasEmpty')}>
      {/* Tapping the empty print clears the selection. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => onSelect?.(null)} disabled={!editable}
        accessible={false} />
      {elements.map((element) => (
        <MugArtworkElement key={element.id} element={element} area={area} width={width} editable={editable}
          selected={element.id === selectedId} onSelect={onSelect ?? noop} onChange={onChange ?? noop}
          onImageSize={onImageSize ?? noop} />
      ))}
      {texts.map((layer, index) => (
        <TextLayer key={layer.id} layer={layer} size={width} bounds={safeBounds(area)}
          frame={{ left: 0, top: 0, width, height }} boxShare={textBoxShare(area)} selected={false}
          editable={false} zIndex={1000 + index} />
      ))}
      {guides && (
        <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
          <Rect x={0.75} y={0.75} width={width - 1.5} height={height - 1.5} fill="none" stroke={theme.colors.border}
            strokeWidth={1.5} />
          <Rect x={safe.left * perMm} y={safe.top * perMm}
            width={width - (safe.left + safe.right) * perMm} height={height - (safe.top + safe.bottom) * perMm}
            fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={2.5} />
          <Rect x={safe.left * perMm} y={safe.top * perMm}
            width={width - (safe.left + safe.right) * perMm} height={height - (safe.top + safe.bottom) * perMm}
            fill="none" stroke={theme.colors.accent} strokeWidth={1.5} strokeDasharray="6 5" />
        </Svg>
      )}
      {guides && !elements.length && onAdd && (
        <Pressable accessibilityRole="button" accessibilityLabel={t('mugs.studio.upload')} onPress={onAdd}
          style={({ pressed }) => [StyleSheet.absoluteFill, styles.empty, { opacity: pressed ? 0.7 : 1 }]}>
          <View style={[styles.plus, { borderColor: theme.colors.accent }]}>
            <Icon name="add" size={22} color={theme.colors.accent} />
          </View>
          <Text style={styles.emptyText}>{t('mugs.studio.emptyHint')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  print: { backgroundColor: PAPER, overflow: 'hidden' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 },
  plus: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  // On the white print in both themes, so a fixed dark text colour stays readable.
  emptyText: { color: '#2D3250', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Icon, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import {
  choiceOf, choicePrice, colorAvailable, needsColor, packagingAvailable, type GiftPackaging, type GiftPackagingType,
  type PackagingChoice,
} from '@/api/packagingModels';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { PackagingArt } from './PackagingArt';
import { PackagingColorSelector } from './PackagingColorSelector';
import { PackagingOption, PackagingStep } from './PackagingStep';

type Step = 'type' | 'style' | 'color';
const TYPES: GiftPackagingType[] = ['TRANSPARENT', 'OPAQUE'];

/** The packaging's photo, else its drawing in its shape and first colour. */
function Picture({ packaging }: { packaging: GiftPackaging }) {
  return packaging.imageUrl
    ? <CatalogImage imageUrl={packaging.imageUrl} name={packaging.name} size={46} />
    : <PackagingArt closed={packaging.type === 'OPAQUE'} hex={packaging.colors[0]?.hex} shape={packaging.shape}
      size={46} />;
}

/**
 * Choosing how a gift arrives, before the studio opens: Transparent or Closed, then the
 * shape and style, then (for closed boxes) the box color. Each answered step folds into one
 * line. The type and style start on the first available option in the admin's order; the
 * color is always the customer's own choice.
 */
export function GiftPackagingChooser({ list, current, onStart }: {
  /** Every packaging option, sorted. */
  list: GiftPackaging[];
  /** The draft's packaging, kept when it is still available. */
  current: PackagingChoice | null;
  onStart: (choice: PackagingChoice) => void;
}) {
  const { t } = useTranslation();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const offered = list.filter(packagingAvailable);
  const kept = offered.find((entry) => entry.id === current?.id);
  const [packagingId, setPackagingId] = useState(kept?.id ?? offered[0]?.id ?? null);
  const [colorId, setColorId] = useState(kept?.colors.find((color) =>
    color.id === current?.color?.id && colorAvailable(color))?.id ?? null);
  // A step the customer reopened with "Change"; otherwise the first unanswered step is open.
  const [reopened, setReopened] = useState<Step | null>(null);

  const packaging = offered.find((entry) => entry.id === packagingId) ?? null;
  const color = packaging?.colors.find((entry) => entry.id === colorId) ?? null;
  const type = packaging?.type ?? null;
  const ofType = (value: GiftPackagingType) => offered.filter((entry) => entry.type === value);
  const types = TYPES.filter((value) => ofType(value).length);
  const styleOptions = type ? ofType(type) : [];
  const colorNeeded = !!packaging && needsColor(packaging);
  const complete = !!packaging && (!colorNeeded || !!color);
  const firstOpen: Step | null = !packaging ? 'type' : colorNeeded && !color ? 'color' : null;
  const open = reopened ?? firstOpen;

  const typeName = (value: GiftPackagingType) =>
    t(value === 'OPAQUE' ? 'giftStudio.packaging.closed' : 'giftStudio.packaging.transparent');
  const shapeName = (entry: GiftPackaging) => entry.type === 'OPAQUE'
    ? t(entry.shape === 'RECTANGULAR' ? 'giftStudio.packaging.rectangular' : 'giftStudio.packaging.square')
    : null;

  function chooseType(value: GiftPackagingType) {
    if (value !== type) {
      // A new type starts on its first option; colours belong to their packaging, so it clears.
      setPackagingId(ofType(value)[0].id);
      setColorId(null);
    }
    setReopened(ofType(value).length > 1 ? 'style' : null);
  }
  function chooseStyle(entry: GiftPackaging) {
    if (entry.id !== packagingId) setColorId(null);
    setPackagingId(entry.id);
    setReopened(null);
  }

  // Step numbers follow the steps actually shown.
  const steps: Step[] = ['type', ...(styleOptions.length > 1 ? ['style' as const] : []),
    ...(colorNeeded ? ['color' as const] : [])];
  const number = (step: Step) => steps.indexOf(step) + 1;

  return (
    <View style={{ gap: 12 }}>
      <PackagingStep number={number('type')} title={t('giftStudio.packaging.stepArrive')}
        answer={type ? typeName(type) : null} open={open === 'type'} onChange={() => setReopened('type')}>
        {types.map((value) => {
          const first = ofType(value)[0];
          const lowest = Math.min(...ofType(value).map((entry) => entry.price));
          return (
            <PackagingOption key={value} picture={<Picture packaging={first} />} title={typeName(value)}
              subtitle={t(value === 'OPAQUE' ? 'giftStudio.packaging.closedDescription'
                : 'giftStudio.packaging.transparentDescription')}
              price={ofType(value).length > 1 ? t('giftStudio.packaging.from', { price: money(lowest) }) : money(lowest)}
              selected={type === value} onPress={() => chooseType(value)} />
          );
        })}
      </PackagingStep>

      {styleOptions.length > 1 && packaging && (
        <PackagingStep number={number('style')} title={t('giftStudio.packaging.stepStyle')}
          answer={[packaging.name, shapeName(packaging)].filter(Boolean).join(' · ')}
          open={open === 'style'} onChange={() => setReopened('style')}>
          {/* Sold-out options of this type stay visible so customers know they exist. */}
          {list.filter((entry) => entry.isActive && entry.type === type).map((entry) => {
            const available = packagingAvailable(entry);
            return (
              <PackagingOption key={entry.id} picture={<Picture packaging={entry} />} title={entry.name}
                subtitle={[shapeName(entry), entry.description].filter(Boolean).join(' · ')}
                price={money(entry.price)} status={available ? null : t('giftStudio.packaging.outOfStock')}
                selected={entry.id === packagingId} disabled={!available} onPress={() => chooseStyle(entry)} />
            );
          })}
        </PackagingStep>
      )}

      {colorNeeded && packaging && (
        <PackagingStep number={number('color')} title={t('giftStudio.packaging.chooseColor')}
          answer={color?.name ?? null} open={open === 'color'} onChange={() => setReopened('color')}>
          <PackagingColorSelector colors={packaging.colors} selectedId={colorId}
            onSelect={(entry) => { setColorId(entry.id); setReopened(null); }} />
        </PackagingStep>
      )}

      {packaging && (
        <View style={styles.footer}>
          <View style={ui.between}>
            <Text style={ui.caption}>{t('giftStudio.packaging.packagingPrice')}</Text>
            <Text style={styles.total}>{money(choicePrice(choiceOf(packaging, color)))}</Text>
          </View>
          {!complete && <Text style={ui.caption}>{t('giftStudio.packaging.chooseColorToContinue')}</Text>}
          {/* A reminder right before designing: the box must fit what goes inside. */}
          <View accessibilityRole="alert" style={styles.hint}>
            <Icon name="information-circle-outline" size={20} color={styles.hintText.color} />
            <Text style={styles.hintText}>{t('giftStudio.packaging.styleHint')}</Text>
          </View>
          <Button title={t('giftStudio.packaging.start')} icon="arrow-forward" disabled={!complete}
            onPress={() => onStart(choiceOf(packaging, color))} />
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    footer: { gap: 10, paddingTop: 4 },
    total: { color: c.text, fontSize: 20, fontWeight: '700' },
    hint: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 14,
      borderWidth: 1, borderColor: c.accent, backgroundColor: c.soft,
    },
    hintText: { flex: 1, color: c.accent, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  });
};

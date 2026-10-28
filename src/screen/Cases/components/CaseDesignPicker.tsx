import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import type { CatalogComponent } from '@/api/catalogModels';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';

const TILE = 84;

/**
 * The two ways to design a case: upload your own photo, or choose one of HomeMade's
 * designs. A design that costs extra shows its price; free ones show nothing.
 */
export function CaseDesignPicker({ designs, selectedId, uploadPrice, canUpload, hasPhoto, onUpload, onUsePhoto,
  onChoose }: {
  designs: CatalogComponent[];
  selectedId?: string | null;
  uploadPrice: number;
  /** False when the admin turned the own-photo option off. */
  canUpload: boolean;
  /** A photo the customer already picked, offered again without re-uploading. */
  hasPhoto: boolean;
  onUpload: () => void;
  onUsePhoto: () => void;
  onChoose: (design: CatalogComponent) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 14 }}>
      {canUpload && (
        <View style={{ gap: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('cases.studio.uploadPhoto')} onPress={onUpload}
            style={({ pressed }) => [styles.upload, { opacity: pressed ? 0.8 : 1 }]}>
            <View style={styles.uploadIcon}>
              <Icon name="image-outline" size={22} color={styles.uploadIconColor.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.uploadTitle}>{t('cases.studio.uploadPhoto')}</Text>
              <Text style={styles.caption}>
                {uploadPrice ? t('cases.studio.uploadHintPrice', { price: money(uploadPrice) })
                  : t('cases.studio.uploadHint')}
              </Text>
            </View>
            <Icon name="cloud-upload-outline" size={20} color={styles.uploadIconColor.color} />
          </Pressable>
          {hasPhoto && (
            <Pressable accessibilityRole="button" onPress={onUsePhoto} hitSlop={6}>
              <Text style={styles.link}>{t('cases.studio.useMyPhoto')}</Text>
            </Pressable>
          )}
        </View>
      )}
      {designs.length > 0 && (
        <View style={{ gap: 10 }}>
          {canUpload && <Text style={styles.or}>{t('cases.studio.or')}</Text>}
          <Text style={styles.heading}>{t('cases.studio.chooseDesign')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {designs.map((design) => {
              const selected = design.id === selectedId;
              return (
                <Pressable key={design.id} accessibilityRole="button" accessibilityState={{ selected }}
                  accessibilityLabel={design.price
                    ? t('cases.studio.designPriced', { name: design.name, price: money(design.price) })
                    : design.name}
                  onPress={() => onChoose(design)}
                  style={({ pressed }) => [styles.tile, selected && styles.selected, { opacity: pressed ? 0.8 : 1 }]}>
                  <View style={styles.thumb}>
                    <CatalogImage imageUrl={design.imageUrl} name={design.name} size={TILE - 12} />
                  </View>
                  <Text style={styles.name} numberOfLines={1}>{design.name}</Text>
                  {design.price > 0 && <Text style={styles.price}>+{money(design.price)}</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    upload: {
      flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18,
      borderWidth: 1, borderColor: c.accent, backgroundColor: c.surface,
    },
    uploadIcon: {
      width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.soft,
    },
    uploadIconColor: { color: c.accent },
    uploadTitle: { color: c.text, fontSize: 15, fontWeight: '600' },
    caption: { color: c.muted, fontSize: 12, lineHeight: 18 },
    link: { color: c.accent, fontSize: 13, fontWeight: '600' },
    or: { color: c.muted, fontSize: 12, textAlign: 'center', letterSpacing: 1.2, textTransform: 'uppercase' },
    heading: { color: c.text, fontSize: 15, fontWeight: '600' },
    strip: { gap: 10, paddingVertical: 2, paddingRight: 8 },
    tile: {
      width: TILE + 8, gap: 4, padding: 4, borderRadius: 16, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface, alignItems: 'center',
    },
    selected: { borderColor: c.accent, borderWidth: 1.5 },
    thumb: {
      width: TILE, height: TILE, borderRadius: 12, overflow: 'hidden', backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center',
    },
    name: { color: c.text, fontSize: 11, fontWeight: '500', maxWidth: TILE },
    price: { color: c.gold, fontSize: 11, fontWeight: '700' },
  });
};

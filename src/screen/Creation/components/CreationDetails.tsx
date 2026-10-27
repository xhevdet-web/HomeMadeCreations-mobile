import { StyleSheet, Text, View } from 'react-native';
import { componentCount } from '@/helper/builders';
import { Icon } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { DesignThumbnail } from '@/components/products/DesignThumbnail';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import type { CommunityCreation } from '@/api/commerceModels';
import { sizeLabel } from '@/helper/jewelry';

export interface CreationLine {
  id: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  /** Today's bead price, falling back to the price saved with the design. */
  unitPrice: number;
  available: boolean;
}

export function CreationHero({ creation, width }: { creation: CommunityCreation; width: number }) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { product } = creation;
  const creatorName = `${product.createdBy.firstName} ${product.createdBy.lastName}`;
  const initials = [product.createdBy.firstName, product.createdBy.lastName]
    .map((part) => part?.trim()[0] ?? '').join('').toUpperCase();
  const size = product.selectedSize;
  return (
    <View style={{ gap: 16 }}>
      <View style={[styles.image, { height: width }]}>
        <DesignThumbnail product={product} size={width * 0.86} />
        <View style={styles.badge}>
          <Icon name="checkmark-circle" size={12} color="#FFFFFF" />
          <Text style={styles.badgeText}>{t('creation.madeDelivered')}</Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={styles.name}>{product.name}</Text>
        <View style={styles.maker}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.makerText}>{t('creation.designedBy')}<Text style={styles.makerName}>{creatorName}</Text></Text>
        </View>
        <Text style={styles.meta}>
          {[componentCount(t, product.itemCount, product.category?.builderType), size && sizeLabel(size)]
            .filter(Boolean).join(' · ')}
        </Text>
        {!!product.description && <Text style={styles.description}>{product.description}</Text>}
      </View>
    </View>
  );
}

export function CreationBeads({ lines, title }: { lines: CreationLine[]; title?: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title ?? t('creation.beadsInDesign')}</Text>
      {lines.map((line) => (
        <View key={line.id} style={[styles.line, !line.available && { opacity: 0.55 }]}>
          <View style={styles.bead}>
            <CatalogImage imageUrl={line.imageUrl} name={line.name} size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lineName} numberOfLines={1}>{line.name}</Text>
            <Text style={[styles.meta, !line.available && { color: theme.colors.danger }]}>
              {line.available ? `${line.quantity} × ${money(line.unitPrice)}` : t('creation.noLongerAvailable')}
            </Text>
          </View>
          <Text style={styles.lineTotal}>{money(line.quantity * line.unitPrice)}</Text>
        </View>
      ))}
    </View>
  );
}

export function CreationPromise() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.promise}>
      <Icon name="hand-left-outline" size={18} color={theme.colors.accent} />
      <Text style={styles.promiseText}>
        {t('creation.promise')}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    image: {
      borderRadius: 24, backgroundColor: c.thumbnail, overflow: 'hidden',
      alignItems: 'center', justifyContent: 'center',
    },
    badge: {
      position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: c.success,
    },
    badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 30, lineHeight: 36 },
    maker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatar: {
      width: 26, height: 26, borderRadius: 13, backgroundColor: c.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: c.onPrimary, fontSize: 10, fontWeight: '700' },
    makerText: { color: c.muted, fontSize: 13 },
    makerName: { color: c.text, fontWeight: '600' },
    meta: { color: c.muted, fontSize: 12 },
    description: { color: c.muted, fontSize: 14, lineHeight: 22 },
    card: {
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      borderRadius: 18, padding: 16, gap: 12,
    },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 19 },
    line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    bead: {
      width: 38, height: 38, borderRadius: 19, backgroundColor: c.thumbnail,
      alignItems: 'center', justifyContent: 'center',
    },
    lineName: { color: c.text, fontSize: 13, fontWeight: '600' },
    lineTotal: { color: c.text, fontSize: 13, fontWeight: '600' },
    promise: {
      flexDirection: 'row', gap: 10, alignItems: 'flex-start',
      padding: 14, borderRadius: 14, backgroundColor: c.soft,
    },
    promiseText: { flex: 1, color: c.text, fontSize: 13, lineHeight: 19 },
  });
};

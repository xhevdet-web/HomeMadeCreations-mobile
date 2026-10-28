import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { componentCount } from '@/helper/builders';
import { Button, Icon } from '@/components/common/ui';
import { DesignThumbnail } from '@/components/products/DesignThumbnail';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import type { CommunityCreation } from '@/api/commerceModels';
import { SectionHeader } from './SectionHeader';

function CreationCard({ creation, onOpen }: { creation: CommunityCreation; onOpen: () => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { product } = creation;
  const count = componentCount(t, product.itemCount, product.category?.builderType);
  const creatorName = `${product.createdBy.firstName} ${product.createdBy.lastName}`;
  const initials = [product.createdBy.firstName, product.createdBy.lastName]
    .map((part) => part?.trim()[0] ?? '').join('').toUpperCase();
  return (
    <Pressable style={({ pressed }) => [styles.creation, { opacity: pressed ? 0.85 : 1 }]}
      accessibilityRole="button" onPress={onOpen}
      accessibilityLabel={t('community.orderLabel', { name: product.name, creator: creatorName, count, price: money(product.price) })}>
      <View style={styles.creationImage}>
        <DesignThumbnail product={product} size={128} />
      </View>
      <Text style={styles.creationName} numberOfLines={1}>{product.name}</Text>
      <View style={styles.maker}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.makerName} numberOfLines={1}>{creatorName}</Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={{ flex: 1 }}>
          <Text style={styles.price}>{money(product.price)}</Text>
          <Text style={styles.caption}>{count}</Text>
        </View>
        <View style={styles.order}>
          <Icon name="bag-add-outline" size={15} color={theme.colors.onPrimary} />
        </View>
      </View>
    </Pressable>
  );
}

function CreationSkeleton() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.creation} accessibilityElementsHidden>
      <View style={[styles.creationImage, styles.skeleton]} />
      <View style={[styles.skeleton, styles.line, { width: '75%' }]} />
      <View style={[styles.skeleton, styles.line, { width: '55%' }]} />
    </View>
  );
}

export function CommunityCreations({ creations, loading, error, onRetry, onOpen,
  title,
  hideWhenEmpty = false }: {
  creations: CommunityCreation[];
  onOpen: (creation: CommunityCreation) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  title?: string;
  /** Leave the section out entirely when there is nothing to show yet. */
  hideWhenEmpty?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  if (hideWhenEmpty && !loading && !error && !creations.length) return null;
  return (
    <View style={{ gap: 14 }}>
      <SectionHeader title={title ?? t('community.title')} />
      {loading ? (
        <ScrollView horizontal scrollEnabled={false} contentContainerStyle={{ gap: 12 }}>
          {[0, 1, 2].map((index) => <CreationSkeleton key={index} />)}
        </ScrollView>
      ) : error ? (
        <View style={styles.state}>
          <Icon name="cloud-offline-outline" size={22} color={theme.colors.muted} />
          <Text accessibilityRole="alert" style={styles.stateText}>
            {t('community.loadFailed', { error })}
          </Text>
          <Button title={t('common.retry')} secondary onPress={onRetry} />
        </View>
      ) : creations.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {creations.map((creation) => (
            <CreationCard key={creation.completedOrderId} creation={creation}
              onOpen={() => onOpen(creation)} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.state}>
          <Icon name="people-outline" size={22} color={theme.colors.accent} />
          <Text style={styles.stateText}>
            {t('community.empty')}
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    caption: { color: c.muted, fontSize: 11 },
    creation: {
      width: 152, padding: 10, gap: 5, borderRadius: 18,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    creationImage: {
      height: 132, borderRadius: 14, backgroundColor: c.thumbnail, marginBottom: 4,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    creationName: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 16 },
    maker: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    avatar: {
      width: 20, height: 20, borderRadius: 10, backgroundColor: c.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: c.onPrimary, fontSize: 8, fontWeight: '700' },
    makerName: { flex: 1, color: c.text, fontSize: 12 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    price: { color: c.gold, fontSize: 15, fontWeight: '700' },
    order: {
      width: 34, height: 34, borderRadius: 17, backgroundColor: c.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    skeleton: { backgroundColor: c.elevated },
    line: { height: 10, borderRadius: 5 },
    state: {
      alignItems: 'center', gap: 10, padding: 18, borderRadius: 18,
      borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, backgroundColor: c.surface,
    },
    stateText: { color: c.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  });
};

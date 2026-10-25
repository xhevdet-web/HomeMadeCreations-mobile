import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { componentCount } from '@/helper/builders';
import { Button, Icon, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { DesignThumbnail } from '@/components/products/DesignThumbnail';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import type { CommunityCreation, SavedProduct } from '@/api/commerceModels';

export interface FavouriteBead {
  id: string;
  name: string;
  imageUrl?: string | null;
  uses: number;
}

// Beads the customer reaches for most, counted across their saved designs.
export function favouriteBeads(designs: SavedProduct[], limit = 8): FavouriteBead[] {
  const totals = new Map<string, FavouriteBead>();
  for (const design of designs) {
    if (design.origin === 'COMPANY') continue;
    for (const item of design.items ?? []) {
      const bead = totals.get(item.subCategoryId);
      if (bead) bead.uses += item.quantity;
      else totals.set(item.subCategoryId, {
        id: item.subCategoryId, name: item.subCategory.name,
        imageUrl: item.subCategory.imageUrl, uses: item.quantity,
      });
    }
  }
  return [...totals.values()].sort((a, b) => b.uses - a.uses).slice(0, limit);
}

function SectionHeader({ eyebrow, title, action, onAction }: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={ui.between}>
      <View style={{ flex: 1 }}>
        <Text style={ui.eyebrow}>{eyebrow}</Text>
        <Text style={styles.heading}>{title}</Text>
      </View>
      {action && onAction && (
        <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onAction} hitSlop={10}>
          <Text style={ui.textLink}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function CreationCard({ creation, onOpen }: { creation: CommunityCreation; onOpen: () => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { product } = creation;
  const creatorName = `${product.createdBy.firstName} ${product.createdBy.lastName}`;
  const initials = [product.createdBy.firstName, product.createdBy.lastName]
    .map((part) => part?.trim()[0] ?? '').join('').toUpperCase();
  return (
    <Pressable style={({ pressed }) => [styles.creation, { opacity: pressed ? 0.85 : 1 }]}
      accessibilityRole="button" onPress={onOpen}
      accessibilityLabel={`Order ${product.name} by ${creatorName}, ${componentCount(product.itemCount, product.category?.builderType)}, ${money(product.price)}`}>
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
          <Text style={styles.caption}>{componentCount(product.itemCount, product.category?.builderType)}</Text>
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
  title = 'Creations from others',
  intro = 'Finished pieces from the HomeMade community. Love one? Order your own.',
  hideWhenEmpty = false }: {
  creations: CommunityCreation[];
  onOpen: (creation: CommunityCreation) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  title?: string;
  intro?: string;
  /** Leave the section out entirely when there is nothing to show yet. */
  hideWhenEmpty?: boolean;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  if (hideWhenEmpty && !loading && !error && !creations.length) return null;
  return (
    <View style={{ gap: 14 }}>
      <SectionHeader eyebrow="COMMUNITY" title={title} />
      <Text style={styles.intro}>{intro}</Text>
      {loading ? (
        <ScrollView horizontal scrollEnabled={false} contentContainerStyle={{ gap: 12 }}>
          {[0, 1, 2].map((index) => <CreationSkeleton key={index} />)}
        </ScrollView>
      ) : error ? (
        <View style={styles.state}>
          <Icon name="cloud-offline-outline" size={22} color={theme.colors.muted} />
          <Text accessibilityRole="alert" style={styles.stateText}>
            We couldn’t load community creations. {error}
          </Text>
          <Button title="Try again" secondary onPress={onRetry} />
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
            No community creations yet. Finished pieces from other customers will appear here.
          </Text>
        </View>
      )}
    </View>
  );
}

export function FavouriteBeads({ beads }: { beads: FavouriteBead[] }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 14 }}>
      <SectionHeader eyebrow="YOUR STYLE" title="Your favourite beads" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
        {beads.map((bead) => (
          <View key={bead.id} style={styles.bead} accessible
            accessibilityLabel={`${bead.name}, used ${bead.uses} times in your designs`}>
            <View style={styles.beadImage}>
              <CatalogImage imageUrl={bead.imageUrl} name={bead.name} size={44} />
            </View>
            <Text style={styles.beadName} numberOfLines={1}>{bead.name}</Text>
            <Text style={styles.caption}>{bead.uses}× used</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    heading: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 24 },
    caption: { color: c.muted, fontSize: 11 },
    intro: { color: c.muted, fontSize: 13, lineHeight: 19, marginTop: -6 },
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
    bead: { width: 72, alignItems: 'center', gap: 4 },
    beadImage: {
      width: 64, height: 64, borderRadius: 32, backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center',
      marginBottom: 2,
    },
    beadName: { color: c.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  });
};

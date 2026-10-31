import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { apiError } from '@/api/apiSlice';
import { useGetCommunityGalleryQuery } from '@/api/endpoints/productSlice';
import type { CommunityGalleryCreation } from '@/api/commerceModels';
import { SectionHeader, SectionRetry } from '../SectionHeader';
import { CategoryFilter } from './CategoryFilter';
import { CreationCard } from './CreationCard';
import { CommunityCreationsSkeleton, CreationRowSkeleton } from './CommunityCreationsSkeleton';

const GAP = 12;
// Home's content area: the page is at most 760 wide with a 22 gutter on each side.
const contentWidth = (screen: number) => Math.min(screen, 760) - 44;

/**
 * "See what others are creating": recent completed creations of other customers, one
 * category at a time. The backend picks the categories and creations from the session, so
 * a new category appears here once someone else's order in it is completed. The section
 * leaves Home entirely when there is nothing to show or it cannot load.
 */
export function CommunityCreationsSection() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  // Two cards and part of a third, so the row reads as scrollable.
  const cardWidth = Math.min(200, Math.round((contentWidth(width) - GAP * 2) / 2.3));
  const authenticated = useAuthStore((state) => state.status === 'authenticated');
  // Undefined lets the backend choose the first category with creations.
  const [selected, setSelected] = useState<string>();
  const { data, currentData, error, refetch } = useGetCommunityGalleryQuery(selected, { skip: !authenticated });

  const unauthorized = !!error && apiError(error).status === 401;
  const restoringSession = useRef(false);
  useEffect(() => {
    // A 401 means the token was rejected: re-validate the session once. An invalid
    // session signs out, and the protected navigator then opens Login.
    if (!unauthorized || restoringSession.current) return;
    restoringSession.current = true;
    void useAuthStore.getState().restore().then(() => {
      if (useAuthStore.getState().status === 'authenticated') void refetch();
    });
  }, [unauthorized, refetch]);

  const open = useCallback((creation: CommunityGalleryCreation) => router.push({
    pathname: '/creation', params: { id: creation.id, collection: creation.categoryId },
  }), []);

  const header = (
    <View style={{ gap: 3 }}>
      <SectionHeader title={t('home.communityTitle')} />
      <Text style={styles.subtitle}>{t('home.communitySubtitle')}</Text>
    </View>
  );

  if (!authenticated || unauthorized || (!data && !error))
    return <View style={styles.section}>{header}<CommunityCreationsSkeleton cardWidth={cardWidth} /></View>;
  // Optional on Home: never an error or an empty block in place of the section.
  if (!data?.categories.length) return null;

  // `currentData` belongs to the selected category; until it arrives the pills stay put
  // and only the cards show placeholders. Categories visited before are shown from cache.
  const shown = currentData;
  // The backend answers with another category when the requested one has emptied.
  const selectedId = shown?.categoryId ?? selected ?? data.categoryId;

  return (
    <View style={styles.section}>
      {header}
      <CategoryFilter categories={data.categories} selectedId={selectedId} onSelect={setSelected} />
      <View style={{ minHeight: cardWidth + 64 }}>
        {shown ? (
          shown.creations.length ? (
            <FlatList
              horizontal
              data={shown.creations}
              keyExtractor={(creation) => creation.id}
              renderItem={({ item }) => <CreationCard creation={item} width={cardWidth} onOpen={open} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: GAP }}
              snapToInterval={cardWidth + GAP}
              decelerationRate="fast"
            />
          ) : (
            <View style={styles.empty}>
              <Icon name="sparkles-outline" size={20} color={theme.colors.accent} />
              <Text style={styles.emptyText}>{t('home.communityEmpty')}</Text>
            </View>
          )
        ) : error ? (
          <SectionRetry message={t('home.communityLoadFailed')} onRetry={() => void refetch()} />
        ) : (
          <CreationRowSkeleton cardWidth={cardWidth} />
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    section: { gap: 14 },
    subtitle: { color: c.muted, fontSize: 13, lineHeight: 18 },
    empty: {
      flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18, borderRadius: 20,
      borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, backgroundColor: c.surface,
    },
    emptyText: { color: c.muted, fontSize: 13, textAlign: 'center' },
  });
};

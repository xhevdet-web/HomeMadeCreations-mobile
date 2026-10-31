import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import type { CommunityGalleryCreation } from '@/api/commerceModels';

const IMAGE_INSET = 12;

/** The design is the card: a large preview, its name and a neutral community credit. */
export const CreationCard = memo(function CreationCard({ creation, width, onOpen }: {
  creation: CommunityGalleryCreation;
  width: number;
  onOpen: (creation: CommunityGalleryCreation) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <Animated.View entering={FadeIn.duration(220)}>
      <Pressable accessibilityRole="button" onPress={() => onOpen(creation)}
        accessibilityLabel={t('home.communityCardLabel', { name: creation.name, category: creation.categoryName })}
        style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.88 : 1 }]}>
        <View style={[styles.image, { height: width }]}>
          <CatalogImage imageUrl={creation.designPreviewUrl} name={creation.name} size={width - IMAGE_INSET * 2} />
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>{creation.name}</Text>
          <View style={styles.credit}>
            <Icon name="sparkles" size={11} color={theme.colors.accent} />
            <Text style={styles.creditText} numberOfLines={1}>{t('home.communityCredit')}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    card: {
      borderRadius: 20, overflow: 'hidden',
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    image: { backgroundColor: c.thumbnail, alignItems: 'center', justifyContent: 'center' },
    body: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 4 },
    name: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 16, lineHeight: 21 },
    credit: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    creditText: { flexShrink: 1, color: c.muted, fontSize: 11 },
  });
};

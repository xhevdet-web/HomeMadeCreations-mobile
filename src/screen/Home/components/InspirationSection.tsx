import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import type { BuilderType } from '@/api/builderModels';
import type { CatalogCategory } from '@/api/catalogModels';
import { builderOf, IDEAS, type Idea } from '../homeContent';
import { SectionHeader } from './SectionHeader';

interface IdeaCard extends Idea {
  category: CatalogCategory;
  /** Small personal note, e.g. "Try something different". */
  note: string;
}

/**
 * Curated starting points, each opening a studio directly. With saved designs, studios the
 * customer hasn't tried yet come first. No tracking: only their own saved designs are used.
 */
export function InspirationSection({ categories, triedBuilders, onStart }: {
  categories: CatalogCategory[];
  /** Studios the customer has already made designs in. */
  triedBuilders: Set<BuilderType>;
  onStart: (category: CatalogCategory) => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const personal = triedBuilders.size > 0;
  const ideas = IDEAS.flatMap((idea): IdeaCard[] => {
    const category = categories.find((entry) => builderOf(entry) === idea.builder);
    if (!category) return [];
    const tried = triedBuilders.has(idea.builder);
    return [{ ...idea, category, note: !personal ? 'IDEA' : tried ? 'MAKE ANOTHER' : 'TRY SOMETHING DIFFERENT' }];
  }).sort((a, b) => Number(triedBuilders.has(a.builder)) - Number(triedBuilders.has(b.builder)));
  if (!ideas.length) return null;

  // Picks one studio that can be used right now.
  const surprise = () => onStart(ideas[Math.floor(Math.random() * ideas.length)].category);

  return (
    <View style={{ gap: 14 }}>
      <SectionHeader eyebrow="NEED SOME INSPIRATION?" title="Ideas for you"
        subtitle="Not sure where to start? Try one of these."
        right={(
          <Pressable accessibilityRole="button" accessibilityLabel="Surprise me: open a random studio"
            onPress={surprise} hitSlop={6} style={({ pressed }) => [styles.surprise, { opacity: pressed ? 0.7 : 1 }]}>
            <Icon name="sparkles" size={13} color={theme.colors.accent} />
            <Text style={styles.surpriseText}>Surprise me</Text>
          </Pressable>
        )} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {ideas.map((idea) => (
          <Pressable key={idea.builder} accessibilityRole="button"
            accessibilityLabel={`${idea.title}. ${idea.line} ${idea.action}`} onPress={() => onStart(idea.category)}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}>
            <View style={styles.image}>
              <CatalogImage imageUrl={idea.category.imageUrl} name={idea.category.name} size={120} />
              <View style={styles.badge}>
                <Icon name={idea.icon} size={15} color={theme.colors.accent} />
              </View>
            </View>
            <View style={styles.body}>
              <Text style={styles.note}>{idea.note}</Text>
              <Text style={styles.title} numberOfLines={2}>{idea.title}</Text>
              <Text style={styles.line} numberOfLines={2}>{idea.line}</Text>
              <View style={styles.cta}>
                <Text style={styles.ctaText}>{idea.action}</Text>
                <Icon name="arrow-forward" size={14} color={theme.colors.accent} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    surprise: {
      flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7,
      borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    surpriseText: { color: c.accent, fontSize: 12, fontWeight: '600' },
    card: {
      width: 220, borderRadius: 20, overflow: 'hidden',
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    image: { height: 120, backgroundColor: c.thumbnail, alignItems: 'center', justifyContent: 'center' },
    badge: {
      position: 'absolute', top: 10, left: 10, width: 30, height: 30, borderRadius: 15,
      backgroundColor: c.badge, alignItems: 'center', justifyContent: 'center',
    },
    body: { padding: 14, gap: 4 },
    note: { color: c.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1.3 },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 18, lineHeight: 23 },
    line: { color: c.muted, fontSize: 12, lineHeight: 17 },
    cta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
    ctaText: { color: c.accent, fontSize: 13, fontWeight: '600' },
  });
};

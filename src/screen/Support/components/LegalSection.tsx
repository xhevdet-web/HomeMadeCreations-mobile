import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import type { ContentBlock } from '../content/types';
import { ContentBlocks } from './ContentBlocks';

/** A numbered section of a legal document: "01 Information we collect". */
export function LegalSection({ number, title, body }: { number: number; title: string; body: ContentBlock[] }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <View style={{ gap: 4 }}>
        <Text style={styles.number}>{String(number).padStart(2, '0')}</Text>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
      </View>
      <ContentBlocks blocks={body} />
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    section: { gap: 12, paddingTop: 22, borderTopWidth: 1, borderTopColor: c.border },
    number: { color: c.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
    title: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 20, lineHeight: 27 },
  });
};

import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Brand, Button, Icon, IconButton, Page, useUI } from '@/components/common/ui';
import { ReadyMadeCollection } from '@/components/products/ReadyMadeCollection';
import { type Theme } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function HomeScreen() {
  const toggleTheme = useThemeStore((state) => state.toggle);
  const theme = useTheme();
  const c = theme.colors;
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();

  return (
    <Page>
      <View style={ui.between}>
        <Brand compact />
        <View style={[ui.row, { gap: 6 }]}>
          {width >= 380 && (
            <IconButton name="heart-outline" label="My saved designs"
              onPress={() => router.push('/designs')} />
          )}
          <IconButton name="bag-handle-outline" label="Open shopping bag"
            onPress={() => router.push('/checkout')} />
          <IconButton name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
            label={theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onPress={toggleTheme} />
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.eyebrowRow}>
          <Icon name="sparkles-outline" size={17} color={c.accent} />
          <Text style={styles.eyebrow}>IMAGINE SOMETHING YOURS</Text>
        </View>
        <Text style={styles.heroTitle}>
          Your idea.{'\n'}<Text style={styles.titleAccent}>Made real.</Text>
        </Text>
        <Text style={styles.heroBody}>
          A thoughtful gift, flowers for a special moment, or something just for you.
          Create your idea. We make it and deliver it to your door.
        </Text>
        <Button title="Create your own" icon="arrow-forward"
          onPress={() => router.push('/categories')} />
        <View style={styles.steps}>
          {[
            { number: '01', title: 'Imagine it', detail: 'Start with an idea' },
            { number: '02', title: 'Create it', detail: 'Make it personal' },
            { number: '03', title: 'Receive it', detail: 'Delivered to you' },
          ].map(step => (
            <View key={step.number} style={styles.step}>
              <Text style={styles.stepNumber}>{step.number}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDetail}>{step.detail}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.browseIntro}>
        <Text style={styles.browseTitle}>Find something you love</Text>
        <Text style={ui.body}>Explore ready-made creations, ready to order.</Text>
      </View>
      <View style={styles.search}>
        <Icon name="search-outline" size={19} color={c.muted} />
        <TextInput accessibilityLabel="Search products" placeholder="Search ready-made creations"
          placeholderTextColor={c.muted} value={search} onChangeText={setSearch}
          style={styles.searchInput} />
        {search.length > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search"
            onPress={() => setSearch('')} hitSlop={10}>
            <Icon name="close" size={18} color={c.muted} />
          </Pressable>
        )}
      </View>
      <ReadyMadeCollection search={search} />
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    hero: {
      backgroundColor: c.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      padding: 24,
      gap: 22,
    },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyebrow: { flexShrink: 1, color: c.accent, fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
    heroTitle: {
      fontSize: 44,
      lineHeight: 49,
      color: c.text,
      fontFamily: theme.fonts.editorial,
      letterSpacing: -1.5,
    },
    titleAccent: { color: c.accent, fontStyle: 'italic' },
    heroBody: { fontSize: 14, color: c.muted, lineHeight: 23, maxWidth: 480 },
    steps: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderColor: c.border, paddingTop: 20 },
    step: { flex: 1, gap: 6 },
    stepNumber: { color: c.accent, fontSize: 10, letterSpacing: 1, fontWeight: '600' },
    stepTitle: { color: c.text, fontSize: 12, fontWeight: '600' },
    stepDetail: { color: c.muted, fontSize: 10, lineHeight: 16 },
    browseIntro: { gap: 6, marginTop: 4 },
    browseTitle: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 26 },
    search: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      minHeight: 49,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      gap: 10,
    },
    searchInput: { flex: 1, color: c.text, fontSize: 13, minHeight: 48 },
  });
};

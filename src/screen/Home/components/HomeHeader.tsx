import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/common/ui';
import { Logo } from '@/components/common/Logo';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { darkTheme, lightTheme, type Theme } from '@/constants/theme';
import { money } from '@/helper/pricing';
import { type ApiOrder, orderStages, orderStatusLabel } from '@/api/commerceModels';
import { stageDescription } from '@/screen/Confirmation/components/OrderTimeline';
import { useThemeStore } from '@/store/themeStore';

/**
 * The header's own palette per mode. Dark: the brand's navy with apricot on top. Light: a
 * warm cream-to-apricot banner with navy text and copper accents, so it belongs to the
 * light page instead of sitting on it as a dark block.
 */
const PALETTES = {
  dark: {
    gradient: [lightTheme.colors.text, darkTheme.colors.border] as const,
    text: '#FFFFFF', muted: darkTheme.colors.muted, accent: darkTheme.colors.accent,
    onAccent: lightTheme.colors.text, glass: 'rgba(255,255,255,0.12)', searchBorder: 'transparent',
    logo: 'dark' as const,
  },
  light: {
    gradient: ['#F3E3D2', '#FFF8F0'] as const,
    text: lightTheme.colors.text, muted: lightTheme.colors.muted, accent: lightTheme.colors.accent,
    onAccent: '#FFFFFF', glass: 'rgba(45,50,80,0.07)', searchBorder: lightTheme.colors.border,
    logo: 'light' as const,
  },
};
const paletteOf = (theme: Theme) => PALETTES[theme.mode];

const actions: {
  icon: IconName;
  label: 'home.actionCreate' | 'home.actionTrack' | 'home.actionDesigns' | 'home.actionHelp';
  onPress: () => void;
}[] = [
  { icon: 'color-palette-outline', label: 'home.actionCreate', onPress: () => router.push('/categories') },
  { icon: 'cube-outline', label: 'home.actionTrack', onPress: () => router.push('/orders') },
  { icon: 'heart-outline', label: 'home.actionDesigns', onPress: () => router.push('/designs') },
  { icon: 'help-buoy-outline', label: 'home.actionHelp', onPress: () => router.push('/help') },
];

function HeaderButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  const palette = paletteOf(useTheme());
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4}
      style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={icon} size={19} color={palette.text} />
    </Pressable>
  );
}

/**
 * Home's header: the HomeCreator logo, search for ready-made pieces, the active order (when
 * there is one) and quick actions. Full width, under the status bar.
 */
export function HomeHeader({ search, onSearch, activeOrder }: {
  search: string;
  onSearch: (value: string) => void;
  activeOrder?: ApiOrder;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const toggleTheme = useThemeStore((state) => state.toggle);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const step = activeOrder ? orderStages.findIndex((stage) => stage === activeOrder.status) : -1;
  const styles = useThemedStyles(createStyles);
  const palette = paletteOf(theme);

  return (
    <LinearGradient colors={palette.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} accessibilityRole="header">
            <Logo tone={palette.logo} markSize={34} textSize={22} />
          </View>
          {width >= 380 && (
            <HeaderButton icon="heart-outline" label={t('home.savedDesigns')} onPress={() => router.push('/designs')} />
          )}
          <HeaderButton icon="bag-handle-outline" label={t('home.openBag')} onPress={() => router.push('/checkout')} />
          <HeaderButton icon={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
            label={theme.mode === 'dark' ? t('common.switchToLight') : t('common.switchToDark')} onPress={toggleTheme} />
        </View>

        <View style={styles.search}>
          <Icon name="search-outline" size={18} color={lightTheme.colors.muted} />
          <TextInput accessibilityLabel={t('home.searchLabel')} placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={lightTheme.colors.muted} value={search} onChangeText={onSearch}
            returnKeyType="search" autoCorrect={false} style={styles.searchInput} />
          {search.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel={t('home.clearSearch')} onPress={() => onSearch('')}
              hitSlop={10}>
              <Icon name="close-circle" size={18} color={lightTheme.colors.muted} />
            </Pressable>
          )}
        </View>

        {activeOrder ? (
          <Pressable accessibilityRole="button"
            accessibilityLabel={t('home.trackOrder', { number: activeOrder.orderNumber, status: orderStatusLabel(t, activeOrder.status) })}
            onPress={() => router.push({ pathname: '/confirmation', params: { id: activeOrder.id } })}
            style={({ pressed }) => [styles.spotlight, { opacity: pressed ? 0.85 : 1 }]}>
            <Text style={styles.spotlightLabel}>{t('home.yourOrder')}</Text>
            <Text style={styles.spotlightTitle}>{orderStatusLabel(t, activeOrder.status)}</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText} numberOfLines={1}>{activeOrder.product.name}</Text>
            </View>
            <Text style={styles.spotlightDetail} numberOfLines={2}>
              {stageDescription(t, activeOrder.status) ?? `${activeOrder.orderNumber} · ${money(activeOrder.totalPrice)}`}
            </Text>
            <View style={styles.progress} accessibilityElementsHidden>
              {orderStages.map((stage, index) => (
                <View key={stage} style={[styles.segment, index <= step && { backgroundColor: palette.accent }]} />
              ))}
            </View>
          </Pressable>
        ) : (
          <View style={styles.spotlight}>
            <Text style={styles.spotlightLabel}>{t('common.appName')}</Text>
            <Text style={styles.spotlightTitle}>{t('home.greetingSubtitle')}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable key={action.label} accessibilityRole="button" accessibilityLabel={t(action.label)}
              onPress={action.onPress} style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}>
              <View style={[styles.actionIcon, action.label === 'home.actionCreate' && { backgroundColor: palette.accent }]}>
                <Icon name={action.icon} size={20}
                  color={action.label === 'home.actionCreate' ? palette.onAccent : palette.text} />
              </View>
              <Text style={styles.actionLabel}>{t(action.label)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

// Colours come from the header's own palette, not the page theme: see PALETTES.
const createStyles = (theme: Theme) => {
  const p = paletteOf(theme);
  return StyleSheet.create({
    header: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingHorizontal: 22, paddingBottom: 20 },
    inner: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 18 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerButton: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: p.glass,
      alignItems: 'center', justifyContent: 'center',
    },
    search: {
      flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 15,
      borderRadius: 14, backgroundColor: lightTheme.colors.surface, borderWidth: 1, borderColor: p.searchBorder,
    },
    searchInput: { flex: 1, minHeight: 46, fontSize: 14, color: lightTheme.colors.text },
    spotlight: { alignItems: 'center', gap: 6, paddingVertical: 2 },
    spotlightLabel: { color: p.muted, fontSize: 12 },
    spotlightTitle: {
      color: p.text, fontSize: 26, lineHeight: 32, fontFamily: lightTheme.fonts.editorial, textAlign: 'center',
    },
    pill: { maxWidth: '90%', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: p.accent },
    pillText: { color: p.onAccent, fontSize: 12, fontWeight: '700' },
    spotlightDetail: { color: p.muted, fontSize: 12, textAlign: 'center' },
    progress: { flexDirection: 'row', gap: 4, alignSelf: 'stretch', marginTop: 4 },
    segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: p.glass },
    actions: { flexDirection: 'row', justifyContent: 'space-around' },
    action: { alignItems: 'center', gap: 6, minWidth: 64 },
    actionIcon: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: p.glass,
      alignItems: 'center', justifyContent: 'center',
    },
    actionLabel: { color: p.text, fontSize: 12, fontWeight: '500' },
  });
};

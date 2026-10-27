import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { darkTheme, lightTheme } from '@/constants/theme';
import { money } from '@/helper/pricing';
import { type ApiOrder, orderStages, orderStatusLabel } from '@/api/commerceModels';
import { stageDescription } from '@/screen/Confirmation/components/OrderTimeline';
import { useThemeStore } from '@/store/themeStore';

// The brand's navy carries the header in both modes, with the apricot accent on top.
const NAVY = [lightTheme.colors.text, darkTheme.colors.border] as const;
const APRICOT = darkTheme.colors.accent;
const ON_NAVY = '#FFFFFF';
const ON_NAVY_MUTED = darkTheme.colors.muted;
const GLASS = 'rgba(255,255,255,0.12)';

function greetingKey() {
  const hour = new Date().getHours();
  return hour < 12 ? 'home.greetingMorning' : hour < 18 ? 'home.greetingAfternoon' : 'home.greetingEvening';
}

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
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4}
      style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={icon} size={19} color={ON_NAVY} />
    </Pressable>
  );
}

/**
 * Home's header: greeting, search for ready-made pieces, the active order (when there is
 * one) and quick actions. Full width, under the status bar.
 */
export function HomeHeader({ firstName, lastName, search, onSearch, activeOrder }: {
  firstName?: string;
  lastName?: string;
  search: string;
  onSearch: (value: string) => void;
  activeOrder?: ApiOrder;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const toggleTheme = useThemeStore((state) => state.toggle);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const initials = [firstName, lastName].map((part) => part?.trim()[0] ?? '').join('').toUpperCase();
  const step = activeOrder ? orderStages.findIndex((stage) => stage === activeOrder.status) : -1;

  return (
    <LinearGradient colors={NAVY} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.avatar} accessibilityElementsHidden>
            {initials ? <Text style={styles.avatarText}>{initials}</Text>
              : <Icon name="person" size={20} color={lightTheme.colors.text} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{t(greetingKey())}</Text>
            {/* Shrinks rather than cuts off longer greetings (e.g. Albanian) and long names. */}
            <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
              accessibilityRole="header">
              {firstName ? t('home.hello', { name: firstName }) : t('home.helloNoName')}
            </Text>
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
                <View key={stage} style={[styles.segment, index <= step && { backgroundColor: APRICOT }]} />
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
              <View style={[styles.actionIcon, action.label === 'home.actionCreate' && { backgroundColor: APRICOT }]}>
                <Icon name={action.icon} size={20} color={action.label === 'home.actionCreate' ? lightTheme.colors.text : ON_NAVY} />
              </View>
              <Text style={styles.actionLabel}>{t(action.label)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

// Fixed colours: the header is navy in light and dark mode alike.
const styles = StyleSheet.create({
  header: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingHorizontal: 22, paddingBottom: 20 },
  inner: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: APRICOT,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: { color: lightTheme.colors.text, fontSize: 15, fontWeight: '700' },
  greeting: { color: ON_NAVY_MUTED, fontSize: 12 },
  name: { color: ON_NAVY, fontSize: 22, fontFamily: lightTheme.fonts.editorial },
  headerButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: GLASS,
    alignItems: 'center', justifyContent: 'center',
  },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 15,
    borderRadius: 14, backgroundColor: lightTheme.colors.surface,
  },
  searchInput: { flex: 1, minHeight: 46, fontSize: 14, color: lightTheme.colors.text },
  spotlight: { alignItems: 'center', gap: 6, paddingVertical: 2 },
  spotlightLabel: { color: ON_NAVY_MUTED, fontSize: 12 },
  spotlightTitle: {
    color: ON_NAVY, fontSize: 26, lineHeight: 32, fontFamily: lightTheme.fonts.editorial, textAlign: 'center',
  },
  pill: { maxWidth: '90%', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: APRICOT },
  pillText: { color: lightTheme.colors.text, fontSize: 12, fontWeight: '700' },
  spotlightDetail: { color: ON_NAVY_MUTED, fontSize: 12, textAlign: 'center' },
  progress: { flexDirection: 'row', gap: 4, alignSelf: 'stretch', marginTop: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: GLASS },
  actions: { flexDirection: 'row', justifyContent: 'space-around' },
  action: { alignItems: 'center', gap: 6, minWidth: 64 },
  actionIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: GLASS,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { color: ON_NAVY, fontSize: 12, fontWeight: '500' },
});

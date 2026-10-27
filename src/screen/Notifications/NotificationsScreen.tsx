import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Icon, IconButton, Page, useUI } from '@/components/common/ui';
import { TextAction } from '@/components/common/TextAction';
import { CatalogState } from '@/components/products/CatalogState';
import {
  useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation,
  type AppNotification,
} from '@/api/endpoints/notificationSlice';
import { useApiResult } from '@/api/useApiResult';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** "Just now", "10 min ago", "2 h ago", "Yesterday", then the date. */
function timeAgo(t: TFunction, language: string, iso: string) {
  const date = new Date(iso);
  const elapsed = Date.now() - date.getTime();
  if (elapsed < MINUTE) return t('notifications.justNow');
  if (elapsed < HOUR) return t('notifications.minutesAgo', { count: Math.floor(elapsed / MINUTE) });
  const today = startOfDay(new Date());
  if (date.getTime() >= today) return t('notifications.hoursAgo', { count: Math.floor(elapsed / HOUR) });
  if (date.getTime() >= today - 24 * HOUR) return t('notifications.yesterday');
  return date.toLocaleDateString(language === 'sq' ? 'sq-AL' : 'en-GB', { day: 'numeric', month: 'short' });
}

/**
 * The signed-in customer's order updates, newest first, grouped into Today and Earlier.
 * Tapping one marks it read (the bell's badge follows at once) and opens its order.
 */
export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const query = useGetNotificationsQuery();
  const result = useApiResult<AppNotification[]>(query);
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, markingAll] = useMarkAllNotificationsReadMutation();
  const notifications = result.data ?? [];
  const unread = notifications.some((item) => !item.isRead);
  const today = startOfDay(new Date());
  const sections = [
    { key: 'today', title: t('notifications.today'), items: notifications.filter((item) => new Date(item.createdAt).getTime() >= today) },
    { key: 'earlier', title: t('notifications.earlier'), items: notifications.filter((item) => new Date(item.createdAt).getTime() < today) },
  ].filter((section) => section.items.length);

  function open(item: AppNotification) {
    if (!item.isRead) void markRead(item.id);
    if (!item.orderId) return;
    // Leave the notification centre, then show the order it is about.
    if (router.canGoBack()) router.back();
    router.push({ pathname: '/confirmation', params: { id: item.orderId } });
  }

  return (
    <Page scroll={false} style={{ padding: 0, gap: 0 }}>
      <View style={styles.header}>
        <IconButton name="close" label={t('common.close')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <Text style={[ui.headerTitle, { flex: 1 }]} accessibilityRole="header">{t('notifications.title')}</Text>
        <TextAction title={t('notifications.markAllRead')} icon="checkmark-done-outline"
          onPress={() => void markAllRead()} disabled={!unread} loading={markingAll.isLoading} />
      </View>
      {result.loading || (result.error && !notifications.length) ? (
        <CatalogState loading={result.loading} error={result.error} empty="" retry={result.retry} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={query.isFetching && !result.loading} onRefresh={result.retry}
            tintColor={theme.colors.accent} />}>
          {!notifications.length ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Icon name="notifications-outline" size={30} color={theme.colors.accent} />
              </View>
              <Text style={styles.emptyTitle}>{t('notifications.emptyTitle')}</Text>
              <Text style={[ui.body, { textAlign: 'center' }]}>{t('notifications.emptyBody')}</Text>
            </View>
          ) : sections.map((section) => (
            <View key={section.key} style={{ gap: 10 }}>
              <Text style={styles.section}>{section.title.toUpperCase()}</Text>
              {section.items.map((item) => (
                <Pressable key={item.id} accessibilityRole="button"
                  accessibilityLabel={[item.isRead ? null : t('notifications.unread'), item.title, item.message,
                    timeAgo(t, i18n.language, item.createdAt)].filter(Boolean).join('. ')}
                  onPress={() => open(item)}
                  style={({ pressed }) => [styles.card, !item.isRead && styles.cardUnread, { opacity: pressed ? 0.8 : 1 }]}>
                  <View style={[styles.icon, !item.isRead && styles.iconUnread]}>
                    <Icon name="gift-outline" size={18} color={theme.colors.accent} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={2}>{item.title}</Text>
                      {!item.isRead && <View style={styles.dot} />}
                    </View>
                    <Text style={styles.message}>{item.message}</Text>
                    <Text style={styles.time}>{timeAgo(t, i18n.language, item.createdAt)}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    content: { padding: 18, gap: 22, flexGrow: 1 },
    section: { color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
    card: {
      flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface,
    },
    // Unread: a soft tint and an accent dot, never a loud colour.
    cardUnread: { backgroundColor: c.soft, borderColor: c.accent + '55' },
    icon: {
      width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.soft,
    },
    iconUnread: { backgroundColor: c.surface },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    title: { flex: 1, color: c.text, fontSize: 15, fontWeight: '500' },
    titleUnread: { fontWeight: '700' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent, marginTop: 6 },
    message: { color: c.muted, fontSize: 13, lineHeight: 19 },
    time: { color: c.muted, fontSize: 11 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 30, paddingBottom: 60 },
    emptyIcon: {
      width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.soft, marginBottom: 6,
    },
    emptyTitle: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 22 },
  });
};

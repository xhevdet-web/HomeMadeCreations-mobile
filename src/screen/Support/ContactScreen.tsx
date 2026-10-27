import { useRef, useState, type ComponentRef } from 'react';
import { Keyboard, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Header, Icon, Page, useUI } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { apiError } from '@/api/apiSlice';
import { useSendContactMessageMutation } from '@/api/endpoints/contactSlice';
import { useGetOrdersQuery } from '@/api/endpoints/orderSlice';
import {
  CONTACT_LIMITS, SUPPORT_EMAIL, SUPPORT_TOPICS, supportMailUrl, validateContact, type ContactForm,
  type SupportTopic,
} from './content/contact';

const empty: ContactForm = { subject: '', message: '' };
const RECENT_ORDERS = 5;

/** A customer-friendly reason the message could not be sent; never raw server text for 5xx. */
function sendError(failure: unknown) {
  const error = apiError(failure);
  if (error.status === 429)
    return 'You’ve sent several messages recently. Please wait a few minutes and try again.';
  if (error.status === 400) return error.message;
  if (error.status === 0) return error.message;
  return 'Unable to send your message right now. Please try again later.';
}

export default function ContactScreen() {
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState<ContactForm>(empty);
  const [topic, setTopic] = useState<SupportTopic | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [send, { isLoading }] = useSendContactMessageMutation();
  const { data: orderPage } = useGetOrdersQuery(1, { skip: !user });
  const messageRef = useRef<ComponentRef<typeof TextInput>>(null);
  const sending = useRef(false);

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    || user?.userName || user?.email.split('@')[0] || 'Customer';
  const orders = (orderPage?.data ?? []).slice(0, RECENT_ORDERS);
  const showOrders = !!orders.length && (topic === 'Order question' || !!orderNumber);
  const length = form.message.trim().length;

  const update = (key: keyof ContactForm) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError('');
  };

  // A topic fills an empty subject (or replaces one it filled before).
  function pickTopic(option: SupportTopic) {
    const next = topic === option ? null : option;
    setTopic(next);
    setForm((current) => ({
      ...current,
      subject: !current.subject.trim() || SUPPORT_TOPICS.includes(current.subject as SupportTopic)
        ? next ?? ''
        : current.subject,
    }));
    if (next !== 'Order question') setOrderNumber(null);
  }

  async function submit() {
    if (sending.current || !user) return;
    Keyboard.dismiss();
    const invalid = validateContact(form);
    if (invalid) return setError(invalid);
    sending.current = true;
    setError('');
    try {
      await send({
        name: name.slice(0, CONTACT_LIMITS.name),
        email: user.email,
        subject: form.subject.replace(/\s+/g, ' ').trim(),
        message: form.message.trim(),
        ...(orderNumber ? { orderNumber } : {}),
      }).unwrap();
      setForm(empty);
      setTopic(null);
      setOrderNumber(null);
      setSentTo(user.email);
      toast.success('Message sent.');
    } catch (failure) {
      // The draft stays so the customer can retry.
      setError(sendError(failure));
    } finally {
      sending.current = false;
    }
  }

  async function openMailApp() {
    try {
      await Linking.openURL(supportMailUrl(topic));
    } catch {
      toast.error(`We couldn’t open an email app. You can write to us at ${SUPPORT_EMAIL}.`);
    }
  }

  if (sentTo)
    return (
      <Page style={{ gap: 22 }}>
        <Header title="Contact us" back />
        <View style={[ui.card, { alignItems: 'center', paddingVertical: 32 }]} accessibilityLiveRegion="polite">
          <View style={styles.successIcon}>
            <Icon name="paper-plane-outline" size={28} color={theme.colors.success} />
          </View>
          <Text style={ui.sectionTitle} accessibilityRole="header">Message sent</Text>
          <Text style={[ui.body, { textAlign: 'center' }]}>
            Thanks for getting in touch. We’ll reply to <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{sentTo}</Text> as soon as we can.
          </Text>
        </View>
        <Button title="Done" icon="checkmark" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
        <Button title="Send another message" secondary onPress={() => setSentTo(null)} />
      </Page>
    );

  return (
    <Page style={{ gap: 22 }}>
      <Header title="Contact us" back />
      <View style={{ gap: 8 }}>
        <Text style={ui.title}>Need some help?</Text>
        <Text style={ui.body}>
          Send us a message about your account, a design or an order. We’ll reply by email.
        </Text>
      </View>

      <View style={[ui.card, { gap: 12 }]}>
        <View style={ui.row}>
          <View style={styles.iconWrap}>
            <Icon name="person-circle-outline" size={22} color={theme.colors.accent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.label}>SENDING AS</Text>
            <Text style={styles.strong} numberOfLines={1}>{name}</Text>
            <Text style={ui.caption} numberOfLines={1} accessibilityLabel={`Your email ${user?.email ?? ''}`}>
              {user?.email}
            </Text>
          </View>
        </View>
        <Text style={ui.caption}>We’ll reply to this email address.</Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={styles.label}>WHAT IS IT ABOUT? (OPTIONAL)</Text>
        <View style={styles.chips}>
          {SUPPORT_TOPICS.map((option) => {
            const active = option === topic;
            return (
              <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: active }}
                onPress={() => pickTopic(option)} style={[ui.chip, active && ui.chipActive]}>
                <Text style={[ui.chipText, active && { color: theme.colors.onPrimary, fontWeight: '700' }]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {showOrders && (
        <View style={{ gap: 10 }}>
          <Text style={styles.label}>WHICH ORDER? (OPTIONAL)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {orders.map((order) => {
              const active = order.orderNumber === orderNumber;
              return (
                <Pressable key={order.id} accessibilityRole="button" accessibilityState={{ selected: active }}
                  accessibilityLabel={`Order ${order.orderNumber}, ${order.product.name}`}
                  onPress={() => setOrderNumber(active ? null : order.orderNumber)}
                  style={[styles.order, active && styles.orderActive]}>
                  <Text style={[styles.orderNumber, active && { color: theme.colors.accent }]}>#{order.orderNumber}</Text>
                  <Text style={ui.caption} numberOfLines={1}>{order.product.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={{ gap: 14 }}>
        <Field label="Subject" value={form.subject} onChangeText={update('subject')}
          placeholder="e.g. Question about my delivery" maxLength={CONTACT_LIMITS.subject}
          returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => messageRef.current?.focus()}
          editable={!isLoading} />
        <View style={{ gap: 6 }}>
          <Field ref={messageRef} label="Message" value={form.message} onChangeText={update('message')}
            placeholder="Tell us how we can help…" multiline maxLength={CONTACT_LIMITS.message}
            style={{ minHeight: 150 }} editable={!isLoading} />
          <Text style={[ui.caption, { textAlign: 'right' }]}
            accessibilityLabel={`${length} of ${CONTACT_LIMITS.message} characters`}>
            {length < CONTACT_LIMITS.messageMin && length > 0
              ? `${CONTACT_LIMITS.messageMin - length} more characters needed · `
              : ''}
            {length}/{CONTACT_LIMITS.message}
          </Text>
        </View>
      </View>

      {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
      <Button title="Send message" icon="paper-plane-outline" loading={isLoading}
        disabled={isLoading || !user} onPress={() => void submit()} />

      <Pressable accessibilityRole="button" accessibilityLabel={`Open your email app to write to ${SUPPORT_EMAIL}`}
        onPress={() => void openMailApp()} hitSlop={6} style={styles.fallback}>
        <Icon name="mail-outline" size={16} color={theme.colors.muted} />
        <Text style={ui.caption}>
          Prefer your own email app? <Text style={ui.textLink}>Write to {SUPPORT_EMAIL}</Text>
        </Text>
      </Pressable>
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    iconWrap: {
      width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.soft,
    },
    label: { color: c.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, paddingHorizontal: 4 },
    strong: { color: c.text, fontSize: 15, fontWeight: '600' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    order: {
      width: 170, padding: 12, gap: 2, borderRadius: 14,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    orderActive: { borderColor: c.accent, backgroundColor: c.soft },
    orderNumber: { color: c.text, fontSize: 13, fontWeight: '600' },
    fallback: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    successIcon: {
      width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.successSurface,
    },
  });
};

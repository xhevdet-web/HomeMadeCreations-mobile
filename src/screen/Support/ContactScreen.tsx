import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Header, Icon, Page, useUI } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import { toast } from '@/store/toastStore';
import { SUPPORT_EMAIL, SUPPORT_TOPICS, supportMailUrl, type SupportTopic } from './content/contact';

export default function ContactScreen() {
  const ui = useUI();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [topic, setTopic] = useState<SupportTopic | null>(null);
  const [opening, setOpening] = useState(false);
  const [noMailApp, setNoMailApp] = useState(false);

  async function sendEmail() {
    setOpening(true);
    try {
      // openURL rejects when no app can handle mailto: (e.g. no mail app set up).
      await Linking.openURL(supportMailUrl(topic));
      setNoMailApp(false);
    } catch {
      setNoMailApp(true);
      toast.error('We couldn’t open an email app. You can write to us at ' + SUPPORT_EMAIL + '.');
    } finally {
      setOpening(false);
    }
  }

  return (
    <Page style={{ gap: 22 }}>
      <Header title="Contact us" back />
      <View style={{ gap: 8 }}>
        <Text style={ui.title}>Need some help?</Text>
        <Text style={ui.body}>
          If you have a question about your account, design or order, we’re here to help.
        </Text>
      </View>

      <View style={ui.card}>
        <View style={ui.row}>
          <View style={styles.iconWrap}>
            <Icon name="mail-outline" size={20} color={theme.colors.accent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.label}>SUPPORT EMAIL</Text>
            {/* Selectable so it can be copied with a long press. */}
            <Text style={styles.email} selectable accessibilityLabel={`Support email ${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </Text>
          </View>
        </View>
        <Text style={ui.caption}>Press and hold the address to copy it.</Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={styles.label}>WHAT IS IT ABOUT? (OPTIONAL)</Text>
        <View style={styles.topics}>
          {SUPPORT_TOPICS.map((option) => {
            const active = option === topic;
            return (
              <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: active }}
                onPress={() => setTopic(active ? null : option)}
                style={[ui.chip, active && ui.chipActive]}>
                <Text style={[ui.chipText, active && { color: theme.colors.onPrimary, fontWeight: '700' }]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={ui.caption}>
          {topic ? `We’ll add “${topic}” to the subject of your email.` : 'Choosing a topic helps us answer faster.'}
        </Text>
      </View>

      <Button title="Send us an email" icon="mail-outline" loading={opening} onPress={() => void sendEmail()} />
      {noMailApp && (
        <View style={[ui.notice, { backgroundColor: theme.colors.soft }]} accessibilityLiveRegion="polite">
          <Icon name="information-circle-outline" size={18} color={theme.colors.accent} />
          <Text style={[ui.caption, { flex: 1, color: theme.colors.text }]} selectable>
            No email app is set up on this device. Write to us from any email account at {SUPPORT_EMAIL}.
          </Text>
        </View>
      )}
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
    email: { color: c.text, fontSize: 16, fontWeight: '600' },
    topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  });
};

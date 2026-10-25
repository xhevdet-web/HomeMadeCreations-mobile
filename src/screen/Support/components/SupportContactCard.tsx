import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Icon, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { SUPPORT_EMAIL } from '../content/contact';

/** "Questions?" card closing the FAQ and legal screens, leading to Contact us. */
export function SupportContactCard({ title = 'Questions?', text }: { title?: string; text?: string }) {
  const ui = useUI();
  const theme = useTheme();
  return (
    <View style={[ui.card, { backgroundColor: theme.colors.soft }]}>
      <View style={ui.row}>
        <View style={{
          width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
          backgroundColor: theme.colors.surface,
        }}>
          <Icon name="chatbubble-ellipses-outline" size={20} color={theme.colors.accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={ui.sectionTitle}>{title}</Text>
          <Text style={ui.caption} selectable>{text ?? SUPPORT_EMAIL}</Text>
        </View>
      </View>
      <Button title="Contact us" icon="arrow-forward" secondary onPress={() => router.push('/contact')} />
    </View>
  );
}

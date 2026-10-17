import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, useUI } from '@/components/common/ui';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';

export function DesignerFooter({ total, beads, disabled, onPreview }: {
  total: number;
  beads: number;
  disabled: boolean;
  onPreview: () => void;
}) {
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView edges={['bottom']} style={styles.bottom}>
      <View style={[ui.between, { width: '100%', maxWidth: 876, alignSelf: 'center' }]}>
        <View>
          <Text style={ui.caption}>
            Your creation{beads ? ` · ${beads} ${beads === 1 ? 'bead' : 'beads'}` : ''}
          </Text>
          <Text style={styles.total}>{money(total)}</Text>
        </View>
        <Button
          title="Preview"
          icon="arrow-forward"
          disabled={disabled}
          onPress={onPreview}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    bottom: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      padding: 18,
      backgroundColor: theme.colors.bottomBar,
    },
    total: { color: theme.colors.text, fontSize: 26, fontWeight: '600', marginTop: 3 },
  });
};

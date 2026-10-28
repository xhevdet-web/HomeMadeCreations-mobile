import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, useUI } from '@/components/common/ui';
import { useThemedStyles } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { type Theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export function DesignerFooter({ total, beads, label, disabled, onPreview }: {
  total: number;
  beads: number;
  /** Replaces the bead count, e.g. "5 flowers" in the Bouquet Studio. */
  label?: string;
  disabled: boolean;
  onPreview: () => void;
}) {
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const detail = label ?? (beads ? t('counts.bead', { count: beads }) : '');
  return (
    <SafeAreaView edges={['bottom']} style={styles.bottom}>
      <View style={[ui.between, { width: '100%', maxWidth: 876, alignSelf: 'center' }]}>
        <View>
          <Text style={ui.caption}>
            {detail ? t('studio.yourCreationWith', { detail }) : t('studio.yourCreation')}
          </Text>
          <Text style={styles.total}>{money(total)}</Text>
        </View>
        <Button
          title={t('studio.preview')}
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
      paddingHorizontal: 18,
      paddingVertical: 10,
      backgroundColor: theme.colors.bottomBar,
    },
    total: { color: theme.colors.text, fontSize: 20, fontWeight: '600', marginTop: 1 },
  });
};

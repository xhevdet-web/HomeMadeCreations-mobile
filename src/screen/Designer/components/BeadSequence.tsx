import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import { IconButton, useUI } from '@/components/common/ui';
import { DesignItem } from '@/components/designer/DesignItem';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { itemById } from '@/services/catalog';
import { type Theme } from '@/constants/theme';
import { DesignItem as DesignEntry } from '@/types/models';

export function BeadSequence({ items, selectedId, onSelect }: {
  items: DesignEntry[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
    >
      {items.map((entry, index) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            t('jewelry.selectPosition', { position: index + 1, name: itemById[entry.itemId].name })
          }
          key={entry.id}
          onPress={() => onSelect(entry.id === selectedId ? null : entry.id)}
          style={[
            styles.selectedBead,
            entry.id === selectedId && { borderColor: theme.colors.accent },
          ]}
        >
          <DesignItem item={itemById[entry.itemId]} size={26} />
          <Text style={styles.position}>{index + 1}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function SelectionToolbar({ name, canMoveLeft, canMoveRight, onMove, onRemove, onClose }: {
  name: string;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const ui = useUI();
  const { t } = useTranslation();
  return (
    <Animated.View entering={FadeIn.duration(180)} style={ui.between}>
      <Text style={[ui.caption, { flex: 1 }]}>{name}</Text>
      <IconButton
        name="arrow-back"
        label={t('jewelry.moveLeft')}
        onPress={() => onMove(-1)}
        disabled={!canMoveLeft}
      />
      <IconButton
        name="arrow-forward"
        label={t('jewelry.moveRight')}
        onPress={() => onMove(1)}
        disabled={!canMoveRight}
      />
      <IconButton
        name="trash-outline"
        label={t('jewelry.removeSelected')}
        onPress={onRemove}
      />
      <IconButton name="close" label={t('jewelry.finishSelecting')} onPress={onClose} />
    </Animated.View>
  );
}

const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    selectedBead: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 5,
      paddingVertical: 4,
      alignItems: 'center',
      minWidth: 38,
    },
    position: { color: theme.colors.muted, fontSize: 8 },
  });
};

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconButton } from '@/components/common/ui';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

/**
 * Tools for the selected piece or text, shown only while something is selected. The same
 * moves work with fingers on the canvas: drag to move, pinch or the corner handle to
 * resize and rotate.
 */
export function CanvasToolbar({ name, canDuplicate, canForward, canBackward, onSmaller, onLarger, onRotateLeft,
  onRotateRight, onForward, onBackward, onDuplicate, onRemove, onDone }: {
  name: string;
  canDuplicate: boolean;
  canForward: boolean;
  canBackward: boolean;
  onSmaller: () => void;
  onLarger: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onForward: () => void;
  onBackward: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.toolbar}>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}
        keyboardShouldPersistTaps="handled">
        <IconButton name="remove" label={`Make ${name} smaller`} onPress={onSmaller} />
        <IconButton name="add" label={`Make ${name} larger`} onPress={onLarger} />
        <IconButton name="refresh-outline" label={`Rotate ${name} left`} onPress={onRotateLeft} />
        <IconButton name="reload-outline" label={`Rotate ${name} right`} onPress={onRotateRight} />
        <IconButton name="arrow-up-circle-outline" label={`Bring ${name} forward`} onPress={onForward}
          disabled={!canForward} />
        <IconButton name="arrow-down-circle-outline" label={`Send ${name} backward`} onPress={onBackward}
          disabled={!canBackward} />
        <IconButton name="copy-outline" label={`Duplicate ${name}`} onPress={onDuplicate} disabled={!canDuplicate} />
        <IconButton name="trash-outline" label={`Delete ${name}`} onPress={onRemove} />
        <IconButton name="checkmark" label="Done editing" onPress={onDone} />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  toolbar: {
    gap: 6, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
  },
  name: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
});

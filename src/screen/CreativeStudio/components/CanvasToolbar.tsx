import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconButton } from '@/components/common/ui';
import { useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

/** Tools for the selected item; gestures on the canvas do the same with fingers. */
export function CanvasToolbar({ name, fixed, canDuplicate, onSmaller, onLarger, onRotateLeft, onRotateRight,
  onForward, onDuplicate, onRemove, onDone }: {
  name: string;
  /** A fixed item (gift bag) can only be removed. */
  fixed?: boolean;
  canDuplicate: boolean;
  onSmaller: () => void;
  onLarger: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onForward: () => void;
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
        {!fixed && (
          <>
            <IconButton name="remove" label={`Make ${name} smaller`} onPress={onSmaller} />
            <IconButton name="add" label={`Make ${name} larger`} onPress={onLarger} />
            <IconButton name="refresh-outline" label={`Rotate ${name} left`} onPress={onRotateLeft} />
            <IconButton name="reload-outline" label={`Rotate ${name} right`} onPress={onRotateRight} />
            <IconButton name="layers-outline" label={`Bring ${name} forward`} onPress={onForward} />
            <IconButton name="copy-outline" label={`Add another ${name}`} onPress={onDuplicate}
              disabled={!canDuplicate} />
          </>
        )}
        <IconButton name="trash-outline" label={`Remove ${name}`} onPress={onRemove} />
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

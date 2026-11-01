import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/common/ui';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';
import type { CategoryGroupId } from '../categoryGroups';

export interface GroupOption {
  id: CategoryGroupId;
  icon: IconName;
  count: number;
}

/** Search and group chips; they stay put above the grid while it scrolls. */
export function CategoryFilters({ search, onSearch, groups, group, onGroup }: {
  search: string;
  onSearch: (value: string) => void;
  /** Only groups that have categories; the row is hidden when there's nothing to choose. */
  groups: GroupOption[];
  group: CategoryGroupId;
  onGroup: (group: CategoryGroupId) => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.search}>
        <Icon name="search-outline" size={18} color={c.muted} />
        <TextInput accessibilityLabel={t('categories.searchLabel')} placeholder={t('categories.searchPlaceholder')}
          placeholderTextColor={c.muted} selectionColor={c.accent} keyboardAppearance={theme.mode}
          value={search} onChangeText={onSearch} returnKeyType="search" autoCorrect={false}
          style={styles.input} />
        {search.length > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('home.clearSearch')} onPress={() => onSearch('')}
            hitSlop={10}>
            <Icon name="close-circle" size={18} color={c.muted} />
          </Pressable>
        )}
      </View>
      {groups.length > 2 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled">
          {groups.map((option) => {
            const active = option.id === group;
            return (
              <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: active }}
                onPress={() => onGroup(option.id)}
                style={({ pressed }) => [styles.chip, active && styles.chipActive, { opacity: pressed ? 0.75 : 1 }]}>
                <Icon name={option.icon} size={15} color={active ? c.onPrimary : c.muted} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t(`categories.groups.${option.id}`)}
                </Text>
                <View style={[styles.count, active && styles.countActive]}>
                  <Text style={[styles.countText, active && styles.chipTextActive]}>{option.count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 48,
      paddingHorizontal: 15,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    input: { flex: 1, minHeight: 46, fontSize: 14, color: c.text },
    chips: { gap: 8, paddingVertical: 2 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 38,
      paddingLeft: 12,
      paddingRight: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { color: c.muted, fontSize: 13, fontWeight: '500' },
    chipTextActive: { color: c.onPrimary, fontWeight: '700' },
    count: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 5,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.elevated,
    },
    countActive: { backgroundColor: '#FFFFFF33' },
    countText: { color: c.muted, fontSize: 11, fontWeight: '600' },
  });
};

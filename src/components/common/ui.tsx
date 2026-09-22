import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  ColorValue,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { type Theme } from '@/constants/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
}) {
  const theme = useTheme();
  return (
    <Ionicons
      name={name}
      size={size}
      color={color ?? theme.colors.text}
      accessible={false}
      aria-hidden
    />
  );
}
export function IconButton({
  name,
  label,
  onPress,
  disabled = false,
  active = false,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const ui = useUI();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.iconButton,
        active && { backgroundColor: c.soft, borderColor: c.accent },
        { opacity: disabled ? 0.3 : pressed ? 0.65 : 1 },
      ]}
    >
      <Icon name={name} color={active ? c.accent : c.text} size={20} />
    </Pressable>
  );
}
export function Button({
  title,
  onPress,
  icon,
  secondary = false,
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const ui = useUI();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondaryButton,
        { opacity: disabled || loading ? 0.4 : pressed ? 0.75 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.onPrimary} />
      ) : (
        <>
          <Text style={[ui.buttonText, secondary && { color: c.text }]}>{title}</Text>
          {icon && <Icon name={icon} size={19} color={secondary ? c.text : c.onPrimary} />}
        </>
      )}
    </Pressable>
  );
}
export function Page({
  children,
  scroll = true,
  style,
  stickyHeaderIndices,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  stickyHeaderIndices?: number[];
}) {
  const ui = useUI();

  return (
    <SafeAreaView testID="screen" edges={['top', 'left', 'right']} style={ui.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {scroll ? (
          <ScrollView
            stickyHeaderIndices={stickyHeaderIndices}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[ui.pageContent, style]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[ui.pageContent, { flex: 1 }, style]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Header({
  title,
  subtitle,
  back = false,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const ui = useUI();

  return (
    <View style={ui.header}>
      {back && (
        <IconButton
          name="arrow-back"
          label="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      )}
      <View style={{ flex: 1 }}>
        <Text style={ui.headerTitle}>{title}</Text>
        {subtitle && <Text style={ui.caption}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}
export function Brand({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  const c = theme.colors;
  const ui = useUI();

  return (
    <View>
      <Text style={[ui.brand, compact && { fontSize: 26 }]}>
        HomeMade<Text style={{ color: c.accent }}>.</Text>
      </Text>
      <Text style={[ui.brandSub, compact && { fontSize: 7, letterSpacing: 1.2 }]}>
        BEADS & LITTLE WONDERS
      </Text>
    </View>
  );
}
export function SectionTitle({
  title,
  eyebrow,
  action,
  onPress,
}: {
  title: string;
  eyebrow?: string;
  action?: string;
  onPress?: () => void;
}) {
  const ui = useUI();

  return (
    <View style={ui.sectionHead}>
      <View style={{ flex: 1 }}>
        {eyebrow && <Text style={ui.eyebrow}>{eyebrow}</Text>}
        <Text style={ui.sectionTitle}>{title}</Text>
      </View>
      {action && (
        <Pressable onPress={onPress} accessibilityRole="button" hitSlop={10}>
          <Text style={ui.textLink}>{action} ↗</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const ui = useUI();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.chips}>
      {options.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityState={{ selected: option === value }}
          onPress={() => onChange(option)}
          style={[ui.chip, option === value && ui.chipActive]}
        >
          <Text
            style={[ui.chipText, option === value && { color: c.onPrimary, fontWeight: '700' }]}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const theme = useTheme();
  const c = theme.colors;
  const ui = useUI();

  return (
    <View style={{ gap: 8 }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        selectionColor={c.accent}
        keyboardAppearance={theme.mode}
        {...props}
        style={[
          ui.input,
          props.multiline && { minHeight: 90, textAlignVertical: 'top' },
          props.style,
        ]}
      />
      {error && <Text style={ui.error}>{error}</Text>}
    </View>
  );
}
export function EmptyState({
  icon,
  title,
  description,
  action,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  action: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const ui = useUI();

  return (
    <View style={ui.empty}>
      <View style={ui.emptyIcon}>
        <Icon name={icon} size={32} color={c.gold} />
      </View>
      <Text style={ui.sectionTitle}>{title}</Text>
      <Text style={[ui.body, { textAlign: 'center' }]}>{description}</Text>
      <Button title={action} onPress={onPress} icon="arrow-forward" />
    </View>
  );
}
export function Notice({ text }: { text: string }) {
  const theme = useTheme();
  const c = theme.colors;
  const ui = useUI();

  return (
    <View accessibilityLiveRegion="polite" style={ui.notice}>
      <Icon name="checkmark-circle-outline" color={c.success} size={18} />
      <Text style={[ui.caption, { color: c.success, flex: 1 }]}>{text}</Text>
    </View>
  );
}
const createUIStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: c.background },
    pageContent: {
      width: '100%',
      maxWidth: 920,
      alignSelf: 'center',
      padding: 22,
      paddingBottom: 36,
      gap: 24,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    between: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 48 },
    headerTitle: { fontSize: 19, color: c.text, fontWeight: '600' },
    brand: { fontFamily: theme.fonts.editorial, fontSize: 31, color: c.text, letterSpacing: -1.2 },
    brandSub: { fontSize: 8, color: c.gold, letterSpacing: 2.2, marginTop: 3 },
    title: { fontFamily: theme.fonts.editorial, fontSize: 36, color: c.text, lineHeight: 43 },
    sectionTitle: { fontFamily: theme.fonts.editorial, fontSize: 26, color: c.text },
    eyebrow: { color: c.gold, letterSpacing: 2, fontSize: 9, fontWeight: '600', marginBottom: 9 },
    body: { fontSize: 14, lineHeight: 23, color: c.muted },
    caption: { fontSize: 12, lineHeight: 19, color: c.muted },
    label: { color: c.text, fontSize: 12, fontWeight: '500' },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    textLink: { color: c.accent, fontSize: 12, fontWeight: '600' },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 20,
      padding: 20,
      gap: 16,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    button: {
      minHeight: 52,
      paddingHorizontal: 22,
      paddingVertical: 14,
      borderRadius: 15,
      backgroundColor: c.primary,
      flexDirection: 'row',
      gap: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: { color: c.onPrimary, fontSize: 14, fontWeight: '700' },
    secondaryButton: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    input: {
      minHeight: 50,
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      fontSize: 14,
    },
    chips: { gap: 8, paddingVertical: 2 },
    chip: {
      paddingHorizontal: 17,
      minHeight: 40,
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.accent },
    chipText: { color: c.muted, fontSize: 12 },
    divider: { height: 1, backgroundColor: c.border },
    error: { color: c.danger, fontSize: 12, lineHeight: 19 },
    notice: {
      padding: 12,
      backgroundColor: theme.colors.successSurface,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    empty: { alignItems: 'center', gap: 18, paddingVertical: 42, paddingHorizontal: 16 },
    emptyIcon: {
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};
export function useUI() {
  return useThemedStyles(createUIStyles);
}

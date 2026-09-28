import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useToastStore } from '@/store/toastStore';
import { Icon } from './ui';

export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
  const current = useToastStore(state => state.current);
  const dismiss = useToastStore(state => state.dismiss);
  useEffect(() => {
    if (!current) return;
    opacity.setValue(0);
    if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(current.message);
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(4550),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => { if (finished) dismiss(current.id); });
    return () => animation.stop();
  }, [current, dismiss, opacity]);
  function close() {
    if (!current) return;
    const id = current.id;
    opacity.stopAnimation();
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(({ finished }) => { if (finished) dismiss(id); });
  }
  if (!current) return null;
  const color = current.kind === 'error' ? theme.colors.danger : theme.colors.accent;
  return <Animated.View testID="flow-toast" pointerEvents="box-none" style={{ opacity, position: 'absolute', bottom: insets.bottom + 80,
    left: 12, right: 12, zIndex: 1000, alignItems: 'center' }}>
    <View pointerEvents="box-none" accessibilityRole="alert" accessibilityLiveRegion="polite"
      style={{ width: '100%', maxWidth: 600, flexDirection: 'row', alignItems: 'center',
        gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: color,
        backgroundColor: theme.colors.elevated, elevation: 8,
        shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12 }}>
      <View pointerEvents="none" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Icon name={current.kind === 'error' ? 'alert-circle-outline' :
        current.kind === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'} color={color} />
      <Text style={{ color: theme.colors.text, flex: 1, fontSize: 13, lineHeight: 20 }}>{current.message}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification"
        hitSlop={8} onPress={close} style={{ padding: 8 }}>
        <Icon name="close" size={20} />
      </Pressable>
    </View>
  </Animated.View>;
}

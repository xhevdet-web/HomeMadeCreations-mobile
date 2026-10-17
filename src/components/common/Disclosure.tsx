import { ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';

export function Disclosure({
  title,
  summary,
  children,
  initiallyOpen = false,
  disabled = false,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
  initiallyOpen?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const ui = useUI();
  const theme = useTheme();
  return (
    <View style={[ui.card, { padding: 16, gap: 0 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open, disabled }}
        aria-expanded={open}
        disabled={disabled}
        onPress={() => setOpen(!open)}
        style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={ui.label}>{title}</Text>
          {!!summary && <Text style={ui.caption}>{summary}</Text>}
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.muted} />
      </Pressable>
      {open && <View style={{ paddingTop: 16, gap: 16 }}>{children}</View>}
    </View>
  );
}

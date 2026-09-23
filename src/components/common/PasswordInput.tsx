import { useState } from 'react';
import { Pressable, TextInputProps, View } from 'react-native';
import { Field, Icon } from './ui';
import { useTheme } from '@/hooks/useTheme';

export function PasswordInput(props: TextInputProps & { label: string }) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  return (
    <View>
      <Field {...props} icon="lock-closed-outline" autoCapitalize="none" autoCorrect={false}
        secureTextEntry={!visible} style={{ paddingRight: 52 }} />
      <Pressable accessibilityRole="button" accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${props.label.toLowerCase()}`}
        onPress={() => setVisible(!visible)}
        style={{ position: 'absolute', right: 2, bottom: 2, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={visible ? 'eye-off-outline' : 'eye-outline'} size={19} color={theme.colors.muted} />
      </Pressable>
    </View>
  );
}

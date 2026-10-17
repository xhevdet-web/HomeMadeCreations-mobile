import { IconButton } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';

export function ThemeToggleButton() {
  const theme = useTheme();
  const toggleTheme = useThemeStore((state) => state.toggle);
  return (
    <IconButton
      name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
      label={theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onPress={toggleTheme}
    />
  );
}

import { IconButton } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from 'react-i18next';

export function ThemeToggleButton() {
  const theme = useTheme();
  const toggleTheme = useThemeStore((state) => state.toggle);
  const { t } = useTranslation();
  return (
    <IconButton
      name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
      label={theme.mode === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
      onPress={toggleTheme}
    />
  );
}

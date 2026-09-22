import { useMemo } from 'react';
import { Theme, themes } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export function useTheme(): Theme {
  const mode = useThemeStore((state) => state.mode);
  return themes[mode] ?? themes.dark;
}

// Style factories stay outside components; recalculate only when the palette changes.
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { useLanguageStore } from '@/store/languageStore';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Switches between English and Shqip before signing in (Welcome, Login, Register). It shows
 * a globe and the other language's code (EN / SQ), so it is recognisable whichever language is active.
 */
export function LanguageToggle() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const nextLanguage = language === 'sq' ? 'en' : 'sq';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('welcome.switchLanguageLabel')}
      onPress={() => setLanguage(nextLanguage)}
      style={({ pressed }) => ({
        minHeight: 44, paddingHorizontal: 14, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.65 : 1,
      })}>
      <Ionicons name="globe-outline" size={18} color={theme.colors.text} />
      <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>{nextLanguage.toUpperCase()}</Text>
    </Pressable>
  );
}

import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header, Icon, Page, useUI } from '@/components/common/ui';
import { useTheme } from '@/hooks/useTheme';
import { useLanguageStore } from '@/store/languageStore';
import { LANGUAGES, type AppLanguage } from '@/i18n';
import { SettingsRow, SettingsSection } from './components/Settings';

// Each language is shown in its own name, so it is recognisable whatever is selected.
const NAMES = { en: 'language.english', sq: 'language.albanian' } as const;

/** Language / Gjuha: the choice applies at once and is remembered after a restart. */
export default function LanguageScreen() {
  const ui = useUI();
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  return (
    <Page style={{ gap: 22 }}>
      <Header title={t('language.title')} back />
      <Text style={ui.body}>{t('language.subtitle')}</Text>
      {/* Bilingual on purpose: findable even after picking the wrong language. */}
      <SettingsSection title="Language / Gjuha">
        {LANGUAGES.map((code: AppLanguage, index) => {
          const selected = code === language;
          const name = t(NAMES[code]);
          return (
            <View key={code} accessibilityState={{ selected }}>
              <SettingsRow
                icon={selected ? 'radio-button-on' : 'radio-button-off'}
                title={name}
                value={selected ? '✓' : undefined}
                last={index === LANGUAGES.length - 1}
                onPress={() => setLanguage(code)}
              />
            </View>
          );
        })}
      </SettingsSection>
      <View style={[ui.row, { gap: 8 }]}>
        <Icon name="information-circle-outline" size={16} color={theme.colors.muted} />
        <Text style={[ui.caption, { flex: 1 }]}>{t('language.note')}</Text>
      </View>
    </Page>
  );
}

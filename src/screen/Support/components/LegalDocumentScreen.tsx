import { Text, View } from 'react-native';
import { dateLocale, isAppLanguage, type AppLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Header, Page, useUI } from '@/components/common/ui';
import type { LegalDocument } from '../content/types';
import { LegalSection } from './LegalSection';
import { SupportContactCard } from './SupportContactCard';

const formatDate = (iso: string, language: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(dateLocale(language), { day: 'numeric', month: 'long', year: 'numeric' });

/** Terms of Service and Privacy Policy share this readable, numbered layout, in the app language. */
export function LegalDocumentScreen({ documents }: { documents: Record<AppLanguage, LegalDocument> }) {
  const ui = useUI();
  const { t, i18n } = useTranslation();
  const document = documents[isAppLanguage(i18n.language) ? i18n.language : 'en'];
  return (
    <Page style={{ gap: 22 }}>
      <Header title={document.title} back />
      <View style={{ gap: 10 }}>
        <Text style={ui.eyebrow}>{t('support.legal.lastUpdated', { date: formatDate(document.lastUpdated, i18n.language).toUpperCase() })}</Text>
        <Text style={ui.title}>{document.title}</Text>
        <Text style={[ui.body, { fontSize: 15, lineHeight: 24 }]}>{document.intro}</Text>
      </View>
      {document.sections.map((section, index) => (
        <LegalSection key={section.title} number={index + 1} title={section.title} body={section.body} />
      ))}
      <SupportContactCard />
    </Page>
  );
}

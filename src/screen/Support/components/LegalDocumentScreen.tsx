import { Text, View } from 'react-native';
import { Header, Page, useUI } from '@/components/common/ui';
import type { LegalDocument } from '../content/types';
import { LegalSection } from './LegalSection';
import { SupportContactCard } from './SupportContactCard';

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** Terms of Service and Privacy Policy share this readable, numbered layout. */
export function LegalDocumentScreen({ document }: { document: LegalDocument }) {
  const ui = useUI();
  return (
    <Page style={{ gap: 22 }}>
      <Header title={document.title} back />
      <View style={{ gap: 10 }}>
        <Text style={ui.eyebrow}>LAST UPDATED {formatDate(document.lastUpdated).toUpperCase()}</Text>
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

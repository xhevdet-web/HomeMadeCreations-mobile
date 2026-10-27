import { LegalDocumentScreen } from './components/LegalDocumentScreen';
import { TERMS } from './content/terms';

export default function TermsScreen() {
  return <LegalDocumentScreen documents={TERMS} />;
}

import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Field, Header, Page, useUI } from '@/components/common/ui';
import { FaqSection } from './components/FaqSection';
import { SupportContactCard } from './components/SupportContactCard';
import { FAQ_SECTIONS } from './content/faq';
import { blockText } from './content/types';

export default function HelpFaqScreen() {
  const ui = useUI();
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  // Searching matches questions and answers; empty sections are hidden.
  const sections = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return FAQ_SECTIONS;
    return FAQ_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const text = [item.question, ...item.answer.map(blockText)].join(' ').toLowerCase();
        return words.every((word) => text.includes(word));
      }),
    })).filter((section) => section.items.length);
  }, [query]);

  const toggle = (id: string) => setOpenIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <Page style={{ gap: 22 }}>
      <Header title="Help & FAQ" back />
      <View style={{ gap: 8 }}>
        <Text style={ui.title}>How can we help?</Text>
        <Text style={ui.body}>
          Search or browse common questions about creating and ordering your personalised products.
        </Text>
      </View>
      <Field label="Search FAQs" icon="search-outline" value={query} onChangeText={setQuery}
        placeholder="Try “stock” or “payment”" returnKeyType="search" autoCorrect={false}
        clearButtonMode="while-editing" />
      {sections.length ? (
        sections.map((section) => (
          <FaqSection key={section.title} section={section} openIds={openIds} onToggle={toggle} />
        ))
      ) : (
        <Text style={[ui.body, { textAlign: 'center' }]} accessibilityLiveRegion="polite">
          No questions match “{query.trim()}”. Try another word, or contact us below.
        </Text>
      )}
      <SupportContactCard title="Still need help?" text="We’re happy to answer any question." />
    </Page>
  );
}

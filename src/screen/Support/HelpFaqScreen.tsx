import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { isAppLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Field, Header, Page, useUI } from '@/components/common/ui';
import { FaqSection } from './components/FaqSection';
import { SupportContactCard } from './components/SupportContactCard';
import { FAQ_SECTIONS } from './content/faq';
import { blockText } from './content/types';

export default function HelpFaqScreen() {
  const ui = useUI();
  const { t, i18n } = useTranslation();
  const faq = FAQ_SECTIONS[isAppLanguage(i18n.language) ? i18n.language : 'en'];
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  // Searching matches questions and answers; empty sections are hidden.
  const sections = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return faq;
    return faq.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const text = [item.question, ...item.answer.map(blockText)].join(' ').toLowerCase();
        return words.every((word) => text.includes(word));
      }),
    })).filter((section) => section.items.length);
  }, [query, faq]);

  const toggle = (id: string) => setOpenIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <Page style={{ gap: 22 }}>
      <Header title={t('support.help.title')} back />
      <View style={{ gap: 8 }}>
        <Text style={ui.title}>{t('support.help.heading')}</Text>
        <Text style={ui.body}>
          {t('support.help.intro')}
        </Text>
      </View>
      <Field label={t('support.help.searchLabel')} icon="search-outline" value={query} onChangeText={setQuery}
        placeholder={t('support.help.searchPlaceholder')} returnKeyType="search" autoCorrect={false}
        clearButtonMode="while-editing" />
      {sections.length ? (
        sections.map((section) => (
          <FaqSection key={section.title} section={section} openIds={openIds} onToggle={toggle} />
        ))
      ) : (
        <Text style={[ui.body, { textAlign: 'center' }]} accessibilityLiveRegion="polite">
          {t('support.help.noMatch', { query: query.trim() })}
        </Text>
      )}
      <SupportContactCard title={t('support.help.stillNeedHelp')} text={t('support.help.happyToAnswer')} />
    </Page>
  );
}

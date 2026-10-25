export const SUPPORT_EMAIL = 'xhevdetgerxhaliu1@gmail.com';
export const SUPPORT_SUBJECT = 'HomeMade Creator Support';

export const SUPPORT_TOPICS = [
  'Order question',
  'Design question',
  'Account question',
  'Technical problem',
  'Other',
] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

/** mailto: link with the subject (and topic) filled in. */
export function supportMailUrl(topic?: SupportTopic | null) {
  const subject = topic ? `${SUPPORT_SUBJECT}: ${topic}` : SUPPORT_SUBJECT;
  const body = topic ? `Topic: ${topic}\n\n` : '';
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    + (body ? `&body=${encodeURIComponent(body)}` : '');
}

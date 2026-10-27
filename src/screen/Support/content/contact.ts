// The shop's mailbox: the API sends from it and delivers Contact us messages to it.
export const SUPPORT_EMAIL = 'homemadecreator.shop@gmail.com';
export const SUPPORT_SUBJECT = 'HomeMade Creator Support';

export const SUPPORT_TOPICS = [
  'Order question',
  'Design question',
  'Account question',
  'Technical problem',
  'Other',
] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

// The API's limits for POST /contact, checked here first so customers see them early.
export const CONTACT_LIMITS = { subject: 150, messageMin: 10, message: 5000, name: 100 } as const;

export interface ContactForm {
  subject: string;
  message: string;
}

/** The first problem with the form, or null when it can be sent. */
export function validateContact(form: ContactForm): string | null {
  const subject = form.subject.trim();
  const message = form.message.trim();
  if (!subject) return 'Please add a subject.';
  if (subject.length > CONTACT_LIMITS.subject)
    return `Please keep the subject under ${CONTACT_LIMITS.subject} characters.`;
  if (!message) return 'Please write your message.';
  if (message.length < CONTACT_LIMITS.messageMin)
    return `Please tell us a little more (at least ${CONTACT_LIMITS.messageMin} characters).`;
  if (message.length > CONTACT_LIMITS.message)
    return `Please keep your message under ${CONTACT_LIMITS.message} characters.`;
  return null;
}

/** mailto: link with the subject (and topic) filled in. */
export function supportMailUrl(topic?: SupportTopic | null) {
  const subject = topic ? `${SUPPORT_SUBJECT}: ${topic}` : SUPPORT_SUBJECT;
  const body = topic ? `Topic: ${topic}\n\n` : '';
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    + (body ? `&body=${encodeURIComponent(body)}` : '');
}

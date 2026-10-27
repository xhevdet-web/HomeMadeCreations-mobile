import i18n from '@/i18n';

// The shop's mailbox: the API sends from it and delivers Contact us messages to it.
export const SUPPORT_EMAIL = 'homemadecreator.shop@gmail.com';
export const SUPPORT_SUBJECT = 'HomeMade Creator Support';

/** Topic ids; their labels are support.contact.topics.<id>. */
export const SUPPORT_TOPICS = ['order', 'design', 'account', 'technical', 'other'] as const;
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
  if (!subject) return i18n.t('support.contact.subjectRequired');
  if (subject.length > CONTACT_LIMITS.subject)
    return i18n.t('support.contact.subjectTooLong', { max: CONTACT_LIMITS.subject });
  if (!message) return i18n.t('support.contact.messageRequired');
  if (message.length < CONTACT_LIMITS.messageMin)
    return i18n.t('support.contact.messageTooShort', { min: CONTACT_LIMITS.messageMin });
  if (message.length > CONTACT_LIMITS.message)
    return i18n.t('support.contact.messageTooLong', { max: CONTACT_LIMITS.message });
  return null;
}

/** mailto: link with the subject (and the topic's label, in the app language) filled in. */
export function supportMailUrl(topic?: string | null) {
  const subject = topic ? `${SUPPORT_SUBJECT}: ${topic}` : SUPPORT_SUBJECT;
  const body = topic ? `Topic: ${topic}\n\n` : '';
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    + (body ? `&body=${encodeURIComponent(body)}` : '');
}

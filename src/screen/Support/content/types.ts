// Support content is plain data so it can later be served by the API without changing
// the screens.

/** A paragraph, a list, or a highlighted note that still needs a business decision. */
export type ContentBlock =
  | string
  | { list: string[]; ordered?: boolean }
  | { pending: string };

export interface FaqItem {
  id: string;
  question: string;
  answer: ContentBlock[];
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

export interface LegalDocument {
  title: string;
  /** ISO date, e.g. 2026-10-25. */
  lastUpdated: string;
  intro: string;
  sections: { title: string; body: ContentBlock[] }[];
}

/** Text of a block, used to search FAQs. */
export function blockText(block: ContentBlock) {
  if (typeof block === 'string') return block;
  return 'list' in block ? block.list.join(' ') : block.pending;
}

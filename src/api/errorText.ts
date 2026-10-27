import i18n from '@/i18n';

/** Problems detected by the app itself (not messages sent by the server). */
export type ClientErrorCode =
  | 'notConfigured'
  | 'sessionExpired'
  | 'invalidResponse'
  | 'serverError'
  | 'requestFailed'
  | 'timeout'
  | 'unreachable';

/** The text for a client error, in the current language; called when an error is shown. */
export const errorText = (code: ClientErrorCode, status = 0) => i18n.t(`errors.${code}`, { status });

// The app's one password policy, shared by registration and change password. It mirrors
// the API (homeMadeApi/src/modules/auth/password.ts), which validates it again.
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

/** Each rule (screens show it as `auth.password.ruleMin` / `ruleMax`) and whether it is met. */
export function passwordRequirements(password: string) {
  return [
    { id: 'min', count: PASSWORD_MIN_LENGTH, met: password.length >= PASSWORD_MIN_LENGTH },
    { id: 'max', count: PASSWORD_MAX_LENGTH, met: password.length <= PASSWORD_MAX_LENGTH },
  ] as const;
}

export function meetsPasswordPolicy(password: string) {
  return passwordRequirements(password).every((rule) => rule.met);
}

// The app's one password policy, shared by registration and change password. It mirrors
// the API (homeMadeApi/src/modules/auth/password.ts), which validates it again.
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

/** Each rule with whether `password` meets it, for showing the requirements. */
export function passwordRequirements(password: string) {
  return [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    { label: `No more than ${PASSWORD_MAX_LENGTH} characters`, met: password.length <= PASSWORD_MAX_LENGTH },
  ];
}

export function meetsPasswordPolicy(password: string) {
  return passwordRequirements(password).every((rule) => rule.met);
}

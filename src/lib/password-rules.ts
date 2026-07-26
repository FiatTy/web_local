export interface PasswordRules {
  minLength: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
}

export function getPasswordRules(password: string): PasswordRules {
  return {
    minLength: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%&*.]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const rules = getPasswordRules(password);
  return rules.minLength && rules.upper && rules.lower && rules.number && rules.special;
}

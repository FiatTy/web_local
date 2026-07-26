import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Check, Circle, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { FIELD_INPUT_CLASS, FormField } from '@/components/common/FormField';
import { Portal } from '@/components/common/Portal';
import { useChangePassword } from '@/features/user/hooks/useAccount';
import { useToast } from '@/lib/toast/toast-context';
import { getPasswordRules, isPasswordValid } from '@/lib/password-rules';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const changePassword = useChangePassword();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');

  const rules = useMemo(() => getPasswordRules(newPassword), [newPassword]);
  const ruleItems = [
    { ok: rules.minLength, labelKey: 'ACCOUNT.RULE_MINLENGTH' },
    { ok: rules.upper, labelKey: 'ACCOUNT.RULE_UPPERCASE' },
    { ok: rules.lower, labelKey: 'ACCOUNT.RULE_LOWERCASE' },
    { ok: rules.number, labelKey: 'ACCOUNT.RULE_NUMBER' },
    { ok: rules.special, labelKey: 'ACCOUNT.RULE_SPECIAL' },
  ];

  const mismatch =
    Boolean(newPassword) && Boolean(confirmPassword) && newPassword !== confirmPassword;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!oldPassword) {
      setError(t('ACCOUNT.OLD_PASSWORD_REQUIRED'));
      return;
    }
    if (!isPasswordValid(newPassword)) {
      setError(t('ACCOUNT.PASSWORD_WEAK'));
      return;
    }
    if (!confirmPassword) {
      setError(t('ACCOUNT.CONFIRM_PASSWORD_REQUIRED'));
      return;
    }
    if (mismatch) {
      setError(t('ACCOUNT.PASSWORD_MISMATCH'));
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: oldPassword,
        newPassword,
      });
      showToast({ tone: 'success', title: t('ACCOUNT.PASSWORD_CHANGED') });
      onClose();
    } catch (caught) {
      const status = axios.isAxiosError(caught) ? caught.response?.status : undefined;
      setError(
        status === 400 || status === 401 ? t('ACCOUNT.OLD_PASSWORD_WRONG') : t('COMMON.ERROR'),
      );
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4">
        <button
          type="button"
          aria-label={t('COMMON.CANCEL')}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <form
          onSubmit={handleSubmit}
          className="dialog-enter relative my-auto w-full max-w-md rounded-xl border border-border bg-surface shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-fg">{t('ACCOUNT.CHANGE_PASSWORD')}</h2>
            <button
              type="button"
              aria-label={t('COMMON.CLOSE')}
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4 px-5 py-5">
            <FormField id="oldPassword" label={t('ACCOUNT.OLD_PASSWORD')}>
              <input
                id="oldPassword"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                className={FIELD_INPUT_CLASS}
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
              />
            </FormField>

            <FormField id="newPassword" label={t('ACCOUNT.NEW_PASSWORD')}>
              <div className="relative">
                <input
                  id="newPassword"
                  type={visible ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`${FIELD_INPUT_CLASS} pr-10`}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label={visible ? t('ACCOUNT.HIDE_PASSWORD') : t('ACCOUNT.SHOW_PASSWORD')}
                  onClick={() => setVisible((value) => !value)}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-faint transition-colors hover:text-fg"
                >
                  {visible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </FormField>

            <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
              {ruleItems.map((rule) => (
                <li
                  key={rule.labelKey}
                  className={`flex items-center gap-1.5 text-[11px] ${
                    rule.ok ? 'text-success' : 'text-faint'
                  }`}
                >
                  {rule.ok ? <Check size={11} /> : <Circle size={11} />}
                  {t(rule.labelKey)}
                </li>
              ))}
            </ul>

            <FormField
              id="confirmPassword"
              label={t('ACCOUNT.CONFIRM_PASSWORD')}
              error={mismatch ? t('ACCOUNT.PASSWORD_MISMATCH') : undefined}
            >
              <input
                id="confirmPassword"
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
                className={FIELD_INPUT_CLASS}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </FormField>

            {error ? (
              <p role="alert" className="text-xs text-danger">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
            >
              {t('COMMON.CANCEL')}
            </button>
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changePassword.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
              {t('COMMON.SAVE')}
            </button>
          </div>
        </form>
      </div>
    </Portal>
  );
}

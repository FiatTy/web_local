import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Search,
  Trash2,
  TriangleAlert,
  UserPlus,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { FIELD_INPUT_CLASS, FormField } from '@/components/common/FormField';
import { useToast } from '@/lib/toast/toast-context';
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '@/features/user/hooks/useUsers';
import type { UserInfo } from '@/types/user';

const ROLES: UserInfo['role'][] = ['ADMIN', 'USER'];
const NEW_USER_STATUS = 'UNVERIFIED';

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-primary-subtle text-primary',
  USER: 'bg-surface-2 text-muted',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-success/12 text-success',
  VERIFIED: 'bg-success/12 text-success',
  UNVERIFIED: 'bg-warning/12 text-warning',
  INACTIVE: 'bg-danger/12 text-danger',
};

function emptyUser(): UserInfo {
  return {
    id: '0',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'USER',
    status: '',
  };
}

export function UserManagementPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const usersQuery = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [searchText, setSearchText] = useState('');
  const [modalUser, setModalUser] = useState<UserInfo | null>(null);
  const [originalUser, setOriginalUser] = useState<UserInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<UserInfo | null>(null);

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const isEditing = originalUser !== null;

  const filteredUsers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) {
      return users;
    }
    return users.filter((user) => (user.username ?? '').toLowerCase().startsWith(keyword));
  }, [users, searchText]);

  const duplicateEmail = useMemo(() => {
    if (!modalUser) {
      return false;
    }
    const email = modalUser.email.trim().toLowerCase();
    if (!email || email === originalUser?.email.toLowerCase()) {
      return false;
    }
    return users.some((user) => user.email.toLowerCase() === email && user.id !== modalUser.id);
  }, [modalUser, originalUser, users]);

  const canSave = useMemo(() => {
    if (!modalUser || !modalUser.username || !modalUser.email || !modalUser.role) {
      return false;
    }
    if (!isEditing) {
      return true;
    }
    return !(
      modalUser.username === originalUser?.username &&
      modalUser.email === originalUser?.email &&
      modalUser.role === originalUser?.role
    );
  }, [modalUser, originalUser, isEditing]);

  const isSubmitting = createUser.isPending || updateUser.isPending;

  function openAddUser() {
    setModalUser(emptyUser());
    setOriginalUser(null);
    setSubmitted(false);
    setShowPassword(false);
  }

  function openEditUser(user: UserInfo) {
    setModalUser({ ...user });
    setOriginalUser({ ...user });
    setSubmitted(false);
    setShowPassword(false);
  }

  function closeModal() {
    setModalUser(null);
    setOriginalUser(null);
    setSubmitted(false);
  }

  function patchModal(patch: Partial<UserInfo>) {
    setModalUser((current) => (current ? { ...current, ...patch } : current));
  }

  async function handleSubmit() {
    if (!modalUser) {
      return;
    }
    setSubmitted(true);
    if (!canSave || duplicateEmail) {
      return;
    }

    const payload: UserInfo = {
      id: modalUser.id,
      username: modalUser.username,
      email: modalUser.email,
      phone: modalUser.phone,
      role: modalUser.role,
      password: modalUser.password,
      status: isEditing ? modalUser.status : NEW_USER_STATUS,
    };

    try {
      if (isEditing) {
        await updateUser.mutateAsync(payload);
      } else {
        await createUser.mutateAsync(payload);
      }
      closeModal();
    } catch {
      showToast({
        tone: 'error',
        title: t('COMMON.ERROR'),
        description: t('USER_MGT.SAVE_FAILED_TEXT'),
      });
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    try {
      await deleteUser.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setPendingDelete(null);
      showToast({
        tone: 'error',
        title: t('USER_MGT.DELETE_FAILED_TITLE'),
        description: t('USER_MGT.DELETE_FAILED_TEXT'),
      });
    }
  }

  return (
    <div>
      <PageHeader
        title={t('SETTING.USER.TITLE')}
        subtitle={t('USER_MGT.SUBTITLE')}
        actions={
          <button
            type="button"
            onClick={openAddUser}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99]"
          >
            <UserPlus size={16} />
            {t('USER_MGT.ADD_USER')}
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            className={`${FIELD_INPUT_CLASS} pl-9`}
            placeholder={t('USER_MGT.SEARCH_PLACEHOLDER')}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wide text-faint sm:ml-1">
          {t('USER_MGT.USERS_COUNT', { total: filteredUsers.length })}
        </span>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        {usersQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" />
            {t('COMMON.LOADING')}
          </div>
        ) : usersQuery.isError ? (
          <div className="flex items-start gap-2.5 px-5 py-10 text-sm text-danger">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            <p>{t('USER_MGT.LOAD_ERROR')}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted">{t('USER_MGT.NO_USERS')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <caption className="sr-only">{t('USER_MGT.TABLE_CAPTION')}</caption>
              <thead>
                <tr className="border-b border-border">
                  {[
                    'SETTING.USER.USERNAME',
                    'SETTING.USER.EMAIL',
                    'USER_MGT.PHONE',
                    'SETTING.USER.ROLE',
                    'SETTING.USER.STATUS',
                  ].map((key) => (
                    <th
                      key={key}
                      className="px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint"
                    >
                      {t(key)}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                    {t('SETTING.USER.ACTIONS')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const status = (user.status ?? '').toUpperCase();
                  return (
                    <tr key={user.id} className="transition-colors hover:bg-surface-2/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold uppercase text-primary">
                            {user.username?.charAt(0) || '?'}
                          </span>
                          <span className="font-medium text-fg">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted">{user.email}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted">
                        {user.phone || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${
                            ROLE_BADGE[user.role] ?? 'bg-surface-2 text-muted'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {status ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              STATUS_BADGE[status] ?? 'bg-surface-2 text-muted'
                            }`}
                          >
                            {status}
                          </span>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            aria-label={t('COMMON.EDIT')}
                            onClick={() => openEditUser(user)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={t('COMMON.DELETE')}
                            onClick={() => setPendingDelete(user)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('USER_MGT.CANCEL')}
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-fg">
                {t(isEditing ? 'USER_MGT.UPDATE_USER' : 'USER_MGT.ADD_USER')}
              </h2>
              <button
                type="button"
                aria-label={t('COMMON.CLOSE')}
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <FormField
                id="username"
                label={t('SETTING.USER.USERNAME')}
                error={submitted && !modalUser.username ? t('USER_MGT.NAME_REQUIRED') : ''}
              >
                <input
                  id="username"
                  type="text"
                  className={FIELD_INPUT_CLASS}
                  value={modalUser.username}
                  onChange={(event) => patchModal({ username: event.target.value })}
                />
              </FormField>

              {!isEditing ? (
                <FormField
                  id="password"
                  label={t('USER_MGT.PASSWORD')}
                  error={submitted && !modalUser.password ? t('USER_MGT.PASSWORD_REQUIRED') : ''}
                >
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`${FIELD_INPUT_CLASS} pr-11`}
                      value={modalUser.password}
                      onChange={(event) => patchModal({ password: event.target.value })}
                    />
                    <button
                      type="button"
                      aria-label={t(
                        showPassword ? 'SONARQUBE_CONFIG.HIDE' : 'SONARQUBE_CONFIG.SHOW',
                      )}
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-fg"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </FormField>
              ) : null}

              <FormField
                id="phone"
                label={t('USER_MGT.PHONE')}
                error={submitted && !modalUser.phone ? t('USER_MGT.PHONE_REQUIRED') : ''}
              >
                <input
                  id="phone"
                  type="text"
                  inputMode="numeric"
                  className={FIELD_INPUT_CLASS}
                  value={modalUser.phone ?? ''}
                  onChange={(event) => patchModal({ phone: event.target.value })}
                />
              </FormField>

              <FormField
                id="email"
                label={t('SETTING.USER.EMAIL')}
                error={
                  submitted && !modalUser.email
                    ? t('USER_MGT.EMAIL_REQUIRED')
                    : duplicateEmail
                      ? t('USER_MGT.EMAIL_ALREADY_USED')
                      : ''
                }
              >
                <input
                  id="email"
                  type="email"
                  className={FIELD_INPUT_CLASS}
                  value={modalUser.email}
                  onChange={(event) => patchModal({ email: event.target.value })}
                />
              </FormField>

              <FormField
                id="role"
                label={t('SETTING.USER.ROLE')}
                error={submitted && !modalUser.role ? t('USER_MGT.ROLE_REQUIRED') : ''}
              >
                <select
                  id="role"
                  className={FIELD_INPUT_CLASS}
                  value={modalUser.role}
                  onChange={(event) => patchModal({ role: event.target.value as UserInfo['role'] })}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
              >
                {t('USER_MGT.CANCEL')}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!canSave || duplicateEmail || isSubmitting}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
                {t(isEditing ? 'USER_MGT.UPDATE' : 'USER_MGT.ADD')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('USER_MGT.CANCEL_BUTTON')}
            className="absolute inset-0 bg-black/50"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/12 text-danger">
              <Trash2 size={20} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-fg">
              {t('USER_MGT.CONFIRM_DELETE_TITLE')}
            </h2>
            <p className="mt-1.5 text-sm text-muted">{t('USER_MGT.CONFIRM_DELETE_TEXT')}</p>
            <p className="mt-2 truncate text-sm font-medium text-fg">{pendingDelete.username}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
              >
                {t('USER_MGT.CANCEL_BUTTON')}
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deleteUser.isPending}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-danger px-4 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-70"
              >
                {deleteUser.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  t('USER_MGT.CONFIRM_BUTTON')
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

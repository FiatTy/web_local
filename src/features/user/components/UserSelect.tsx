import { useTranslation } from 'react-i18next';
import { FIELD_INPUT_CLASS, FormField } from '@/components/common/FormField';
import { useUsers } from '@/features/user/hooks/useUsers';

interface UserSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function UserSelect({ id, value, onChange, error }: UserSelectProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useUsers();
  const users = data ?? [];
  const unavailable = isError || (!isPending && users.length === 0);

  return (
    <FormField
      id={id}
      label={t('ISSUE_MODAL.ASSIGN_TO')}
      error={error || (unavailable ? t('ISSUE_MODAL.USER_LIST_UNAVAILABLE') : undefined)}
    >
      <select
        id={id}
        className={FIELD_INPUT_CLASS}
        value={value}
        disabled={isPending || unavailable}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{isPending ? t('COMMON.LOADING') : t('ISSUE_MODAL.SELECT_USER')}</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.username}
          </option>
        ))}
      </select>
    </FormField>
  );
}

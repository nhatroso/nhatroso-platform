import { Contract } from '@nhatroso/shared';
import { useTranslations } from 'next-intl';

interface ContractStreamProps {
  contracts: Contract[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ContractStream({
  contracts,
  selectedId,
  onSelect,
}: ContractStreamProps) {
  const t = useTranslations('Contracts');

  if (contracts.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        No contracts found.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1 p-2">
      {contracts.map((c) => {
        const isSelected = c.id === selectedId;

        return (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c.id)}
              className={`w-full rounded-lg px-3 py-3 text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-50 ring-1 ring-inset ring-blue-600 dark:bg-blue-900/20 dark:ring-blue-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3
                    className={`truncate text-sm font-semibold ${
                      isSelected
                        ? 'text-blue-800 dark:text-blue-300'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {t('Room')}: {c.building_name} - {c.floor_name} - {c.room_code}
                  </h3>
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    {t('Tenant')}: {c.tenant_name}
                  </p>
                </div>
                <span
                  className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    c.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {t(c.status === 'ACTIVE' ? 'Active' : 'Ended')}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

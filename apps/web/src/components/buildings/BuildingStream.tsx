import { Building } from '@nhatroso/shared';
import { useTranslations } from 'next-intl';

interface BuildingStreamProps {
  buildings: Building[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function BuildingStream({
  buildings,
  selectedId,
  onSelect,
}: BuildingStreamProps) {
  const t = useTranslations('Buildings');

  if (buildings.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('EmptyBuildings')}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {buildings.map((b) => {
        const isSelected = b.id === selectedId;

        return (
          <li key={b.id}>
            <button
              onClick={() => onSelect(b.id)}
              className={`w-full rounded-lg px-4 py-3 text-left transition-all duration-200 border ${
                isSelected
                  ? 'bg-blue-50 border-blue-600 dark:bg-blue-900/30 dark:border-blue-500 shadow-sm'
                  : 'bg-white border-transparent hover:border-gray-300 hover:shadow-sm dark:bg-gray-800 dark:hover:border-gray-600'
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
                    {b.name}
                  </h3>
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    {b.address || t('NoAddress')}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                    b.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t(`Status_${b.status}`)}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

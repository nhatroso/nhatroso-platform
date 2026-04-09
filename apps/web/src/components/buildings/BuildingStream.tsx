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
      <div className="p-6 text-center text-body text-gray-muted">
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
                  ? 'bg-primary-light border-primary shadow-sm'
                  : 'bg-gray-card border-gray-border hover:border-gray-muted/50 hover:bg-gray-surface hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3
                    className={`truncate text-body font-semibold ${
                      isSelected ? 'text-primary' : 'text-gray-text'
                    }`}
                  >
                    {b.name}
                  </h3>
                  <p className="mt-1 truncate text-tiny text-gray-muted">
                    {b.address || t('NoAddress')}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2.5 py-0.5 text-tiny font-semibold ${
                    b.status === 'ACTIVE'
                      ? 'bg-success-light text-success'
                      : 'bg-gray-subtle text-gray-muted border border-gray-border'
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

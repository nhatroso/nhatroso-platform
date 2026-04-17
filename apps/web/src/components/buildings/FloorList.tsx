import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Floor, CreateFloorInput } from '@nhatroso/shared';
import { getFloors, createFloor } from '@/services/api/buildings';
import { RoomList } from './RoomList';

interface FloorListProps {
  buildingId: string;
}

export function FloorList({ buildingId }: FloorListProps) {
  const t = useTranslations('Buildings');
  const [floors, setFloors] = React.useState<Floor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newIdentifier, setNewIdentifier] = React.useState('');
  const [expandedFloorId, setExpandedFloorId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    fetchFloors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId]);

  const fetchFloors = async () => {
    try {
      setLoading(true);
      const data = await getFloors(buildingId);
      setFloors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdentifier.trim()) return;
    try {
      setIsCreating(true);
      const payload: CreateFloorInput = { identifier: newIdentifier };
      const newFloor = await createFloor(buildingId, payload);
      setNewIdentifier('');
      setExpandedFloorId(newFloor.id);
      fetchFloors();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleFloor = (id: string) => {
    setExpandedFloorId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center p-6">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-subtle border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-tiny font-semibold uppercase tracking-wider text-gray-muted">
          {t('Floors')}
        </h4>
      </div>

      <div className="space-y-2">
        {floors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-border p-6 text-center text-tiny text-gray-muted">
            {t('EmptyFloors')}
          </div>
        ) : (
          floors.map((fl) => {
            const isExpanded = expandedFloorId === fl.id;

            if (expandedFloorId && !isExpanded) return null;

            return (
              <div
                key={fl.id}
                className={`overflow-hidden border transition-all duration-200 ${
                  isExpanded
                    ? 'rounded-sm border-primary bg-gray-card shadow-sm'
                    : 'rounded-xl border-gray-border bg-gray-card hover:border-primary-light'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFloor(fl.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-body font-medium transition-colors ${isExpanded ? 'text-primary' : 'text-gray-text'}`}
                    >
                      {fl.identifier}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-tiny font-medium uppercase tracking-wider ${
                        fl.status === 'ACTIVE'
                          ? 'bg-success-light text-success dark:bg-success-dark/20 dark:text-success-dark'
                          : 'bg-gray-subtle text-gray-muted'
                      }`}
                    >
                      {t(`Status_${fl.status}`)}
                    </span>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-muted transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-border bg-gray-surface p-3">
                    <RoomList floorId={fl.id} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!expandedFloorId && (
        <div className="mt-4 rounded-xl border border-gray-border bg-gray-card p-4 shadow-sm">
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={newIdentifier}
              onChange={(e) => setNewIdentifier(e.target.value)}
              placeholder={t('PlaceholderFloorName')}
              className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={isCreating || !newIdentifier.trim()}
              className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-body font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary-light disabled:opacity-50 dark:bg-primary dark:hover:bg-primary-hover transition-colors"
            >
              {t('AddFloor')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

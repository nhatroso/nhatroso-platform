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
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t('Floors')}
        </h4>
      </div>

      <div className="space-y-2">
        {floors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
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
                    ? 'rounded-sm border-blue-300 bg-white shadow-sm dark:border-blue-500/50 dark:bg-gray-800'
                    : 'rounded-xl border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFloor(fl.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium transition-colors ${isExpanded ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}
                    >
                      {fl.identifier}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        fl.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {t(`Status_${fl.status}`)}
                    </span>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}
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
                  <div className="border-t border-gray-100 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-900/80">
                    <RoomList floorId={fl.id} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!expandedFloorId && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={newIdentifier}
              onChange={(e) => setNewIdentifier(e.target.value)}
              placeholder={t('PlaceholderFloorName')}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={isCreating || !newIdentifier.trim()}
              className="shrink-0 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              {t('AddFloor')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Floor, CreateFloorInput } from '@nhatroso/shared';
import { getFloors, createFloor } from '@/services/api/buildings';

interface FloorListProps {
  blockId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FloorList({ blockId, selectedId, onSelect }: FloorListProps) {
  const t = useTranslations('Buildings');
  const [floors, setFloors] = React.useState<Floor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newIdentifier, setNewIdentifier] = React.useState('');

  React.useEffect(() => {
    fetchFloors();
  }, [blockId]);

  const fetchFloors = async () => {
    try {
      setLoading(true);
      const data = await getFloors(blockId);
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
      await createFloor(blockId, payload);
      setNewIdentifier('');
      fetchFloors();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          {t('LoadingFloors')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-200 bg-zinc-100 p-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">
          {t('Floors')}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {floors.length === 0 ? (
          <div className="p-6 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
            {t('EmptyFloors')}
          </div>
        ) : (
          <ul className="flex flex-col">
            {floors.map((fl) => (
              <li
                key={fl.id}
                className="border-b border-zinc-200 last:border-0"
              >
                <button
                  type="button"
                  onClick={() => onSelect(fl.id)}
                  className={`flex w-full items-center justify-between p-4 transition-colors ${
                    selectedId === fl.id
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <span className="font-bold uppercase">{fl.identifier}</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] uppercase font-black tracking-widest px-1.5 py-0.5 ${
                        selectedId === fl.id
                          ? 'bg-zinc-700 text-zinc-200'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {t(`Status_${fl.status}`)}
                    </span>
                    <svg
                      className={`h-4 w-4 ${
                        selectedId === fl.id ? 'text-white' : 'text-zinc-300'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-zinc-200 bg-zinc-50 p-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-2">
          <input
            type="text"
            value={newIdentifier}
            onChange={(e) => setNewIdentifier(e.target.value)}
            placeholder={t('PlaceholderFloorName')}
            className="w-full rounded-none border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-0"
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={isCreating || !newIdentifier.trim()}
            className="w-full rounded-none bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-transform hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {t('AddFloor')}
          </button>
        </form>
      </div>
    </div>
  );
}

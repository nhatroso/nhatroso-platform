import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Block, CreateBlockInput } from '@nhatroso/shared';
import { getBlocks, createBlock } from '@/services/api/buildings';

interface BlockListProps {
  buildingId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function BlockList({
  buildingId,
  selectedId,
  onSelect,
}: BlockListProps) {
  const t = useTranslations('Buildings');
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newIdentifier, setNewIdentifier] = React.useState('');

  React.useEffect(() => {
    fetchBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId]);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const data = await getBlocks(buildingId);
      setBlocks(data);
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
      const payload: CreateBlockInput = { identifier: newIdentifier };
      await createBlock(buildingId, payload);
      setNewIdentifier('');
      fetchBlocks();
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
          {t('LoadingBlocks')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-200 bg-zinc-100 p-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">
          {t('Blocks')}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {blocks.length === 0 ? (
          <div className="p-6 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
            {t('EmptyBlocks')}
          </div>
        ) : (
          <ul className="flex flex-col">
            {blocks.map((blk) => (
              <li
                key={blk.id}
                className="border-b border-zinc-200 last:border-0"
              >
                <button
                  type="button"
                  onClick={() => onSelect(blk.id)}
                  className={`flex w-full items-center justify-between p-4 transition-colors ${
                    selectedId === blk.id
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <span className="font-bold uppercase">{blk.identifier}</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] uppercase font-black tracking-widest px-1.5 py-0.5 ${
                        selectedId === blk.id
                          ? 'bg-zinc-700 text-zinc-200'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {t(`Status_${blk.status}`)}
                    </span>
                    <svg
                      className={`h-4 w-4 ${
                        selectedId === blk.id ? 'text-white' : 'text-zinc-300'
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
            placeholder={t('PlaceholderBlockName')}
            className="w-full rounded-none border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-0"
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={isCreating || !newIdentifier.trim()}
            className="w-full rounded-none bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-transform hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {t('AddBlock')}
          </button>
        </form>
      </div>
    </div>
  );
}

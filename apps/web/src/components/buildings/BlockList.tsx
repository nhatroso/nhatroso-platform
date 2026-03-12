import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Block, CreateBlockInput } from '@nhatroso/shared';
import { getBlocks, createBlock } from '@/services/api/buildings';
import { FloorList } from './FloorList';

interface BlockListProps {
  buildingId: string;
}

export function BlockList({ buildingId }: BlockListProps) {
  const t = useTranslations('Buildings');
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newIdentifier, setNewIdentifier] = React.useState('');
  const [expandedBlockId, setExpandedBlockId] = React.useState<string | null>(
    null,
  );

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
      const newBlock = await createBlock(buildingId, payload);
      setNewIdentifier('');
      setExpandedBlockId(newBlock.id);
      fetchBlocks();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleBlock = (id: string) => {
    setExpandedBlockId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t('Blocks')}
        </h3>
      </div>

      <div className="space-y-3">
        {blocks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {t('EmptyBlocks')}
          </div>
        ) : (
          blocks.map((blk) => {
            const isExpanded = expandedBlockId === blk.id;

            if (expandedBlockId && !isExpanded) return null;

            return (
              <React.Fragment key={blk.id}>
                <div
                  className={`overflow-hidden border transition-all duration-200 ${
                    isExpanded
                      ? 'rounded-sm border-blue-500 bg-white shadow-sm dark:border-blue-500 dark:bg-gray-800'
                      : 'rounded-xl border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleBlock(blk.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-semibold transition-colors ${isExpanded ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}
                      >
                        {blk.identifier}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          blk.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {t(`Status_${blk.status}`)}
                      </span>
                    </div>
                    <svg
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}
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
                </div>

                {isExpanded && (
                  <div className="animate-in fade-in slide-in-from-top-2 mt-4 duration-300">
                    <FloorList blockId={blk.id} />
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {!expandedBlockId && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={newIdentifier}
              onChange={(e) => setNewIdentifier(e.target.value)}
              placeholder={t('PlaceholderBlockName')}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={isCreating || !newIdentifier.trim()}
              className="shrink-0 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              {t('AddBlock')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

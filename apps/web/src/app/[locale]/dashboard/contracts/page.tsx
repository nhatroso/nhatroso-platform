'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ContractStream } from '@/components/contracts/ContractStream';
import { ContractDetailPanel } from '@/components/contracts/ContractDetailPanel';
import { Contract } from '@nhatroso/shared';
import { getContracts } from '@/services/api/contracts';

export default function ContractsPage() {
  const t = useTranslations('Contracts');
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedContractId, setSelectedContractId] = React.useState<
    string | null
  >(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const fetchContracts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getContracts();
      setContracts(data);
    } catch (err) {
      console.error('Failed to fetch contracts', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const selectedContract = React.useMemo(
    () => contracts.find((c) => c.id === selectedContractId) || null,
    [contracts, selectedContractId],
  );

  const handleCreateNew = () => {
    setSelectedContractId(null);
    setIsCreating(true);
  };

  const handleSelectContract = (id: string) => {
    setIsCreating(false);
    setSelectedContractId(id);
  };

  const handleClosePanel = () => {
    setIsCreating(false);
    setSelectedContractId(null);
  };

  return (
    <div className="flex h-[calc(100vh-112px)] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Left: Contract list */}
      <div
        className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800/50 ${
          selectedContractId || isCreating
            ? 'hidden w-full md:flex md:w-[320px] lg:w-[360px]'
            : 'flex w-full md:w-[320px] lg:w-[360px]'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              {t('Heading')}
            </h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {contracts.length} {t('Heading').toLowerCase()}
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            aria-label={t('CreateContract')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : (
            <ContractStream
              contracts={contracts}
              selectedId={selectedContractId}
              onSelect={handleSelectContract}
            />
          )}
        </div>
      </div>

      {/* Right: Detail/Edit Panel */}
      <div
        className={`flex-1 overflow-hidden bg-gray-50/50 transition-all duration-300 dark:bg-gray-900/50 ${
          selectedContractId || isCreating
            ? 'flex'
            : 'hidden md:flex'
        }`}
      >
        {selectedContractId || isCreating ? (
          <ContractDetailPanel
            contract={selectedContract}
            isCreating={isCreating}
            onClose={handleClosePanel}
            onSuccess={() => {
              fetchContracts();
              if (isCreating) {
                setIsCreating(false);
              }
            }}
          />
        ) : (
          <div className="hidden h-full w-full items-center justify-center md:flex">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 dark:bg-gray-800">
                <svg className="h-12 w-12 text-blue-500/50 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">
                {t('SelectContractFirst')}
              </h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

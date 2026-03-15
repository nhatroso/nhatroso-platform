import * as React from 'react';
import { FloorList } from './FloorList';

interface SpaceManagerProps {
  buildingId: string;
}

export function SpaceManager({ buildingId }: SpaceManagerProps) {
  return (
    <div className="h-full w-full overflow-y-auto bg-gray-50/50 p-4 lg:p-6 dark:bg-gray-900/50">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <FloorList buildingId={buildingId} />
      </div>
    </div>
  );
}

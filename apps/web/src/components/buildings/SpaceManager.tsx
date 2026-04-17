import { FloorList } from './FloorList';

interface SpaceManagerProps {
  buildingId: string;
}

export function SpaceManager({ buildingId }: SpaceManagerProps) {
  return (
    <div className="h-full w-full overflow-y-auto bg-gray-surface p-4 lg:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <FloorList buildingId={buildingId} />
      </div>
    </div>
  );
}

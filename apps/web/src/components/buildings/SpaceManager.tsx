import * as React from 'react';
import { useTranslations } from 'next-intl';
import { BlockList } from './BlockList';
import { FloorList } from './FloorList';
import { RoomList } from './RoomList';

interface SpaceManagerProps {
  buildingId: string;
}

export function SpaceManager({ buildingId }: SpaceManagerProps) {
  const t = useTranslations('Buildings');
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(
    null,
  );
  const [selectedFloorId, setSelectedFloorId] = React.useState<string | null>(
    null,
  );

  return (
    <div className="flex h-full min-h-[500px] border border-zinc-200">
      {/* Column 1: Blocks */}
      <div className="flex flex-1 flex-col border-r border-zinc-200 bg-white">
        <BlockList
          buildingId={buildingId}
          selectedId={selectedBlockId}
          onSelect={(id) => {
            setSelectedBlockId(id);
            setSelectedFloorId(null);
          }}
        />
      </div>

      {/* Column 2: Floors */}
      <div className="flex flex-1 flex-col border-r border-zinc-200 bg-zinc-50">
        {selectedBlockId ? (
          <FloorList
            blockId={selectedBlockId}
            selectedId={selectedFloorId}
            onSelect={setSelectedFloorId}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm font-black uppercase tracking-widest text-zinc-300">
            {t('SelectBlockFirst') || 'SELECT A BLOCK'}
          </div>
        )}
      </div>

      {/* Column 3: Rooms */}
      <div className="flex flex-1 flex-col bg-zinc-50">
        {selectedFloorId ? (
          <RoomList floorId={selectedFloorId} />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm font-black uppercase tracking-widest text-zinc-300">
            {t('SelectFloorFirst') || 'SELECT A FLOOR'}
          </div>
        )}
      </div>
    </div>
  );
}

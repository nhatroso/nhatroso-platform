import { Building } from '@nhatroso/shared';

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
  if (buildings.length === 0) {
    return (
      <div className="p-6 text-sm italic text-zinc-500">
        No properties found.
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {buildings.map((b) => {
        const isSelected = b.id === selectedId;

        return (
          <li key={b.id} className="border-b border-zinc-200 last:border-0">
            <button
              onClick={() => onSelect(b.id)}
              className={`w-full p-6 text-left transition-colors duration-200 ${
                isSelected
                  ? 'bg-zinc-900 text-white'
                  : 'bg-transparent text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className={`text-lg font-bold uppercase tracking-tight ${
                      isSelected ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    {b.name}
                  </h3>
                  <p
                    className={`mt-1 text-xs uppercase tracking-widest ${
                      isSelected ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                  >
                    {b.address || 'No Address'}
                  </p>
                </div>
                <div
                  className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 ${
                    b.status === 'ACTIVE'
                      ? isSelected
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-200 text-zinc-800'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {b.status}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

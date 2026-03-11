import { BistroTable, TableStatus } from '@/types';
import { StatusBadge } from '@/components/ui/badge';

const allStatuses: TableStatus[] = ['ocupada', 'disponivel', 'liberando', 'reservada'];

export function TablesGrid({
  tables,
  onStatusChange,
  onMarkReleased,
}: {
  tables: BistroTable[];
  onStatusChange: (tableId: string, status: TableStatus) => void;
  onMarkReleased: (tableId: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {tables.map((table) => (
        <article key={table.id} className="rounded-lg border border-bistro-100 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{table.label}</h3>
              <p className="text-xs text-slate-500">Capacidade: {table.capacity}</p>
            </div>
            <StatusBadge status={table.status} />
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            {allStatuses.map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(table.id, status)}
                className="rounded-full border border-bistro-100 px-2 py-1 text-xs hover:bg-bistro-50"
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
          <button onClick={() => onMarkReleased(table.id)} className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700" type="button">
            {table.label} liberada
          </button>
        </article>
      ))}
    </div>
  );
}

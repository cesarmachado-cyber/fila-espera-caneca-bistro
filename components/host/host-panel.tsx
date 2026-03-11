import { BistroTable, WaitlistClient } from '@/types';

function getSuggestions(table: BistroTable, clients: WaitlistClient[]) {
  return clients.filter((client) => client.partySize <= table.capacity).slice(0, 3);
}

export function HostPanel({ tables, clients }: { tables: BistroTable[]; clients: WaitlistClient[] }) {
  const released = tables.filter((table) => table.status === 'disponivel');

  return (
    <div className="space-y-3">
      {released.length === 0 ? <p className="text-sm text-slate-500">Sem mesas liberadas no momento.</p> : null}
      {released.map((table) => (
        <article key={table.id} className="rounded-lg border border-bistro-100 p-3">
          <h3 className="font-semibold">{table.label} • {table.capacity} lugares</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {getSuggestions(table, clients).map((client) => (
              <li key={client.id} className="rounded bg-bistro-50 px-2 py-1">
                {client.name} ({client.partySize}) • {client.whatsapp}
              </li>
            ))}
            {getSuggestions(table, clients).length === 0 ? <li className="text-slate-500">Nenhum cliente compatível.</li> : null}
          </ul>
        </article>
      ))}
    </div>
  );
}

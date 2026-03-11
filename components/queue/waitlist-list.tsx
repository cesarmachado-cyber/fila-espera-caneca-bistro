import { WaitlistClient } from '@/types';

export function WaitlistList({ clients }: { clients: WaitlistClient[] }) {
  return (
    <ul className="space-y-2">
      {clients.map((client, index) => (
        <li key={client.id} className="rounded-lg border border-bistro-100 p-3">
          <div className="flex items-center justify-between">
            <strong>{index + 1}. {client.name}</strong>
            <span className="text-xs text-slate-500">{client.partySize} pessoas</span>
          </div>
          <p className="text-sm text-slate-600">{client.whatsapp}</p>
          {client.notes ? <p className="text-xs text-slate-500">Obs: {client.notes}</p> : null}
        </li>
      ))}
    </ul>
  );
}

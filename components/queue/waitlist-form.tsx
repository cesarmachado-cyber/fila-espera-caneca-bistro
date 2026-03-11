'use client';

import { FormEvent, useState } from 'react';

type Props = {
  onAddClient: (data: { name: string; whatsapp: string; partySize: number; notes?: string }) => void;
};

export function WaitlistForm({ onAddClient }: Props) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes] = useState('');

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAddClient({ name, whatsapp, partySize, notes });
    setName('');
    setWhatsapp('');
    setPartySize(2);
    setNotes('');
  };

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <input className="rounded-lg border border-bistro-100 px-3 py-2" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="rounded-lg border border-bistro-100 px-3 py-2" placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
      <input className="rounded-lg border border-bistro-100 px-3 py-2" placeholder="Quantidade de pessoas" min={1} type="number" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} required />
      <input className="rounded-lg border border-bistro-100 px-3 py-2" placeholder="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button className="rounded-lg bg-bistro-700 px-4 py-2 font-medium text-white hover:bg-bistro-900 md:col-span-2" type="submit">
        Adicionar cliente na fila
      </button>
    </form>
  );
}

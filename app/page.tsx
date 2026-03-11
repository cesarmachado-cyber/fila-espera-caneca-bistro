'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { WaitlistForm } from '@/components/queue/waitlist-form';
import { WaitlistList } from '@/components/queue/waitlist-list';
import { TablesGrid } from '@/components/tables/tables-grid';
import { HostPanel } from '@/components/host/host-panel';
import { initialQueue, initialTables } from '@/lib/mock-data';
import { broadcastUpdate, useRealtimeChannel } from '@/lib/realtime';
import { BistroTable, TableStatus, WaitlistClient } from '@/types';
import { hasSupabaseConfig } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<WaitlistClient[]>(initialQueue);
  const [tables, setTables] = useState<BistroTable[]>(initialTables);

  useEffect(() => {
    const attendant = localStorage.getItem('attendant');
    if (!attendant) {
      router.push('/login');
    }
  }, [router]);

  const refreshData = useCallback(() => {
    setClients((prev) => [...prev]);
    setTables((prev) => [...prev]);
  }, []);

  useRealtimeChannel('bistro-live', refreshData);

  const addClient = (data: { name: string; whatsapp: string; partySize: number; notes?: string }) => {
    setClients((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: data.name,
        whatsapp: data.whatsapp,
        partySize: data.partySize,
        notes: data.notes,
        createdAt: new Date().toISOString(),
      },
    ]);
    broadcastUpdate('bistro-live', 'client-added');
  };

  const updateStatus = (tableId: string, status: TableStatus) => {
    setTables((prev) => prev.map((table) => (table.id === tableId ? { ...table, status } : table)));
    broadcastUpdate('bistro-live', 'table-updated');
  };

  const markReleased = (tableId: string) => updateStatus(tableId, 'disponivel');

  const counts = useMemo(
    () => ({
      waiting: clients.length,
      released: tables.filter((table) => table.status === 'disponivel').length,
      integration: hasSupabaseConfig ? 'Conectada' : 'Pendente (configure .env.local)',
    }),
    [clients.length, tables],
  );

  return (
    <main className="min-h-screen p-4 md:p-6">
      <Header />
      <section className="mb-6 grid gap-3 md:grid-cols-3">
        <Card>
          <p className="text-xs text-slate-500">Clientes aguardando</p>
          <p className="text-2xl font-semibold">{counts.waiting}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Mesas liberadas</p>
          <p className="text-2xl font-semibold">{counts.released}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">WhatsApp/Supabase</p>
          <p className="text-sm font-semibold">{counts.integration}</p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Cadastro de clientes na fila</h2>
          <WaitlistForm onAddClient={addClient} />
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Fila em tempo real</h2>
          <WaitlistList clients={clients} />
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Módulo de mesas</h2>
          <TablesGrid tables={tables} onStatusChange={updateStatus} onMarkReleased={markReleased} />
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Painel da host</h2>
          <HostPanel tables={tables} clients={clients} />
        </Card>
      </section>
    </main>
  );
}

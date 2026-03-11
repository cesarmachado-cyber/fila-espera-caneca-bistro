import { BistroTable, WaitlistClient } from '@/types';

export const initialQueue: WaitlistClient[] = [
  {
    id: 'cl-1',
    name: 'Marina Gomes',
    whatsapp: '(11) 98888-1200',
    partySize: 2,
    notes: 'Prefere área externa',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'cl-2',
    name: 'Rafael Costa',
    whatsapp: '(11) 97777-4545',
    partySize: 4,
    notes: 'Aniversário',
    createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
  },
];

export const initialTables: BistroTable[] = [
  { id: 'tb-1', label: 'Mesa 1', capacity: 2, status: 'disponivel' },
  { id: 'tb-2', label: 'Mesa 2', capacity: 4, status: 'ocupada' },
  { id: 'tb-3', label: 'Mesa 3', capacity: 2, status: 'liberando' },
  { id: 'tb-4', label: 'Mesa 4', capacity: 6, status: 'reservada' },
  { id: 'tb-5', label: 'Mesa 5', capacity: 4, status: 'disponivel' },
];

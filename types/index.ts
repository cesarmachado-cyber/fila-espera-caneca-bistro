export type TableStatus = 'ocupada' | 'disponivel' | 'liberando' | 'reservada';

export type WaitlistClient = {
  id: string;
  name: string;
  whatsapp: string;
  partySize: number;
  notes?: string;
  createdAt: string;
};

export type BistroTable = {
  id: string;
  label: string;
  capacity: number;
  status: TableStatus;
};

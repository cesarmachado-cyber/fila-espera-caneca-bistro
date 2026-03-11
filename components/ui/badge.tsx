import { TableStatus } from '@/types';
import { cn } from '@/lib/utils';

const labels: Record<TableStatus, string> = {
  ocupada: 'Ocupada',
  disponivel: 'Disponível',
  liberando: 'Liberando',
  reservada: 'Reservada',
};

const classes: Record<TableStatus, string> = {
  ocupada: 'bg-red-100 text-red-700',
  disponivel: 'bg-emerald-100 text-emerald-700',
  liberando: 'bg-amber-100 text-amber-700',
  reservada: 'bg-sky-100 text-sky-700',
};

export function StatusBadge({ status }: { status: TableStatus }) {
  return <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', classes[status])}>{labels[status]}</span>;
}

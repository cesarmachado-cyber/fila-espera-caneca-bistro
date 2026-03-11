import { Coffee } from 'lucide-react';

export function Header() {
  return (
    <header className="mb-6 flex items-center justify-between rounded-xl border border-bistro-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-bistro-100 p-2 text-bistro-700">
          <Coffee className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-bistro-900">Caneca Bistrô • Fila de Espera</h1>
          <p className="text-xs text-slate-500">Operação em tempo real para atendimento e host</p>
        </div>
      </div>
    </header>
  );
}

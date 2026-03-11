'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [name, setName] = useState('');
  const router = useRouter();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    localStorage.setItem('attendant', name.trim());
    router.push('/');
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-20 w-full max-w-md space-y-4 rounded-xl border border-bistro-100 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-bistro-900">Login de atendente</h1>
        <p className="text-sm text-slate-500">Base pronta para autenticação Supabase Auth.</p>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Nome do atendente
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-bistro-100 px-3 py-2 outline-none ring-bistro-300 focus:ring"
          placeholder="Ex: Júlia"
          required
        />
      </label>
      <button className="w-full rounded-lg bg-bistro-700 px-4 py-2 font-medium text-white hover:bg-bistro-900" type="submit">
        Entrar no dashboard
      </button>
    </form>
  );
}

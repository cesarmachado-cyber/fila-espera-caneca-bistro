# Fila de Espera - Caneca Bistrô

Aplicação web para gestão da fila de espera e operação de mesas do Caneca Bistrô, agora com persistência real em Supabase (clientes, mesas e status operacionais).

## Funcionalidades desta etapa

- Integração com Supabase via API REST.
- Persistência de clientes da fila (`waitlist_customers`).
- Persistência de mesas (`tables`).
- Persistência de status dos clientes (aguardando/chamado/entrou/não compareceu/cancelado).
- Persistência de status das mesas (disponível/ocupada/liberando/reservada).
- Compatibilidade mantida com a interface atual (sem mudanças de fluxo para atendimento).

## Pré-requisitos

- Node.js 18.18+
- npm 9+
- Projeto e banco no Supabase

## Instalação

```bash
npm install
```

## Configuração do Supabase

Defina variáveis de ambiente antes de iniciar a aplicação:

```bash
export SUPABASE_URL="https://SEU-PROJETO.supabase.co"
export SUPABASE_ANON_KEY="SUA_CHAVE_ANON"
```

Também é possível definir `HOST` e `PORT`:

```bash
export HOST="0.0.0.0"
export PORT="5173"
```

> O servidor injeta essas variáveis no frontend através da rota `/app-config.js`.

### Estrutura SQL sugerida

Execute no SQL Editor do Supabase:

```sql
create table if not exists public.waitlist_customers (
  id uuid primary key,
  name text not null,
  whatsapp text not null,
  party_size integer not null check (party_size > 0),
  notes text,
  status text not null check (status in ('aguardando', 'chamado', 'entrou', 'nao_compareceu', 'cancelado')),
  assigned_table_id uuid,
  called_at timestamptz,
  tolerance_minutes integer,
  created_at timestamptz not null default now()
);

create table if not exists public.tables (
  id uuid primary key,
  label text not null,
  capacity integer not null check (capacity > 0),
  status text not null check (status in ('ocupada', 'disponivel', 'liberando', 'reservada')),
  current_customer_id uuid,
  created_at timestamptz not null default now()
);
```

### Políticas (RLS)

Para ambiente interno simples de operação, você pode liberar acesso anônimo de leitura/escrita:

```sql
alter table public.waitlist_customers enable row level security;
alter table public.tables enable row level security;

create policy "anon full access waitlist_customers"
on public.waitlist_customers
for all
using (true)
with check (true);

create policy "anon full access tables"
on public.tables
for all
using (true)
with check (true);
```

> Em produção, ajuste políticas para o nível de segurança desejado.

## Execução

```bash
npm run dev
```

Aplicação disponível em `http://localhost:5173`.

## Verificações rápidas

```bash
npm run check
npm run dev
# em outro terminal
curl -I http://127.0.0.1:5173/
curl http://127.0.0.1:5173/app-config.js
```

## Observação de fallback

Se `SUPABASE_URL` e `SUPABASE_ANON_KEY` não forem definidas, a aplicação continua funcionando em modo local temporário (dados em memória durante a sessão).

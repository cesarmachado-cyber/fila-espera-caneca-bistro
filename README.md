# Fila de Espera • Caneca Bistrô

Base inicial de um aplicativo web para gestão de fila de espera em café/bistrô.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (cliente e canal realtime prontos)

## Funcionalidades entregues
- Tela de login para atendente (`/login`)
- Dashboard principal (`/`)
- Cadastro de clientes na fila com:
  - Nome
  - WhatsApp
  - Quantidade de pessoas
  - Observações
- Lista de espera em tempo real (preparada com broadcast em canal Supabase)
- Módulo de mesas com status:
  - `ocupada`
  - `disponivel`
  - `liberando`
  - `reservada`
- Botão para qualquer atendente marcar **"Mesa X liberada"**
- Painel da host com mesas liberadas + sugestões de clientes compatíveis (por capacidade)
- Estrutura pronta para futura integração com WhatsApp (camada de integração sinalizada no dashboard)

## Instalação
```bash
npm install
```

## Configuração de ambiente
1. Copie `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```
2. Preencha as variáveis do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

> Sem essas variáveis, o app funciona com dados mock locais para facilitar desenvolvimento inicial.

## Rodando em desenvolvimento
```bash
npm run dev
```
Abra `http://localhost:3000`.

## Scripts úteis
- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run start` — execução de produção
- `npm run lint` — lint
- `npm run typecheck` — checagem TypeScript

## Estrutura do projeto
```text
app/
  login/page.tsx
  page.tsx
components/
  auth/
  host/
  layout/
  queue/
  tables/
  ui/
lib/
  mock-data.ts
  realtime.ts
  supabase.ts
  utils.ts
types/
  index.ts
```

## Próximos passos sugeridos
1. Integrar Supabase Auth de fato no login.
2. Persistir fila e mesas em tabelas Supabase (Postgres).
3. Implementar políticas RLS e papéis (atendente, host).
4. Integrar envio de mensagens WhatsApp (ex.: provedores como Twilio/Z-API/Meta API).

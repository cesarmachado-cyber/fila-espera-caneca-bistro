# Fila de Espera - Caneca Bistrô

Este repositório foi ajustado para evitar falhas de instalação (`npm install`) em ambientes com restrições de proxy/registro e permitir subir a aplicação com `npm run dev` sem depender de pacotes externos.

## O que foi corrigido

- `package.json` simplificado para remover dependências externas que causavam bloqueio `403 Forbidden` no registro npm.
- `.npmrc` padronizado para usar o registro oficial e reduzir ruído de auditoria/funding em CI.
- `package-lock.json` regenerado para refletir a configuração atual e garantir instalação determinística.
- Servidor de desenvolvimento local criado em `scripts/dev-server.mjs` usando apenas módulos nativos do Node.

## Pré-requisitos

- Node.js 18.18+ (recomendado Node 20+)
- npm 9+

## Instalação local

```bash
npm install
```

## Execução em desenvolvimento

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173`.

## Testes rápidos locais

1. Verifique sintaxe do servidor:

```bash
npm run check
```

2. Suba o servidor e valide resposta HTTP:

```bash
npm run dev
# em outro terminal
curl -I http://127.0.0.1:5173/
```

Esperado: status `HTTP/1.1 200 OK`.

## Preparo para deploy

Como o projeto agora é um app estático servido por Node nativo:

1. Defina variáveis de ambiente no host/plataforma:
   - `HOST=0.0.0.0`
   - `PORT` conforme porta fornecida pelo provedor (ex.: Render, Railway, Fly.io, VPS).
2. Comando de instalação:

```bash
npm ci
```

3. Comando de inicialização:

```bash
npm start
```

4. Configure health check para `GET /` e espere `200`.

## Observações sobre ambientes com proxy

Se o ambiente injeta automaticamente `HTTP_PROXY`/`HTTPS_PROXY` e você ainda vir erro 403 ao baixar pacotes, isso indica bloqueio de egress no proxy corporativo. Neste cenário, use um registro interno permitido (Nexus/Artifactory/Verdaccio) ou peça liberação de saída para `registry.npmjs.org`.

# PORTAL_INSTITUTO_CAAPORA

## Aplicação web

O frontend usa Next.js 16.3.8 com App Router e TypeScript. Para instalar as dependências e iniciar em desenvolvimento:

```powershell
cd frontend
npm install
npm run dev
```

Acesse <http://localhost:3000>.

## Docker Compose

Na raiz do repositório, construa e inicie o frontend em produção:

```powershell
docker compose up --build
```

O portal ficará disponível em <http://localhost:3000>. Para encerrar, use `docker compose down`.

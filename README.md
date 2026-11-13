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

O compose sobe o projeto inteiro: banco (PostgreSQL 17), backend (Spring Boot, Java 17) e frontend (Next.js).

Na raiz do repositório:

```powershell
cp .env.example .env   # opcional: ajuste senhas e a JWT_KEY
docker compose up --build
```

| Serviço | Endereço na sua máquina |
|---|---|
| Frontend | <http://localhost:3000> |
| API | <http://localhost:8080> |
| Swagger da API | <http://localhost:8080/swagger-ui/index.html> |
| PostgreSQL | `localhost:5433` (usuário/senha do `.env`) |

- Os dados do banco ficam no volume `db-data` e as fotos/vídeos enviados no volume `uploads`.
  No compose a API usa `DDL_AUTO=update`, então os dados sobrevivem a reinícios.
- Para encerrar: `docker compose down`. Para apagar também os dados: `docker compose down -v`.
- Todas as variáveis estão documentadas em [`.env.example`](.env.example).

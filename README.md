# AquaPay — Aldea Sibaná

Plataforma web para administrar el servicio de agua potable de **Aldea Sibaná, El Asintal, Retalhuleu**.

## Estructura

```
frontend/   → Next.js 15 + TypeScript + Tailwind + shadcn/ui
backend/    → Node.js + Express + TypeORM + class-validator
```

## Reglas de negocio implementadas

- Tarifa **anual fija por chorro**, editable en Configuración (admin).
- Se pueden cobrar **años atrasados** en un solo recibo.
- **Compra de chorro** es un cobro aparte.
- DPI mínimo **13 dígitos**.
- Numeración de recibos: `001`, `002`… reinicia cada año.
- Lugar de pago: Aldea Sibaná, El Asintal, Retalhuleu.
- Firma manuscrita en el PDF (espacio en blanco).
- Firma digital P12 preparada (`PDF_SIGN_P12_PATH`).

## 1. Neon (PostgreSQL)

1. Cree un proyecto en [Neon](https://neon.tech) y copie la **Connection string** (pooler).
2. Ejecute el schema en el SQL Editor de Neon (o con `psql`):

```bash
psql "$DATABASE_URL" -f backend/src/database/schema.sql
```

3. Coloque la URI en `backend/.env` como `DATABASE_URL` (use `sslmode=require`; el pooler suele ir bien con Node/`pg`).

## 2. Backend (Render / local)

```bash
cd backend
cp .env.example .env   # complete DATABASE_URL y JWT_SECRET
npm install
npm run dev
```

Variables clave:

- `DATABASE_URL` — Neon
- `JWT_SECRET` — secreto HS256 para sesiones
- `JWT_EXPIRES_IN` — opcional (`8h` por defecto)
- `STORAGE_DIR` — carpeta local de PDFs (`uploads/recibos`)
- `PUBLIC_API_URL` — URL pública del API (enlaces de descarga de PDF)
- `FRONTEND_URL`

Auth: registro/login locales (DPI + contraseña con bcrypt) y JWT.
Storage: PDFs en disco; descarga en `GET /api/facturacion/recibos/:id/pdf`.

## 3. Frontend (Vercel / local)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Variables:

- `NEXT_PUBLIC_API_URL`

## 4. Primer uso

1. Ir a `/registro` y crear el primer Administrador (bootstrap) o Tesorero.
2. Iniciar sesión con DPI + contraseña.
3. Registrar usuarios de comunidad → viviendas → chorros.
4. En **Facturación**, cobrar tarifa anual o compra de chorro.

## Despliegue

| Pieza | Servicio |
|--------|----------|
| Frontend | Vercel (root: `frontend`) |
| Backend | Render (root: `backend`, start: `npm start`, build: `npm run build`) |
| DB | Neon |
| Auth / Storage | Backend (JWT + disco local o volumen persistente) |

## Seguridad

- No suba `.env` ni `.env.local` al repositorio.
- Si las claves de Neon se expusieron, **rótelas** en el panel de Neon.

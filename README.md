# Pujazo

Asistente independiente para jugadores de fantasy fútbol en España.

> Introduce tu equipo, tu saldo, tu mercado y las reglas de tu liga. Pujazo te devuelve un plan claro de fichajes, ventas, pujas y alineación.

Pujazo **no** se conecta a Biwenger, Comunio, LALIGA FANTASY ni otras plataformas. Tú introduces los datos; un motor local determinista (sin IA externa) propone un plan de acción.

## Funcionalidades (MVP)

- Home con propuesta de valor y aviso de independencia
- Asistente multi-paso: plataforma, liga, plantilla, presupuesto/mercado, reglas y tipo de análisis
- Carga de **liga de ejemplo** con reglas reales de referencia
- Carga de **datos de ejemplo** ficticios (plantilla 18, mercado, necesidad de vender)
- **Importar pegando** plantilla y mercado desde tu fantasy (sin login ni scraping)
- Guía móvil/PC para copiar desde Biwenger, Comunio o LALIGA FANTASY + botón de portapapeles
- Presets de reglas por plataforma
- Motor local de recomendaciones (`src/lib/analysis`)
- Once, formación, capitán y ariete
- Persistencia temporal en `localStorage` (borrador, último análisis, reglas, **historial**)
- Copiar, descargar, **PDF/imprimir** y compartir el resultado
- Validaciones en español con Zod + React Hook Form
- Pruebas unitarias con Vitest
- Pruebas e2e con Playwright (desktop + móvil)
- Contraste y accesibilidad básica (skip link, focus, reduced motion)

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Vitest
- Playwright
- ESLint
- pnpm

## Requisitos

- Node.js `^20.19.0` o `>=22.13.0` (recomendado 22 LTS)
- pnpm 9+ (recomendado: la versión del `packageManager` del proyecto)

## Instalación

```bash
pnpm install
```

## Ejecución local

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Pruebas

Unitarias:

```bash
pnpm test
```

Modo watch:

```bash
pnpm test:watch
```

End-to-end (Playwright):

```bash
pnpm test:e2e
```

## QA completo

Ejecuta lint, typecheck, unitarias, e2e y build:

```bash
pnpm qa
```

Auditoría React (React Doctor; requiere Node 22 o ≥20.19):

```bash
pnpm doctor
```

QA + React Doctor:

```bash
pnpm qa:full
```

## Lint y typecheck

```bash
pnpm lint
pnpm typecheck
```

## Build

```bash
pnpm build
pnpm start
```

## Estructura del proyecto

```text
src/
  app/                  # Rutas App Router (home, analizar, resultado, historial)
  components/           # UI del asistente y cromado del sitio
  lib/
    analysis/           # Motor determinista (scoring, alineación, motor)
    constants.ts        # Catálogos y reglas de ejemplo
    demo.ts             # Datos ficticios de demostración
    schemas.ts          # Validaciones Zod
    storage.ts          # localStorage (borrador, último plan, historial)
    export.ts           # Copiar / descargar / compartir
```

## Limitaciones del MVP / V2

- Sin API de inteligencia artificial
- Sin login, pagos, base de datos ni scraping
- Sin conexión automática a cuentas de fantasy (sí: **pegar texto** de plantilla/mercado)
- Sin automatización de fichajes, pujas, ventas o alineaciones
- Sin estadísticas, lesiones o noticias en tiempo real
- Las recomendaciones se basan solo en los datos introducidos o pegados por el usuario

## Qué incluye la V2 (actual)

- Importar plantilla y mercado pegando desde Biwenger, Comunio o LALIGA FANTASY (móvil y PC, con guía)
- Detección de saldo/dinero al pegar
- Presets de reglas por plataforma (Biwenger / Comunio / LALIGA FANTASY / genérico)
- Resultado demo-ready (copiar / descargar / compartir)
- React Doctor + QA (`pnpm qa` / `pnpm qa:full`)
- E2e Playwright en desktop, tablet y móvil

## En curso · V3

- Comparativa avanzada de candidatos (ranking en resultado) ✅
- Historial local de planes (hasta 15 en el dispositivo) ✅
- Guardar PDF / imprimir el plan ✅
- Conectores opcionales (extensión del navegador con consentimiento explícito)
- Posible capa de IA opcional y transparente (nunca opaca)

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. Importa el proyecto en [Vercel](https://vercel.com).
3. Framework preset: Next.js. Build: `pnpm build`. Install: `pnpm install`.
4. No se requieren variables de entorno para el MVP.
5. Despliega.

## Despliegue en Railway

1. Crea un proyecto en [Railway](https://railway.app) desde el repo.
2. Build command: `pnpm build`
3. Start command: `pnpm start`
4. Puerto: Railway inyecta `PORT`; Next lo respeta con `next start`.
5. Sin base de datos ni secretos obligatorios en esta fase.

También puedes usar un `Dockerfile` sencillo basado en Node 20 si prefieres contenedor.

## Variables de entorno

Copia `.env.example` a `.env.local` si quieres añadir flags futuros. El MVP funciona sin secretos.

## Aviso de independencia

Pujazo es una herramienta independiente y no está afiliada ni respaldada por Biwenger, Comunio, LALIGA FANTASY ni otras plataformas mencionadas.

## Licencia

MIT

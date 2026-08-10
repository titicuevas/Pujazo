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

## Qué incluye la V2

- Importar plantilla y mercado pegando desde Biwenger, Comunio o LALIGA FANTASY (móvil y PC, con guía)
- Detección de saldo/dinero al pegar
- Presets de reglas por plataforma (Biwenger / Comunio / LALIGA FANTASY / genérico)
- Datos de ejemplo adaptados a la plataforma elegida
- Resultado demo-ready (copiar / descargar / compartir / PDF)
- React Doctor + QA (`pnpm qa` / `pnpm qa:full`)
- E2e Playwright en desktop, tablet y móvil

## V3 (cerrada en local)

- Comparativa avanzada de candidatos (ranking en resultado)
- Historial local de planes (hasta 15 en el dispositivo)
- Guardar PDF / imprimir el plan
- Pegado mejorado Comunio / LALIGA FANTASY + tips si falla la importación
- Storage local validado (descarta datos corruptos, avisa si no hay espacio)
- Páginas de error / 404, SEO básico (OG, robots, sitemap) y CI en GitHub
- Guías públicas: Cómo usar, Privacidad y modelo gratis/futuro (freemium transparente)

## V3.1 (UX import + resultado)

- Auto-import tras OCR o pegado con varios jugadores detectados
- Guía de importación según plataforma (no solo Biwenger)
- Resultado móvil: botones a ancho completo, anclas Fichaje/Ventas/Once, top fichajes sin duplicar el nº 1
- Extensión Chrome (`extension/`): copia texto de Biwenger web y abre Pujazo (`?pegar=1&clip=1`)
- PWA instalable (manifest + service worker + aviso “Instalar” en móvil)
- Web Share Target: Compartir desde Biwenger → Pujazo importa el texto en local (plantilla o mercado)
- Historial: comparar dos planes (fichaje / puja / saldo) en el dispositivo
- Copia de seguridad local: exportar/importar JSON (borrador, reglas, historial) entre dispositivos
- Historial → “Editar en asistente”: reabre plantilla/mercado/reglas de un plan guardado
- Checklist “Acciones de la jornada” en el resultado (vender / pujar / alinear)
- Acciones también en copiar/descargar plan; progreso visible en historial
- “Siguiente jornada”: reusa plantilla/reglas, vacía mercado y abre el asistente
- Página offline de la PWA (`/offline.html`) si no hay red
- Iconos PWA/extensión con la marca (P + flecha) y variante maskable
- E2e de checklist, siguiente jornada, editar desde historial y backup JSON
- Atajos PWA (Analizar / Resultado / Historial) al mantener pulsado el icono
- CI con Playwright e2e en push/PR a develop y main
- Avisos accionables arriba si faltan mercado/plantilla/portero; no navega si falla el guardado
- Pujas sensibles al estado (lesionado/duda) y alineación que evita bajas si hay recambio
- Importación: detecta “lesionado/duda/sanción” en texto y avisa si Biwenger no trae el icono
- Bloqueo si el mercado no tiene precios; techo “buena compra” y ventas dimensionadas al hueco de saldo

## Futuro (opcional)

- Sync multi-dispositivo con cuenta (plan de pago)
- Publicar la extensión en Chrome Web Store
- Capa de IA opcional y transparente (nunca opaca; sin filtrar datos sin aviso)
- Pagos (p. ej. Stripe) solo para extras; el núcleo local sigue gratis

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

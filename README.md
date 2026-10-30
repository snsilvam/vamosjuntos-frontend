# vamosjuntos-frontend

SPA de Vamos Juntos .club: React + TypeScript + Tailwind CSS v4, empaquetada con Vite y servida
por Firebase Hosting.

La especificación, el plan y los contratos viven en el repo
[vamosjuntos.club](https://github.com/snsilvam/vamosjuntos.club), en `specs/`.

## Autenticación

Los familiares inician sesión con Firebase Authentication: Google (ventana emergente) o correo y
contraseña, como en kaizen-app.

- **SDK**: `src/auth/firebase.ts` es el único archivo que lo importa.
- **Token**: cada llamada a `/api` lleva `Authorization: Bearer <ID token>`
  (`src/api/client.ts`). Ante un `401` se reintenta una vez con un token nuevo.
- **Rutas**: la app decide qué mostrar según `GET /api/me` (`src/session/MeProvider.tsx`): sin
  sesión, sin vincular, pendiente, "no asistirá" o confirmado.

La configuración web de Firebase es pública:
- en local va en `.env.local` (copia `.env.example`);
- en el pipeline llega como **variables** de repositorio de GitHub: `VITE_FIREBASE_API_KEY`,
  `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` y `VITE_FIREBASE_APP_ID`.

## Desarrollo local

Requiere Node 24, `.env.local` con la configuración de Firebase y el backend corriendo en `:8080`;
el proxy de Vite manda `/api` hacia allá.

```bash
npm install
npm run dev
```

## Validaciones

```bash
npm run build   # tsc -b && vite build
npm run lint    # oxlint
```

## Despliegue

Flujo de ramas: rama de feature → `main` (integración) → `production` (despliegue). Un push a
`production` ejecuta [`.github/workflows/front-deploy.yml`](.github/workflows/front-deploy.yml),
que hace esto en orden:

1. Valida que existan las variables `VITE_FIREBASE_*`; sin ellas no publica.
2. `npm ci` y `npm run build`. Si el build o el chequeo de tipos fallan, no despliega.
3. Se autentica en GCP con Workload Identity Federation. No hay llaves JSON ni secrets.
4. Publica `dist/` en Firebase Hosting (sitio `vamosjuntos-club`) con
   `firebase-tools deploy --only hosting`. El commit queda como mensaje de la versión.

Un push a `main` o a cualquier otra rama no publica nada.

[`firebase.json`](firebase.json) define tres reglas:
- `/api/**` se reescribe hacia el servicio de Cloud Run `vamosjuntos-backend` (`us-central1`). Así
  el sitio y la API comparten dominio, sin CORS, y la cookie `__session` llega al backend.
- Cualquier otra ruta sirve `index.html`, la SPA.
- El HTML se revalida siempre (`Cache-Control: no-cache`) para que una versión nueva aparezca al
  recargar.

- **Publicar**: `git push origin main:production`, siempre después del backend si el cambio
  depende de él.
- **Relanzar sin commits**: *Actions → Deploy to Firebase Hosting → Run workflow*, sobre
  `production`.
- **Revertir**: haz `git revert <commit>` en `main` y luego `git push origin main:production`.

La configuración inicial (Firebase, permisos y dominio) está en
`specs/002-despliegue-continuo/quickstart.md` del repo vamosjuntos.club.

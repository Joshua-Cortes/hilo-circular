# Despliegue

Hilo Circular queda en internet con **dos servicios gratuitos**, los dos con inicio de sesión de GitHub:

| Servicio | Para qué | Plan |
|---|---|---|
| [Neon](https://neon.tech) | Base de datos PostgreSQL | Free |
| [Render](https://render.com) | Compila y publica la app (API + web en una sola URL) | Free |

La configuración de Render está en [`render.yaml`](../render.yaml). Render publica la rama **`main`** y vuelve a publicar solo cada vez que cambia.

```mermaid
flowchart LR
  U(["Persona"]) -- "https://hilo-circular-cn33.onrender.com" --> R["Render<br/>API + web compilada"]
  R -- "DATABASE_URL" --> N[("Neon<br/>PostgreSQL")]
  R -. "teselas del mapa" .-> O["OpenStreetMap"]
```

## Paso 1 · Base de datos en Neon (5 min)

1. Entrar a https://neon.tech → **Sign up** → **Continue with GitHub**.
2. Crear el proyecto:
   - Nombre: `hilo-circular`
   - Postgres: la versión que venga por defecto
   - Región: **AWS US East (N. Virginia)**, la misma de Render
3. En el panel del proyecto, botón **Connect**. Copiar la **connection string**, que se ve así:

   ```text
   postgresql://usuario:clave@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

4. Guardarla en un lugar privado (por ejemplo, el gestor de contraseñas). **No subirla al repositorio ni pegarla en issues o chats**: con ella se puede leer y borrar toda la base.

No hay que crear tablas: la API aplica las migraciones sola al arrancar.

## Paso 2 · Dejar `main` al día

Render publica `main`, y hoy `main` está atrasada. Abrir una PR de `develop` a `main` y mergearla:

```bash
gh pr create --base main --head develop --title "Entrega final: develop a main"
```

## Paso 3 · Servicio en Render (10 min, más ~5 min del primer build)

1. Entrar a https://render.com → **Get Started** → **GitHub**.
2. Autorizar a Render a ver el repositorio `Joshua-Cortes/hilo-circular`. Basta con ese repo, no hace falta "All repositories".
3. **New +** → **Blueprint** → elegir `hilo-circular`. Render lee `render.yaml` y muestra el servicio `hilo-circular`.
4. Pide un solo valor, **`DATABASE_URL`**: pegar la connection string de Neon.
5. **Apply**. El primer build tarda unos 5 minutos. Sale bien cuando el log muestra:

   ```text
   Datos demo agregados
   API de Hilo Circular en http://localhost:10000/api · base de datos: PostgreSQL
   ```

6. La URL pública aparece arriba, bajo el nombre del servicio. La nuestra es **https://hilo-circular-cn33.onrender.com**. Render agregó `-cn33` porque `hilo-circular.onrender.com` ya era de otra persona: no usar esa dirección.

`JWT_SECRET` lo genera Render solo y `CARGAR_DEMO=true` carga los datos de demostración.

## Paso 4 · Verificar

- `https://<tu-url>/api/salud` responde `{"estado":"ok",…}`.
- En la página: el mapa de **Donar** muestra el mapa y los 10 puntos, y **Mercado** muestra las fotos.
- Entrar con `demo@hilocircular.cl` / `hilo2026` y con `fundacion@hilocircular.cl` / `hilo2026`.

## Antes de la presentación

- **El plan gratuito de Render "se duerme"** tras 15 minutos sin visitas, y la primera carga demora cerca de 1 minuto. Abrir la URL 2 o 3 minutos antes de presentar.
- **Las cuentas demo tienen una clave pública** (está en el README). Sirven para la demo, pero cualquiera puede entrar con ellas. Después de la evaluación, quitar `CARGAR_DEMO` en Render o cambiar esas claves.

## Si algo falla

| Síntoma en el log de Render | Causa | Solución |
|---|---|---|
| `JWT_SECRET es obligatorio en producción` | Se borró la variable | En **Environment**, volver a agregar `JWT_SECRET` con **Generate** |
| `password authentication failed` o `ENOTFOUND` | `DATABASE_URL` mal copiada | Copiarla de nuevo desde **Connect** en Neon, completa y con `?sslmode=require` |
| `tsc: not found` o `vite: not found` | El build no instaló las dependencias de desarrollo | El comando de build debe ser `npm ci --include=dev && npm run build` |
| La página carga, pero el mapa sale gris | El navegador bloquea las teselas | Revisar que la respuesta tenga `img-src … https://tile.openstreetmap.org` |

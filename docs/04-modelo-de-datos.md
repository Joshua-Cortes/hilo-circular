# Modelo de datos

La fuente de verdad es [`apps/api/src/db/schema.ts`](../apps/api/src/db/schema.ts). Las migraciones SQL generadas desde ese esquema están en [`apps/api/drizzle/`](../apps/api/drizzle/).

```mermaid
erDiagram
  usuarios ||--o| oficios : "tiene perfil"
  usuarios ||--o| fundaciones : "administra"
  usuarios ||--o{ donaciones : "dona"
  usuarios ||--o{ contactos : "inicia"
  oficios ||--o{ servicios : "ofrece"
  oficios ||--o{ contactos : "recibe"
  fundaciones ||--o{ donaciones : "recibe"
  usuarios ||--o{ publicaciones : "vende"
  publicaciones ||--o{ fotos_publicacion : "tiene"
  publicaciones ||--o{ conversaciones : "genera"
  usuarios ||--o{ conversaciones : "compra"
  conversaciones ||--o{ mensajes : "contiene"
  usuarios ||--o{ restablecimientos_clave : "solicita"
  usuarios ||--o| repartidores : "ofrece reparto"
  usuarios ||--o{ contactos_reparto : "contacta"
  repartidores ||--o{ contactos_reparto : "recibe"

  usuarios {
    uuid id PK
    text email UK
    text password_hash
    text nombre
    rol rol "persona | oficio | fundacion | admin"
  }
  restablecimientos_clave {
    uuid id PK
    uuid usuario_id FK
    text token_hash UK
    timestamptz expira_en
  }
  oficios {
    uuid id PK
    uuid usuario_id FK,UK
    text nombre_publico
    text descripcion
    text comuna
    text direccion "opcional"
    float8 lat
    float8 lng
    precision_ubicacion precision_ubicacion "exacta | aproximada"
    text whatsapp
    text telefono
    bool verificado
    bool activo
  }
  servicios {
    uuid id PK
    uuid oficio_id FK
    categoria_servicio categoria
    text titulo
    text descripcion
    tipo_prenda[] prendas "índice GIN"
    int precio_desde "CLP, null = a convenir"
  }
  fundaciones {
    uuid id PK
    uuid usuario_id FK
    text nombre
    text comuna
    text direccion
    float8 lat
    float8 lng
    jsonb horarios "[{dia, abre, cierra}]"
    tipo_prenda[] prendas_aceptadas "vacío = todas"
    text necesidades_actuales
    bool acepta_danada
    bool verificado
    bool activo
  }
  repartidores {
    uuid id PK
    uuid usuario_id UK
    text nombre_publico
    text[] comunas
    text whatsapp
    text telefono
    bool verificado
    bool activo
  }
  contactos_reparto {
    uuid id PK
    uuid repartidor_id FK
    uuid usuario_id FK
    text comuna
    canal_contacto canal
  }
  donaciones {
    uuid id PK
    uuid fundacion_id FK
    uuid donante_id FK
    jsonb items "[{prenda, cantidad, estado}]"
    int total_prendas
    real kg_estimados
    estado_donacion estado "registrada | recibida | cancelada"
    timestamptz recibida_en
  }
  contactos {
    uuid id PK
    uuid oficio_id FK
    uuid usuario_id FK "null si es anónimo"
    canal_contacto canal "whatsapp | telefono"
    timestamptz creado_en
  }
  publicaciones {
    uuid id PK
    uuid vendedor_id FK
    text titulo
    tipo_prenda prenda
    text talla "M, 38, 10 años"
    condicion_prenda condicion "nueva_con_etiqueta | como_nueva | buen_estado | con_detalles"
    int precio "0 = se regala"
    text comuna
    text whatsapp "null = solo chat"
    estado_publicacion estado "disponible | reservada | vendida"
  }
  fotos_publicacion {
    uuid id PK
    uuid publicacion_id FK
    int orden "0 = portada"
    text mime
    text datos "base64"
  }
  conversaciones {
    uuid id PK
    uuid publicacion_id FK
    uuid comprador_id FK
    uuid vendedor_id FK
    timestamptz ultimo_mensaje_en
  }
  mensajes {
    uuid id PK
    uuid conversacion_id FK
    uuid autor_id FK
    text texto
    timestamptz leido_en "null = sin leer"
  }
```

Todas las tablas, salvo `contactos`, `fotos_publicacion`, `conversaciones` y `mensajes`, tienen `creado_en` y `actualizado_en`.

## Decisiones de modelado

- **Vocabulario controlado.** Las categorías de oficio, los tipos de prenda y los estados son *enums* de PostgreSQL. Se definen una sola vez en [`apps/api/src/lib/catalogo.ts`](../apps/api/src/lib/catalogo.ts), junto con sus etiquetas en español y el peso promedio de cada prenda. El frontend obtiene ese catálogo desde `GET /api/catalogo`, así que no duplica listas.
- **Oficio y servicios por separado.** Un mismo taller puede ofrecer costura *y* marroquinería, con precios distintos. La búsqueda filtra por servicio (categoría y prenda) y devuelve el oficio.
- **`prendas_aceptadas` vacío significa "acepta todo".** Así una fundación general no tiene que marcar las 10 opciones.
- **Las donaciones guardan los ítems como JSONB.** Una donación es un registro inmutable de lo que se entregó y no se consulta ítem por ítem, así que una tabla adicional no aportaba.
- **`kg_estimados` se calcula al registrar la donación.** Si se recalibran los pesos promedio, las donaciones históricas conservan el valor con que se registraron.
- **`contactos` es la evidencia de "reparaciones iniciadas".** La reparación ocurre fuera de la plataforma, así que el clic en "Contactar" es el indicador observable más honesto.
- **Las fotos del mercado van en su propia tabla, en base64.** Así los listados no las arrastran y el despliegue no necesita un servicio de archivos aparte. Cada foto llega reducida a ~1200 px desde el navegador (máx. 700 KB). Si el mercado crece, se mueven a un bucket sin cambiar la API (`/mercado/fotos/:id`).
- **Una conversación por comprador y prenda** (índice único `publicacion_id + comprador_id`). Guardar también `vendedor_id` evita un *join* para armar la bandeja de entrada.
- **"Sin leer" es `leido_en IS NULL`.** No hace falta una tabla de estados por participante, porque cada conversación tiene exactamente dos personas.
- **Coordenadas como `float8`.** No se usa PostGIS, para que el mismo esquema funcione en PGlite (ver decisión D4 en [02-arquitectura.md](02-arquitectura.md)).
- **Delivery por comuna.** `repartidores.comunas` usa `text[]` con índice GIN para filtrar por cobertura local sin inventar repartidores ficticios; `contactos_reparto` registra cada contacto iniciado por comuna.
- **Recuperación de contraseña con hash.** `restablecimientos_clave` guarda el hash del token (`token_hash`), con expiración a los 30 minutos y consumo de un solo uso al restablecer la clave.

## Cambios al modelo

1. Editar `apps/api/src/db/schema.ts`.
2. Generar la migración con `npm run db:generate -w @hilo/api -- --name descripcion_del_cambio`.
3. Revisar el archivo `.sql` generado y subirlo junto con el cambio de esquema en el mismo PR.

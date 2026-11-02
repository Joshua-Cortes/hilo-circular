# API REST

Base: `http://localhost:3000/api` en desarrollo. Todas las respuestas son JSON.

- **Respuesta exitosa:** `{ "datos": … }`
- **Error:** `{ "error": { "codigo": "…", "mensaje": "…", "detalles": … } }`. El `mensaje` está escrito para mostrarse directamente a la persona usuaria.
- **Autenticación:** encabezado `Authorization: Bearer <token>`. Los endpoints de registro e inicio de sesión los implementa el issue de autenticación (Hector) y usan `firmarToken` de `apps/api/src/middleware/auth.ts`.

## Endpoints públicos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/salud` | Chequeo de estado |
| GET | `/catalogo` | Categorías de oficio, tipos de prenda (con peso promedio), estados y comunas, con etiquetas en español |
| GET | `/orientacion?prenda&estado` | Asistente "¿Qué hago con esta prenda?". Devuelve `accion` (`donar`, `reparar` o `reciclar`), un texto explicativo y los `filtros` listos para la siguiente búsqueda |
| GET | `/oficios` | Búsqueda de oficios (ver parámetros abajo) |
| GET | `/oficios/:id` | Perfil público con sus servicios |
| POST | `/oficios/:id/contacto` | `{ canal: "whatsapp" \| "telefono" }`. Registra el contacto y devuelve `{ url }` (`https://wa.me/…` o `tel:…`). La sesión es opcional |
| GET | `/fundaciones` | Puntos de donación (ver parámetros abajo) |
| GET | `/fundaciones/:id` | Detalle de una fundación |
| GET | `/impacto` | Indicadores de impacto |

### Parámetros de `GET /oficios`

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `lat`, `lng` | número | — | Si se envían (los dos juntos), se ordena por distancia y se informa `distanciaKm` |
| `radioKm` | número ≤ 100 | 15 | Solo aplica con coordenadas |
| `categoria` | `costura` \| `zapateria` \| `marroquineria` \| `tejido` \| `tapiceria` | — | Oficio que ofrece al menos un servicio de esa categoría |
| `prenda` | tipo de prenda | — | Oficio con algún servicio que trabaje esa prenda |
| `q` | texto de 2 a 60 caracteres | — | Busca en el nombre, la descripción y los títulos de los servicios |
| `limite` | 1–50 | 20 | — |

### Parámetros de `GET /fundaciones`

`lat`, `lng`, `radioKm` (por defecto 25) y `limite` (por defecto 50) funcionan igual que en `/oficios`. Además:

| Parámetro | Descripción |
|---|---|
| `prenda` | Incluye las fundaciones que aceptan esa prenda o que aceptan cualquier prenda |
| `aceptaDanada=true\|false` | Puntos que reciben, o no, textiles dañados para reciclaje |
| `abiertoAhora=true\|false` | Según los horarios, evaluados en la hora de Chile continental |

### Ejemplo

```http
GET /api/oficios?lat=-29.9027&lng=-71.252&categoria=costura
```

```json
{
  "datos": [
    {
      "id": "8c0e…",
      "nombrePublico": "Costuras Rosita",
      "comuna": "La Serena",
      "direccion": null,
      "ubicacion": { "lat": -29.88, "lng": -71.23, "precision": "aproximada" },
      "distanciaKm": 3.4,
      "canales": { "whatsapp": true, "telefono": false },
      "verificado": true,
      "servicios": [
        { "categoria": "costura", "titulo": "Bastas y ajustes", "prendas": ["pantalon", "falda_vestido", "uniforme_escolar"], "precioDesde": 3000 }
      ]
    }
  ]
}
```

## Endpoints con sesión

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/oficios/yo` | oficio | Perfil propio completo (sin difuminar) |
| POST | `/oficios` | oficio | Crea el perfil propio (uno por usuario). Exige al menos un WhatsApp o teléfono chileno |
| PATCH | `/oficios/yo` | oficio | Edición parcial |
| POST | `/oficios/yo/servicios` | oficio | Agrega un servicio |
| DELETE | `/oficios/yo/servicios/:servicioId` | oficio | Elimina un servicio propio |
| GET | `/fundaciones/yo` | fundacion | Fundación propia |
| POST | `/fundaciones` | fundacion | Registra la fundación propia; queda `verificado: false` |
| PATCH | `/fundaciones/yo` | fundacion | Actualiza necesidades, horarios, prendas aceptadas, etc. |
| POST | `/donaciones` | persona, oficio | Registra una donación (ver reglas abajo) |
| GET | `/donaciones/mias` | cualquiera | Una persona ve las donaciones que hizo; una fundación, las que recibe |
| PATCH | `/donaciones/:id/recepcion` | fundacion | Confirma la recepción. Solo entonces la donación cuenta como impacto |
| PATCH | `/donaciones/:id/cancelacion` | persona, oficio | Quien donó cancela una donación aún no recibida |

### Reglas de `POST /donaciones`

```json
{ "fundacionId": "uuid", "items": [{ "prenda": "calzado", "cantidad": 1, "estado": "buen_estado" }] }
```

| Situación | Respuesta |
|---|---|
| La fundación no recibe alguna de las prendas | `422 prenda_no_aceptada`, con `detalles.prendas` |
| Hay prendas dañadas y la fundación no las acepta | `422 fundacion_no_acepta_danada`, con `detalles.sugerencias`: qué hacer con cada prenda, por ejemplo repararla en una zapatería |
| La donación es válida | `201`, con `totalPrendas` y `kgEstimados` |

## Códigos de error

| HTTP | Código | Cuándo |
|---|---|---|
| 400 | `datos_invalidos` | Falla la validación. `detalles` trae `[{ campo, mensaje }]` |
| 400 | `json_invalido` | El cuerpo de la solicitud no es JSON válido |
| 401 | `sin_sesion` / `token_invalido` | Falta el token, o expiró o fue adulterado |
| 403 | `prohibido` | Rol incorrecto o recurso ajeno |
| 404 | `no_encontrado` / `ruta_no_encontrada` | — |
| 409 | `conflicto` | Perfil duplicado o donación ya procesada |
| 422 | `canal_no_disponible`, `prenda_no_aceptada`, `fundacion_no_acepta_danada` | Reglas de negocio |

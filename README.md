# Álbum de fotos con NestJS

API de álbumes y fotos desarrollada con NestJS, TypeScript y PostgreSQL. El Taller 7 valida las solicitudes del CRUD de fotos y traduce los errores de PostgreSQL a respuestas HTTP.

**Autor** · Juan Diego Sotomayor

- [Taller 7 · CRUD de fotos, validación y errores](#taller-7)
- [Taller 6 · Álbumes, etiquetas, filtros y paginación](#taller-6)
- [Taller 5 · Persistencia con PostgreSQL y TypeORM](#taller-5)
- [Taller 4 · CRUD con almacenamiento en memoria](#taller-4)

## Taller 7

Los DTO validan el cuerpo de `POST` y `PATCH` y los parámetros de `GET /api/fotos`. El listado conserva los filtros y el orden del Taller 6, con un máximo de 50 fotos por página. Al crear o editar una foto se puede asociar un álbum por ID y enviar las etiquetas como texto. El servicio normaliza los textos y reutiliza las etiquetas existentes.

### Ejecución del Taller 7

Usa la base local `album` del Taller 6 y configura la conexión en `.env` con los campos de [`.env.example`](.env.example).

```bash
npm ci
npm run start:dev
```

La URL base es `http://localhost:3000/api`. Consulta `GET /api/albumes` para elegir un ID válido. En estas pruebas se utilizó el álbum Guayaquil, con ID `2`. Las solicitudes de ejemplo están en [`api.http`](api.http).

### Pruebas en Postman y pgAdmin

En Postman usa **Body → raw → JSON** para `POST` y `PATCH`, y **Body → none** para `GET` y `DELETE`.

#### Crear una foto con álbum y etiquetas

`POST /api/fotos` devolvió `201 Created` y creó «Cerro Santa Ana» con ID `21`, el álbum Guayaquil y las etiquetas `ciudad` y `faro`.

```json
{
  "titulo": "Cerro Santa Ana",
  "calificacion": 4.8,
  "ruta": "https://picsum.photos/id/1/600/400",
  "albumId": 2,
  "etiquetas": ["Ciudad", "faro"]
}
```

![POST de Cerro Santa Ana con respuesta 201, álbum y etiquetas](capturas/taller-7/1.png)

#### Verificar las relaciones en pgAdmin

Antes de eliminar la foto, ejecuta la consulta en el **Query Tool** de la base `album`. Si repites la prueba, usa el ID que devolvió el POST.

```sql
SELECT f.id, f.titulo, a.nombre AS album, e.texto AS etiqueta
FROM public.fotos AS f
LEFT JOIN public.albumes AS a ON a.id = f."albumId"
LEFT JOIN public.fotos_etiquetas AS fe ON fe.foto_id = f.id
LEFT JOIN public.etiquetas AS e ON e.id = fe.etiqueta_id
WHERE f.id = 21
ORDER BY e.texto;
```

![pgAdmin muestra dos vínculos para la foto 21, con ciudad y faro](capturas/taller-7/2.png)

#### Actualizar parcialmente la foto

`PATCH /api/fotos/21` con `{"calificacion": 2.5}` devolvió `200 OK`. La nueva calificación se guardó y se conservaron el título, el álbum y las etiquetas.

![PATCH de la foto 21 con calificación 2.5 y respuesta 200](capturas/taller-7/3.png)

#### Eliminar la foto

`DELETE /api/fotos/21` devolvió `204 No Content` con el cuerpo vacío.

![DELETE de la foto 21 con respuesta 204](capturas/taller-7/4.png)

#### Validar el límite de paginación

`GET /api/fotos?limit=999` devolvió `400 Bad Request` con el mensaje `limit must not be greater than 50`. En Postman el parámetro `limit` se ingresó en **Params**.

![GET con limit igual a 999 y respuesta 400](capturas/taller-7/5.png)

#### Validar el cuerpo de la solicitud

`POST /api/fotos` con `{"titulo": "", "calificacion": 9, "ruta": "no-url", "hack": 1}` devolvió `400 Bad Request`. La respuesta enumeró el título vacío, la calificación fuera de rango, la URL inválida y el campo extra.

![POST con cuatro errores de validación en la respuesta 400](capturas/taller-7/6.png)

#### Rechazar la referencia a un álbum inexistente

`POST /api/fotos` con los datos válidos de «Cerro Santa Ana» y `albumId: 2147483467` devolvió `400 Bad Request` con el mensaje «Referencia a un registro inexistente». El filtro tradujo el error de clave foránea de PostgreSQL.

![POST con un álbum inexistente y respuesta 400](capturas/taller-7/7.png)

#### Consultar la foto eliminada desde el navegador

Al abrir `http://localhost:3000/api/fotos/21` después del DELETE, la API devolvió `404 Not Found` con el mensaje «Foto 21 no encontrada».

![Navegador con la respuesta 404 para la foto 21](capturas/taller-7/8.png)

## Taller 6

Un álbum puede tener varias fotos y cada foto puede pertenecer a un álbum. Una foto también puede tener varias etiquetas, compartidas con otras fotos mediante la tabla `fotos_etiquetas`.

### Rutas de la API

En `taller-6`, la URL base es `http://localhost:3000/api`. El puerto predeterminado es 3000 y puede cambiarse con la variable de entorno `PORT`.

| Método | Ruta | Descripción | Respuesta exitosa |
| --- | --- | --- | --- |
| GET | `/api/fotos` | Listar fotos con su álbum y etiquetas, con filtros, orden y paginación | 200, `{ data, total, page, limit }` |
| GET | `/api/fotos/:id` | Consultar una foto con su álbum y etiquetas | 200, foto encontrada |
| POST | `/api/fotos` | Crear una foto | 201, foto creada |
| PATCH | `/api/fotos/:id` | Actualizar parcialmente una foto | 200, foto actualizada |
| DELETE | `/api/fotos/:id` | Eliminar una foto | 204, sin cuerpo |
| GET | `/api/albumes` | Listar álbumes | 200, arreglo de álbumes |
| GET | `/api/albumes/:id/fotos` | Consultar un álbum con sus fotos | 200, álbum con el arreglo `fotos` |

Las rutas con `:id` usan `ParseIntPipe`. Un ID no numérico devuelve 400 y un ID inexistente devuelve 404.

### Ejecución del Taller 6

1. Usa la base local `album`. Si todavía no existe, abre el **Query Tool** de la base `postgres` en pgAdmin y ejecuta `CREATE DATABASE album;`.
2. En la raíz del proyecto, copia `.env.example` a `.env` si todavía no existe. Configura `DB_NAME=album`, `DB_HOST=localhost`, `DB_PORT=5432`, `PORT=3000` y las credenciales de tu PostgreSQL local.
3. Detén la API si ya está corriendo. Desde la raíz del proyecto ejecuta estos comandos y deja la terminal abierta.

```bash
npm ci
npm run seed
npm run start:dev
```

El seed vacía las tablas del taller, reinicia sus IDs y carga 20 fotos, 3 álbumes y 6 etiquetas. Si necesitas conservar los datos actuales de `album`, respáldalos antes de ejecutarlo. Las calificaciones y las asignaciones de álbumes y etiquetas varían con cada carga.

![Ejecución del seed con 20 fotos, 3 álbumes y 6 etiquetas](capturas/taller-6/1.png)

### Pruebas en Postman

En Postman, selecciona **GET**, escribe la URL y deja **Body → none**. Para los filtros, puedes digitar cada parámetro en las columnas **Key** y **Value** de la pestaña **Params**. Pulsa **Send** y revisa el estado y el cuerpo de la respuesta.

#### Filtro por calificación y paginación

`GET /api/fotos?min=3&max=5&page=1&limit=3` devuelve `200 OK`. En esta ejecución hubo 7 coincidencias. La primera página contiene 3 fotos con sus etiquetas y la respuesta muestra `total: 7`, `page: 1` y `limit: 3`.

![Filtro por calificación con las etiquetas de una foto](capturas/taller-6/2.png)

![Final del listado filtrado con el total y la paginación](capturas/taller-6/2.1.png)

#### Búsqueda por título

`GET /api/fotos?q=Foto%201` devuelve `200 OK`. En **Params**, el valor de `q` es `Foto 1`. La búsqueda encuentra 11 coincidencias y devuelve las primeras 10, con `page: 1` y `limit: 10`.

![Búsqueda de fotos con el parámetro q](capturas/taller-6/3.png)

![Final de la primera página con 11 coincidencias en total](capturas/taller-6/3.1.png)

#### Fotos del álbum Viajes

`GET /api/albumes/1/fotos` devuelve `200 OK`, el álbum con `id: 1`, el nombre `Viajes` y el arreglo `fotos`. El ID se escribe en la ruta y **Params** queda vacío.

![Álbum Viajes con el inicio del arreglo de fotos](capturas/taller-6/4.png)

![Final del arreglo de fotos del álbum Viajes](capturas/taller-6/4.1.png)

#### Validación de un parámetro inválido

`GET /api/fotos?min=abc` devuelve `400 Bad Request` con el mensaje `Validation failed (numeric string is expected)`.

![Respuesta 400 al enviar un valor de texto en min](capturas/taller-6/5.png)

### Verificación en pgAdmin

En el **Query Tool** de la base `album`, la consulta devolvió 37 vínculos con las columnas `foto_id` y `etiqueta_id`.

```sql
SELECT foto_id, etiqueta_id
FROM public.fotos_etiquetas
ORDER BY foto_id, etiqueta_id;
```

![Tabla de vínculos entre fotos y etiquetas con 37 filas en pgAdmin](capturas/taller-6/6.png)

### Reto del Taller 6

El listado `GET /api/fotos` incluye el álbum de cada foto. Si una foto no tiene álbum asignado, aparece `album: null`. El parámetro opcional `etiqueta` filtra por el texto exacto de una etiqueta y conserva todas las etiquetas de las fotos encontradas. El parámetro opcional `orden` acepta `asc` y `desc` para ordenar por calificación. En los empates, el ID menor aparece primero. Sin `orden`, el listado sigue ordenado por ID.

Usa los datos que ya están cargados en la base `album`. Con la API en ejecución, crea solicitudes **GET** a `http://localhost:3000/api/fotos`. Digita cada parámetro en una fila de **Params** y deja **Body → none**.

#### Filtro por etiqueta

`GET /api/fotos?etiqueta=playa` devolvió `200 OK` y 11 coincidencias. En la primera página, la foto 19 muestra las etiquetas `playa` y `ciudad`.

![Solicitud con el filtro por la etiqueta playa](capturas/taller-6/7.png)

![Etiquetas de la foto 19 y total de 11 coincidencias](capturas/taller-6/7.1.png)

#### Orden ascendente por calificación

`GET /api/fotos?orden=asc&limit=3` devolvió `200 OK` y las calificaciones `0.6`, `0.9` y `0.9`. Las fotos 13 y 14 empataron en calificación y aparecieron en orden de ID.

![Primera foto del listado ascendente con calificación 0.6](capturas/taller-6/8.png)

![Segunda foto del listado ascendente con calificación 0.9](capturas/taller-6/8.1.png)

![Tercera foto del listado ascendente y metadatos de paginación](capturas/taller-6/8.2.png)

#### Orden descendente por calificación

`GET /api/fotos?orden=desc&limit=3` devolvió `200 OK` y las calificaciones `4.9`, `4.8` y `4.8`.

![Primera foto del listado descendente con calificación 4.9](capturas/taller-6/9.png)

![Segunda y tercera foto del listado descendente con calificación 4.8](capturas/taller-6/9.1.png)

#### Álbum en el listado

`GET /api/fotos?limit=1` devolvió `200 OK`. La foto 1 incluye el álbum `Viajes` con `id: 1` y su arreglo de etiquetas.

![Primera foto del listado con el álbum Viajes](capturas/taller-6/10.png)

![Álbum, etiquetas y paginación de la primera foto](capturas/taller-6/10.1.png)

#### Filtro y orden combinados

`GET /api/fotos?etiqueta=playa&orden=desc&limit=3` devolvió `200 OK` y las calificaciones `4.8`, `3.4` y `3.2`. La respuesta muestra también el álbum de cada foto.

![Solicitud que combina la etiqueta playa con el orden descendente](capturas/taller-6/11.png)

![Resultados del filtro combinado con la etiqueta playa y el álbum](capturas/taller-6/11.1.png)

#### Validación del parámetro orden

`GET /api/fotos?orden=otro` devolvió `400 Bad Request` con el mensaje `orden debe ser asc o desc`.

![Respuesta 400 al enviar un valor de orden inválido](capturas/taller-6/12.png)

## Taller 5

La API guarda las fotos en PostgreSQL mediante TypeORM. `Foto` se registra como la entidad de `public.fotos`. PostgreSQL genera el ID y asigna las fechas al insertar. El servicio valida el título y usa el repositorio para consultar y crear fotos, `save()` para actualizarlas y `remove()` para eliminarlas.

### Ejecución del Taller 5

Estos pasos reproducen la versión de la rama `taller-5`. Se necesita Node.js 24, npm y un servidor PostgreSQL local activo. Crea la base `album` si todavía no existe. Si aún no tienes un `.env`, copia la plantilla desde la raíz del proyecto. [Plantilla de configuración](.env.example)

```bash
cp .env.example .env
```

Configura `DB_USER` y `DB_PASSWORD` en `.env` con las credenciales de tu instalación. Luego instala las dependencias, carga las fotos de ejemplo y arranca la API.

```bash
npm ci
npm run seed
npm run start:dev
```

TypeORM sincroniza la tabla al iniciar el seed o la API. `npm run seed` carga 10 fotos cuando la tabla está vacía y omite la carga cuando ya hay registros. Para observar la tabla vacía como en la evidencia, inicia primero la API y consulta la tabla en pgAdmin. Luego detén NestJS, ejecuta el seed y vuelve a iniciar la API.

### Capturas del Taller 5

#### Arranque de NestJS y creación de la tabla

La terminal muestra el arranque de NestJS con TypeORM y el registro de las cinco rutas.

![Arranque de la API con TypeORM](capturas/taller-5/0.png)

pgAdmin muestra `public.fotos` en la base `album` con sus columnas y cero filas antes de la carga.

![Tabla fotos vacía en pgAdmin](capturas/taller-5/1.png)

#### Carga de las 10 fotos de ejemplo

La terminal muestra el comando `npm run seed` y confirma las 10 inserciones.

![Ejecución del seed](capturas/taller-5/2.png)

La consulta en pgAdmin muestra las 10 fotos guardadas, con IDs del 1 al 10 y las fechas generadas al insertar.

![Diez fotos del seed en PostgreSQL](capturas/taller-5/3.png)

#### Consulta por ID, creación y persistencia

`GET /api/fotos/3` devuelve `200 OK`, el registro `Foto 3` y su calificación `4.5`.

![Consulta de Foto 3 en Postman](capturas/taller-5/4.png)

`POST /api/fotos` con `{"titulo":"Cerro","calificacion":5,"ruta":"x.jpg"}` devuelve `201 Created`. En esta ejecución, PostgreSQL asignó el ID `11`.

![Creación de Cerro con ID 11](capturas/taller-5/5.png)

`GET /api/fotos` muestra a `Cerro` con el mismo ID y fecha de creación. Para reproducir la prueba de persistencia, reinicia NestJS y vuelve a consultar el listado o el ID que devolvió el POST.

![Listado con Cerro y las fotos del seed](capturas/taller-5/6.png)

#### Columna opcional y renombrado de `autor` a `fotografo`

Para el reto se agregó `autor` a `Foto` con `@Column({ type: 'text', nullable: true })`. Tras sincronizar la tabla, se asignó `Juan Diego` a `Cerro` (ID `11`) desde pgAdmin.

![Columna autor con un valor antes del cambio](capturas/taller-5/7.png)

Luego se cambió el nombre de la propiedad a `fotografo`, conservando el tipo `text` y la opción `nullable`. Después del arranque se consultó la misma fila. **El valor `Juan Diego` se conservó** en la columna `fotografo`.

![Columna fotografo con el mismo valor después del renombrado](capturas/taller-5/8.png)

`synchronize: true` modifica el esquema al arrancar. En este ejercicio conservó el valor, pero otros cambios de esquema pueden eliminar datos. En producción, una migración permite revisar el cambio de antemano y registrar qué se aplicó, por ejemplo un `ALTER TABLE ... RENAME COLUMN ...` explícito. [Migraciones en TypeORM](https://typeorm.io/docs/migrations/why/)

#### Actualización parcial y eliminación con el repositorio

`PATCH /api/fotos/11` con `{"calificacion":4.5}` devuelve `200 OK`. El servicio busca `Cerro`, aplica el cambio y guarda la entidad con `save()`. La respuesta conserva el ID y `fotografo: "Juan Diego"` y muestra la nueva calificación.

![Actualización parcial de Cerro en Postman](capturas/taller-5/9.png)

Para probar la eliminación, `POST /api/fotos` creó `Foto temporal` con ID `12` y devolvió `201 Created`.

![Creación de la foto temporal con ID 12](capturas/taller-5/10.png)

`DELETE /api/fotos/12` busca la entidad y la elimina con `remove()`. Postman muestra `204 No Content` con el cuerpo vacío.

![Eliminación de la foto temporal con respuesta 204](capturas/taller-5/11.png)

## Taller 4

Los datos se guardan en memoria. Al reiniciar la aplicación se recuperan las dos fotos iniciales y se pierden los cambios realizados. [Documento de evidencias del Taller 4](docs/Taller%204%20-%202P%20-%20Juan%20Diego%20Sotomayor.pdf)

### Objetivo del reto

- Completar el CRUD con `update(id, datos)` y `remove(id)` en `FotosService`, y sus rutas PATCH y DELETE en el controlador.
- Responder `204 No Content` al eliminar mediante `@HttpCode(204)`.
- Reutilizar `findOne(id)` en actualización y eliminación para responder 404 cuando la foto no exista.
- Enviar un POST sin título y observar el resultado. La validación del cuerpo se deja para una sesión posterior, como indica el enunciado.

### Ejecución del Taller 4

Se necesita Node.js 24 y npm. Clona la rama `taller-4` para ejecutar la versión en memoria.

```bash
git clone --branch taller-4 https://github.com/jdsotomayorjimenez/taller4-2p-ddaw.git
cd taller4-2p-ddaw
npm ci
npm run start:dev
```

### Ejemplos en Postman

#### Crear una foto

Para `POST /api/fotos`, selecciona **Body → raw → JSON** y envía el siguiente cuerpo.

```json
{
  "titulo": "Cerro",
  "calificacion": 5
}
```

Si es la primera creación después de iniciar la aplicación, la nueva foto recibe el ID `3`. El servicio genera los IDs con un contador que avanza con cada creación, de modo que eliminar una foto no produce IDs duplicados.

#### Actualizar una foto

Envía `PATCH /api/fotos/1` con el siguiente cuerpo en **Body → raw → JSON**.

```json
{
  "calificacion": 5
}
```

La respuesta es 200 y contiene la foto Atardecer con calificación 5, conservando su título e ID. Solo se modifican los campos enviados.

#### Eliminar una foto

Envía `DELETE /api/fotos/1` sin cuerpo. La respuesta es `204 No Content`, sin JSON ni mensaje. Si repites la petición, devuelve 404 porque la foto ya no existe.

#### Probar un POST sin título

Envía este cuerpo a `POST /api/fotos`.

```json
{
  "calificacion": 7
}
```

La API responde 201 y guarda una entrada sin `titulo`. La interfaz `Foto` y los tipos de TypeScript no validan el JSON recibido durante la ejecución. En este taller se acepta el cuerpo de la petición sin validar el título ni restringir el rango de `calificacion`.

### Verificación

```bash
npm run build
npm run lint
```

Las pruebas manuales de las rutas están documentadas en las capturas siguientes. Los scripts `npm test` y `npm run test:e2e` están configurados, pero actualmente no hay archivos de pruebas automatizadas y terminan indicando `No test files found`.

### Capturas del Taller 4

Las capturas `0.png` a `5.png` documentan la implementación inicial. Las capturas `6.png` a `11.png` corresponden al reto del Taller 4 en una ejecución nueva. La entrada sin título recibe el ID `3` porque fue la primera foto creada en esa ejecución.

#### Generación del módulo, controlador y servicio

![Generación del recurso fotos con Nest CLI](capturas/taller-4/0.png)

#### Listado de fotos — 200 OK

`GET /api/fotos` devuelve las fotos iniciales Atardecer y Malecón.

![Listado de fotos en Postman](capturas/taller-4/1.png)

#### Foto inexistente — 404 Not Found

`GET /api/fotos/9` devuelve el mensaje `Foto 9 no encontrada`.

![Consulta de una foto inexistente](capturas/taller-4/2.png)

#### ID no numérico — 400 Bad Request

`GET /api/fotos/abc` es rechazado por `ParseIntPipe`.

![Validación del ID en Postman](capturas/taller-4/3.png)

#### Creación de una foto — 201 Created

`POST /api/fotos` crea la foto Cerro con ID `3`, partiendo de las dos fotos iniciales.

![Creación de la foto Cerro](capturas/taller-4/4.png)

#### Listado después de la creación

La consulta posterior incluye la nueva foto.

![Listado con la foto Cerro](capturas/taller-4/5.png)

#### Actualización parcial — 200 OK

`PATCH /api/fotos/1` con `{"calificacion":5}` actualiza Atardecer y conserva su título e ID.

![Actualización parcial de Atardecer](capturas/taller-4/6.png)

#### Actualización de una foto inexistente — 404 Not Found

`PATCH /api/fotos/9` devuelve `Foto 9 no encontrada` al reutilizar `findOne(id)`.

![Actualización de una foto inexistente](capturas/taller-4/7.png)

#### Eliminación — 204 No Content

`DELETE /api/fotos/1` elimina la foto. El decorador `@HttpCode(204)` establece el estado y la respuesta no contiene cuerpo.

![Eliminación de una foto con respuesta 204 vacía](capturas/taller-4/8.png)

#### Repetición de la eliminación — 404 Not Found

Al repetir `DELETE /api/fotos/1`, el servicio devuelve `Foto 1 no encontrada`.

![Eliminación de una foto que ya no existe](capturas/taller-4/9.png)

#### POST sin título — 201 Created

`POST /api/fotos` con `{"calificacion":7}` crea una entrada con ID `3` y sin `titulo`, mostrando la ausencia de validación del cuerpo en esta etapa.

![Creación de una entrada sin título](capturas/taller-4/10.png)

#### Listado final del reto — 200 OK

`GET /api/fotos` muestra Malecón y la entrada sin título. Atardecer ya no aparece porque fue eliminada.

![Listado final después de eliminar y crear sin título](capturas/taller-4/11.png)

### Estructura

```text
src/
├── main.ts
├── app.module.ts
└── fotos/
    ├── fotos.module.ts
    ├── fotos.controller.ts
    ├── fotos.service.ts
    └── entities/
        └── foto.entity.ts
```

El controlador define las rutas, el servicio administra las fotos y el módulo registra ambos.

Las imágenes están en `capturas/taller-4/` y el documento de evidencias está en `docs/`.

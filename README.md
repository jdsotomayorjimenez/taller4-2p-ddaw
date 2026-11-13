# Taller #3 · Álbum de fotos con NestJS

API desarrollada con NestJS y TypeScript para listar fotos, consultar una por ID y crear nuevas entradas. Los datos se guardan en memoria.

## Ejecución

Se necesita Node.js 24 y npm.

```bash
npm ci
npm run start:dev
```

La API está disponible en `http://localhost:3000/api/fotos`.

## Rutas

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/fotos` | Listar fotos |
| GET | `/api/fotos/:id` | Consultar una foto por ID |
| POST | `/api/fotos` | Crear una foto |

Para crear una foto en Postman, selecciona **Body → raw → JSON** y envía:

```json
{
  "titulo": "Cerro",
  "calificacion": 5
}
```

## Capturas

### Generación del módulo, controlador y servicio

![Generación del recurso fotos con Nest CLI](capturas/0.png)

### Listado de fotos — 200 OK

`GET /api/fotos` devuelve las fotos iniciales Atardecer y Malecón.

![Listado de fotos en Postman](capturas/1.png)

### Foto inexistente — 404 Not Found

`GET /api/fotos/9` devuelve el mensaje `Foto 9 no encontrada`.

![Consulta de una foto inexistente](capturas/2.png)

### ID no numérico — 400 Bad Request

`GET /api/fotos/abc` es rechazado por `ParseIntPipe`.

![Validación del ID en Postman](capturas/3.png)

### Creación de una foto — 201 Created

`POST /api/fotos` crea la foto Cerro con ID `3`, partiendo de las dos fotos iniciales.

![Creación de la foto Cerro](capturas/4.png)

### Listado después de la creación

La consulta posterior incluye la nueva foto.

![Listado con la foto Cerro](capturas/5.png)

## Estructura

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

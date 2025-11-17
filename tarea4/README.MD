## Arquitectura general

El proyecto está separado en capa de presentación (Thymeleaf + JS) y capa de negocio/acceso a datos (Spring Boot + JPA):

- **Frontend**
  - `src/main/resources/templates/fragments/nav.html`: fragmento con la barra de navegación y estilos reutilizables.
  - `src/main/resources/templates/avisos.html`: vista principal con la tabla de avisos y la paginación.
  - `src/main/resources/static/js/ratings.js`: script que consulta la API de avisos, renderiza la tabla en el navegador y envía las evaluaciones con `fetch`.
  - `src/main/resources/static/css/styles.css`: hoja de estilos reutilizada y adaptada desde la tarea anterior.

- **Backend (Java / Spring Boot)**
  - `controllers/ApiController.java`: expone los endpoints REST para listar avisos paginados y registrar nuevas notas.
  - `controllers/AppController.java`: controla las rutas de la parte web y resuelve la vista `avisos.html`.
  - `services/ApiService.java`: contiene la lógica para construir el resumen de avisos (incluyendo promedio y cantidad de notas) y guardar nuevas evaluaciones.
  - `services/AppService.java`: capa de servicio para la parte web (actualmente simple, pero separada para mantener la estructura).
  - `models/*.java`: entidades JPA (`AvisoAdopcion`, `Comuna`, `Nota`) que mapean las tablas de la base de datos.
  - `dto/*.java`: clases de transferencia (`AvisoResumenDTO`, `NotaRequest`, `NotaResponseDTO`) usadas para separar la representación de la API del modelo de datos.
  - `models/AvisoRepository.java` y `models/NotaRepository.java`: repositorios JPA para consultar avisos y notas.

## Flujo de uso

1. El usuario entra a `/` y es redirigido a `/avisos`, donde se renderiza `avisos.html`.
2. Al cargar la página, `ratings.js` llama a `GET /api/avisos?page=...&size=...` para obtener un listado paginado con los avisos y sus datos agregados (promedio de nota y cantidad de notas).
3. La tabla se construye dinámicamente en el navegador. Si un aviso no tiene evaluaciones, la columna de nota muestra `-`.
4. Al hacer clic en “Evaluar”, el script pide una nota entre 1 y 7 y la envía con `POST /api/avisos/{id}/notas` en formato JSON.
5. El backend valida la nota, la guarda en la tabla `nota`, recalcula el promedio y el total de evaluaciones de ese aviso y el frontend vuelve a cargar la página actual para reflejar los nuevos valores.
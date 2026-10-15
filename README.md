# Sistema de Convalidaciones · Versión 28.0

Aplicación estática para estudiantes con correo **@fcpn.edu.bo**, generación local de tres PDF y entrega en un único Google Form al final. Se conservan las equivalencias, los siete planes, las gestiones de aprobación y el lector opcional del historial académico.

## Revisión de materias antes de descargar

Los tres informes muestran sus datos y, debajo del total de materias convalidadas, la misma tabla que se incluirá en el PDF. Puedes desplazarte para leer las asignaturas y sus equivalencias. La advertencia naranja, la casilla de aceptación y los botones están en el pie de la ventana; en pantallas de muy poca altura ese pie también permite desplazarse para mantener accesibles sus controles.

Revisa todo antes de confirmar. El aviso explica que debes conservar ese mismo PDF para entregarlo y que no podrás corregirlo, rehacerlo ni volver a descargar ese informe en este navegador. Marca la casilla para habilitar **Sí, descargar una vez**, o usa **Volver y corregir**. La revisión se reinicia para cada informe.

En el informe final, tanto la confirmación como la sección de entrega indican qué PDF adjuntar en cada pregunta: **Primer informe → INFORME 1**, **Segundo informe → INFORME 2**, **Informe Final → INFORME FINAL**. Después se pulsa **Enviar** en Google.

Al descargar el final, su opción del menú y el botón principal cambian a **Abrir formulario de entrega**. Puedes reabrirlo si cerraste la pestaña, incluso después de recargar el sistema o volver al paso 1. Esta acción conserva los datos prellenados y no genera otro PDF ni cambia el registro de descargas. Google indica si ya respondiste según la restricción de una respuesta configurada por el propietario.

## PDF con descarga directa y vista del ORIGINAL

La descarga continúa siendo directa: el sistema no llama a `window.print()` ni abre el diálogo de impresión. El nuevo exportador usa la misma vista HTML de los informes, las reglas de impresión de los tres CSS originales y los archivos originales de ambos logotipos, sin reducirlos previamente.

El navegador prepara esa vista con Arial y con las medidas originales de A4 horizontal y márgenes de 5 mm. Cada página se incorpora al PDF a 300 ppp y recibe una capa de texto invisible para búsqueda y copia. Se añaden el correo y el código de emisión. No se reconstruyen las tablas mediante coordenadas y fuentes visibles de otra biblioteca.

Los nombres de archivo son:

- `INFORME 1 - Nombre Apellido - código.pdf`
- `INFORME 2 - Nombre Apellido - código.pdf`
- `INFORME FINAL - Nombre Apellido - código.pdf`

El campo de correo está al lado de Mención de destino, en la última fila de los datos del estudiante. En móvil aparece después de esa mención.

Se corrigió el error «No se pueden leer los estilos del informe». Los CSS de impresión y los dos PNG originales ahora vienen incorporados en `report-assets.js`. El exportador no lee `sheet.cssRules` ni descarga imágenes con `fetch`; así evita esas restricciones al abrir archivos locales o al preparar la imagen del PDF. Copia también este nuevo archivo al actualizar el sitio.

La generación conserva SVG, canvas y Web Crypto. El sitio publicado debe usar HTTPS para disponer de las APIs de integridad y de un origen estable para sus registros. El código verifica los logos, evita cortar celdas combinadas y rechaza una página vacía detectada antes de iniciar la descarga.

**Alcance de la revisión de esta versión:** pasaron 32 pruebas locales de flujo, menú y exportador. Incluyen la tabla de revisión en los tres informes, su independencia de la captura para el PDF, el reinicio de la casilla y la reapertura del formulario sin nuevas descargas. La creación de bytes del PDF se simula en las pruebas de flujo y las medidas de tabla se simulan en la prueba de paginación. El generador, los recursos y la vista HTML del PDF permanecen idénticos a v27. No hubo comprobación visual de esta interfaz en un navegador real en este entorno.

## Comparación con el ORIGINAL

Los datos y reglas de convalidación coinciden con el ZIP original adjunto. Se comprobaron **8.907 escenarios y 26.721 resultados de informes**, incluidas selecciones individuales, electivas ocupadas o pendientes, periodos de aprobación y prioridad de 64 horas. Las 19 funciones de cálculo y los bloques de reglas de gestión son idénticos. `COMPARACION_ORIGINAL.json` conserva los recuentos y las huellas SHA-256 de los siete archivos comparados byte por byte.

Para repetir la comparación, descomprime el ORIGINAL en otra carpeta y ejecuta `node tests/academic-equivalence.test.cjs /ruta/al/ORIGINAL/convalidaciones-mejorado-main`. La prueba no contacta Google. Las diferencias de interfaz, correo, persistencia y descarga corresponden a las funciones incorporadas en versiones anteriores.

## Uso

1. Completa correo institucional, nombre, CI, RU y menciones; selecciona las materias aprobadas.
2. Genera el Informe 1 y confirma los datos antes de iniciar su descarga.
3. Pulsa Siguiente, completa el plan 2023 y descarga el Informe 2 con la misma confirmación.
4. Después descarga el INFORME FINAL. Se abre el formulario con los cinco datos ya preparados; adjunta los tres PDF y pulsa Enviar en Google.

Cada informe se puede descargar una vez en este navegador. Los informes 1 y 2 descargados se muestran deshabilitados y atenuados; el final descargado cambia a una acción para abrir el formulario. Al descargar Informe 1 se deshabilita el botón principal en el primer paso; Siguiente permite continuar con el segundo. Una vez descargado el final, el botón principal permite reabrir el formulario desde cualquier paso. Cancelar la confirmación permite corregir los datos. Se fijan los datos de identidad y menciones al iniciar la primera descarga.

El bloqueo se guarda **al iniciar la descarga**. La página no puede detectar si el navegador terminó de guardar el PDF o si el usuario canceló. No hay botón de descarga repetida. El enlace de entrega se conserva para volver a abrir Forms tras el informe final.

## Publicación

Publica el contenido completo de **esta carpeta**, conservando los recursos locales. Funciona en GitHub Pages y Vercel sobre HTTPS. No hay receptor que activar, base de datos, códigos por correo ni Apps Script. El lector de integridad de Kardex va en la carpeta hermana y no debe publicarse en el sitio de estudiantes.

El formulario final debe estar publicado y permitir respuestas. En la revisión del 14/10/2026 aparecía como no publicado. Mantén en Google sus controles de cuenta FCPN verificada, audiencia institucional y una respuesta por cuenta. No se modificó la configuración del formulario ni se enviaron respuestas de prueba.

El prellenado ya tiene los identificadores reales en `envios-config.js`. Si eliminas y vuelves a crear preguntas, deberás actualizar sus identificadores. Lee `CONFIGURAR_ENVIOS.md`.

## Integridad del PDF

- Identificador aleatorio de emisión al final del informe y en los metadatos.
- PDF estático sin campos rellenables, con las tablas y los logotipos habituales.
- SHA-256 de los bytes finales, nombre de archivo, identificador y fecha guardados en el registro local por informe.
- Los registros corruptos o el almacenamiento bloqueado impiden iniciar otra descarga sin registro.
- Bloqueo compartido entre pestañas mediante Web Locks cuando el navegador lo soporta. Sin esa API, el control simultáneo entre pestañas es de mejor esfuerzo.

La carpeta hermana `herramientas-kardex` permite comparar una copia con el original recibido en Forms. Una coincidencia acredita igualdad de bytes con la referencia elegida; no es una firma institucional ni una certificación legal. No impide editar el archivo antes de su primera entrega. Kardex debe conservar el original recibido y comprobar su correspondencia con el expediente.

## Límites del modo sin servidor

El registro `convalidaciones-descargas-v24` pertenece al navegador y al origen del sitio. Borrar datos, usar otro dispositivo o cambiar de dominio deja de disponer de ese registro. Migrar de GitHub Pages a Vercel no traslada los bloqueos automáticamente. Esto no sustituye la restricción de respuesta única configurada en Google ni una base de datos institucional.

El correo escrito se valida por formato y dominio, pero quien verifica la cuenta es Google al responder. El parámetro `authuser` orienta la selección de cuenta; Google decide si debe pedir sesión o cambio de cuenta. El correo verificado no se suplanta con un campo prellenado.

Los cinco datos prellenados son editables en Google. Los tres archivos se adjuntan manualmente en sus preguntas originales. Abrir Forms no envía la respuesta y la página no puede conocer la confirmación de envío en esa otra pestaña.

## Pruebas locales

Ejecuta `node tests/downloads.test.cjs` y `node tests/menu.test.cjs` desde esta carpeta y `node tests/reader.test.cjs` desde la carpeta hermana de Kardex. No necesitan cuentas ni envían correos o respuestas. Ejecuta además `node tests/pdf-export.test.cjs` para comprobar nombres, selección de estilos y paginación. Consulta `COMPROBACION_ACTUALIZACION.txt` para el alcance de la revisión.

Si en el futuro modificas los CSS o los logos de los informes, ejecuta `node tools/build-report-assets.cjs` antes de publicar. Este paso es para mantenimiento; los estudiantes solo usan la página. La prueba del exportador detecta si los recursos incorporados quedaron desactualizados.

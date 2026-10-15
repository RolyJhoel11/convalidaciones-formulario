# Sistema de Convalidaciones · Versión 25.0

Aplicación estática para estudiantes con correo **@fcpn.edu.bo**, generación local de tres PDF y entrega en un único Google Form al final. Se conservan las equivalencias, los siete planes, las gestiones de aprobación y el lector opcional del historial académico.

## Formato recuperado del ORIGINAL

Los tres informes usan de nuevo A4 horizontal, márgenes de 5 mm, encabezado con logotipos y línea inferior, datos del estudiante en una fila y tablas compactas con las medidas de `print.css`. Se conservan celdas combinadas, colores, títulos de los planes, recuento y nota final originales. Informe 2 conserva las dos columnas de planes que tenía en el original; los informes 1 y final conservan sus tres columnas.

Se añade únicamente una fila para el correo institucional y el identificador de emisión al pie. Si el informe ocupa varias páginas se repite la cabecera de su tabla, como en el ORIGINAL. El formato se aplica a las nuevas descargas. Se conserva el registro local de descargas de la versión 24.

## Comparación con el ORIGINAL

Los datos y reglas de convalidación coinciden con el ZIP original adjunto. Se comprobaron **8.907 escenarios y 26.721 resultados de informes**, incluidas selecciones individuales, electivas ocupadas o pendientes, periodos de aprobación y prioridad de 64 horas. Las 19 funciones de cálculo y los bloques de reglas de gestión son idénticos. `COMPARACION_ORIGINAL.json` conserva los recuentos y las huellas SHA-256 de los siete archivos comparados byte por byte.

Para repetir la comparación, descomprime el ORIGINAL en otra carpeta y ejecuta `node tests/academic-equivalence.test.cjs /ruta/al/ORIGINAL/convalidaciones-mejorado-main`. La prueba no contacta Google. Las diferencias de interfaz, correo, persistencia y descarga corresponden a las funciones incorporadas en versiones anteriores.

## Uso

1. Completa correo institucional, nombre, CI, RU y menciones; selecciona las materias aprobadas.
2. Genera el Informe 1 y confirma los datos antes de iniciar su descarga.
3. Pulsa Siguiente, completa el plan 2023 y descarga el Informe 2 con la misma confirmación.
4. Después descarga el INFORME FINAL. Se abre el formulario con los cinco datos ya preparados; adjunta los tres PDF y pulsa Enviar en Google.

Cada informe se puede descargar una vez en este navegador. El menú muestra el informe descargado deshabilitado y atenuado. Al descargar Informe 1 también se deshabilita el botón principal en el primer paso; Siguiente permite continuar con el segundo. Cancelar la confirmación permite corregir los datos. Se fijan los datos de identidad y menciones al iniciar la primera descarga.

El bloqueo se guarda **al iniciar la descarga**. La página no puede detectar si el navegador terminó de guardar el PDF o si el usuario canceló. No hay botón de descarga repetida. El enlace de entrega se conserva para volver a abrir Forms tras el informe final.

## Publicación

Publica el contenido completo de **esta carpeta**, conservando los recursos locales. Funciona en GitHub Pages y Vercel sobre HTTPS. No hay receptor que activar, base de datos, códigos por correo ni Apps Script. El lector de integridad de Kardex va en la carpeta hermana y no debe publicarse en el sitio de estudiantes.

El formulario final debe estar publicado y permitir respuestas. En la revisión del 14/10/2026 aparecía como no publicado. Mantén en Google sus controles de cuenta FCPN verificada, audiencia institucional y una respuesta por cuenta. No se modificó la configuración del formulario ni se enviaron respuestas de prueba.

El prellenado ya tiene los identificadores reales en `envios-config.js`. Si eliminas y vuelves a crear preguntas, deberás actualizar sus identificadores. Lee `CONFIGURAR_ENVIOS.md`.

## Integridad del PDF

- Identificador aleatorio de emisión en cada página y en los metadatos.
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

Ejecuta `node tests/downloads.test.cjs` y `node tests/menu.test.cjs` desde esta carpeta y `node tests/reader.test.cjs` desde la carpeta hermana de Kardex. No necesitan cuentas ni envían correos o respuestas. Consulta `COMPROBACION_ACTUALIZACION.txt` para el alcance de la revisión.

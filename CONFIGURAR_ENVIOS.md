# Entrega única de los tres informes · FCPN

Los informes 1 y 2 solo se descargan. Al descargar el informe final se abre **INFORMES**, que tiene cinco preguntas de datos y tres preguntas de archivos: Informe 1, Informe 2 e Informe Final. Los dos formularios anteriores ya no se abren desde el sistema.

Formulario de entrega: https://forms.gle/EE49iVLDsQNnQ1XdA

## Configuración ya incorporada

`envios-config.js` contiene el enlace publicado largo y los identificadores reales de las cinco preguntas, obtenidos de la estructura del formulario actual:

| Dato del sistema | Pregunta de Google Forms | Identificador de prellenado |
| --- | --- | --- |
| Nombre | Apellidos y Nombres | entry.1422839057 |
| CI | Cédula de identidad (CI) | entry.1963355893 |
| RU | Registro Universitario (RU) | entry.1922283312 |
| Mención 1998 | Mención del plan 1998 | entry.994095876 |
| Mención de destino | Mención de destino | entry.1806387132 |

No se necesita ejecutar scripts para obtenerlos. `form-links.js` exige los cinco valores y construye el enlace oficial con caracteres y acentos codificados. Se usa la cuenta escrita como orientación de inicio de sesión, sin recoger contraseñas ni códigos.

## Lo que debes hacer en Google

1. Abre el formulario final con tu cuenta propietaria y **publícalo**. En la revisión del 14/10/2026 mostraba “El formulario no está publicado”. Confirma también que acepta respuestas.
2. Conserva el correo verificado, la audiencia institucional FCPN, una respuesta por cuenta y las tres preguntas de subida de archivos. Mantén el envío de copia según la opción que ya configuraste.
3. Prueba la página publicada con una cuenta de estudiante FCPN. Tras los tres informes, comprueba los cinco datos, la cuenta activa y las tres casillas de archivos antes de enviar una respuesta real.

La aplicación no alteró ajustes ni envió respuestas de prueba. Tener una cuenta propietaria FCPN no sustituye configurar la audiencia del formulario. No hay mensaje de activación de Kardex ni receptor adicional.

## Si cambias el formulario

Cambiar un título conserva normalmente el identificador de la pregunta; eliminar y recrear una pregunta lo cambia. Desde Google Forms, usa “Rellenar previamente el formulario” para obtener un enlace de ejemplo y copia los números `entry` correspondientes en `envios-config.js`. Conserva los valores de las menciones iguales a los del sistema.

La página rellena nombre, CI, RU y menciones mediante la URL. Google conserva el control de la cuenta, permite revisar o editar respuestas y requiere adjuntar los archivos y pulsar Enviar. No hay adjuntos ni envíos automáticos ocultos.

## Publicación del sitio

Sube el contenido de esta carpeta a GitHub Pages o Vercel y conserva todos los recursos. Si el navegador mantiene la versión anterior en caché, recarga la página. No publiques la carpeta hermana de Kardex. La actualización conserva los datos académicos guardados de la versión anterior; el registro de las nuevas descargas comienza con esta versión y no reconstruye descargas anteriores que nunca se registraron.

Las descargas nuevas se guardan por navegador y origen. El traslado a Vercel crea otro origen y no migra estos registros. No borres los datos del navegador durante el trámite. El estudiante debe guardar cada archivo al confirmar porque el bloqueo comienza en ese momento.

=== Congreso Programa ===
Contributors: grupoelis
Tags: congreso, programa, shocklogic, eventos
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Muestra el programa de congresos usando la API de ShockLogic mediante shortcode.

== Description ==

Este plugin permite mostrar el programa completo de un congreso en cualquier pagina o post de WordPress usando un simple shortcode.

Caracteristicas:
* Carga datos en tiempo real desde la API de ShockLogic
* Soporte para espanol (ESP) e ingles (ENG)
* Vista de tabla responsive para desktop
* Vista de cards para dispositivos moviles
* Filtros por dia y sala
* Modal con informacion detallada de ponentes
* Banderas de paises para cada ponente

== Installation ==

1. Sube la carpeta `congreso-programa` al directorio `/wp-content/plugins/`
2. Activa el plugin desde el menu 'Plugins' en WordPress
3. Usa el shortcode en cualquier pagina o post

== Usage ==

Shortcode basico:
[congreso_programa id="SL-API-XXXXXXXXXXXX" lang="ESP"]

Parametros:
* `id` (requerido): El ID del congreso de ShockLogic (formato: SL-API-XXXXXXXXXXXX)
* `lang` (opcional): Idioma de la interfaz. Valores: ESP (espanol) o ENG (ingles). Por defecto: ESP

Ejemplos:
[congreso_programa id="SL-API-6938a6c4a8495" lang="ESP"]
[congreso_programa id="SL-API-6938a6c4a8495" lang="ENG"]

== Frequently Asked Questions ==

= Donde obtengo el ID del congreso? =
El ID del congreso es proporcionado por ShockLogic cuando configuras tu evento. Tiene el formato SL-API-XXXXXXXXXXXX.

= Puedo usar multiples shortcodes en la misma pagina? =
Si, puedes usar varios shortcodes con diferentes IDs de congreso en la misma pagina.

= Los estilos interfieren con mi tema? =
Los estilos estan encapsulados usando clases con prefijo `cp-` para evitar conflictos con otros estilos.

== Changelog ==

= 1.0.0 =
* Version inicial
* Soporte para ESP y ENG
* Vista tabla y cards
* Modal de ponentes
* Filtros por dia y sala

== Upgrade Notice ==

= 1.0.0 =
Version inicial del plugin.

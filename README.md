# Laboral Claro Perú

Calculadoras estáticas de beneficios laborales. HTML, CSS y JavaScript nativos; los cálculos corren en el navegador y no se guardan los datos ingresados.

## Estructura

```text
.
├── index.html
├── cts/index.html
├── gratificaciones/index.html
├── vacaciones/index.html
├── privacidad/index.html
├── terminos/index.html
├── contacto/index.html
├── assets/css/styles.css
├── assets/js/app.js
├── assets/js/calculations.js
├── assets/js/config.js
├── tests/calculations.test.mjs
├── robots.txt
└── sitemap.xml
```

## Configuración previa a publicar

Edita `assets/js/config.js` antes de abrir el sitio al público:

- `siteUrl`: usa el dominio definitivo de Cloudflare Pages o tu dominio propio. Actualiza también los dominios de `canonical`, Open Graph, `robots.txt` y `sitemap.xml`.
- `whatsappNumber`: agrega el código de país y número, solo dígitos (Perú: `51` seguido del celular). Sin este valor, WhatsApp abre la pantalla para elegir un contacto.
- `contactEmail`: reserva para el correo de contacto si deseas publicarlo.
- `values`: concentra RMV, porcentajes, UIT y fechas de vigencia. Verifica la norma oficial antes de cambiar un importe.

El sitio está preparado para el régimen general privado. No uses los resultados para regímenes MYPE o especiales sin adaptar y validar las fórmulas. El botón “Guardar en PDF” abre la impresión del navegador; la solicitud premium por S/ 3 se coordina manualmente por WhatsApp y no cobra en línea. Los espacios publicitarios son marcadores y no cargan anuncios hasta que se configure AdSense y su política de cookies.

## Validar en tu computadora

Requiere Node.js solo para ejecutar las pruebas, no para alojar el sitio. En la carpeta del proyecto:

```powershell
npm test
python -m http.server 4173
```

Abre `http://localhost:4173`. Para detener el servidor usa `Ctrl+C`.

## Publicar gratis en Cloudflare Pages

1. Crea una cuenta gratuita en GitHub y otra en Cloudflare.
2. En GitHub, crea un repositorio nuevo, por ejemplo `calculadoras-laborales-peru`. Déjalo vacío, sin README automático.
3. Abre PowerShell en esta carpeta y ejecuta, reemplazando `TU-USUARIO` por tu usuario de GitHub:

   ```powershell
   git init
   git add .
   git commit -m "Crear calculadoras laborales"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/calculadoras-laborales-peru.git
   git push -u origin main
   ```

4. En Cloudflare, entra a **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**. Autoriza GitHub y selecciona el repositorio.
5. En el asistente de compilación, deja vacío el comando de build y usa `.` como directorio de salida. No se necesitan dependencias ni proceso de compilación.
6. Pulsa **Save and Deploy**. Cloudflare entregará una dirección `*.pages.dev` gratuita. Copia esa URL a `siteUrl`, canonical, Open Graph, `robots.txt` y `sitemap.xml`; vuelve a subir el cambio para que Google vea la dirección correcta.
7. Para usar un dominio propio, agrégalo desde **Custom domains** en Pages y sigue la configuración DNS que indique Cloudflare.
8. Prueba inicio, `/cts/`, `/gratificaciones/`, `/vacaciones/`, privacidad, términos, contacto, el enlace de WhatsApp y la opción de impresión en celular y computadora.

GitHub Pages también puede servir los archivos, pero los enlaces absolutos del sitio y los metadatos están preparados inicialmente para un dominio raíz de Cloudflare Pages. Si publicas bajo `usuario.github.io/nombre-repositorio/`, adapta la base de rutas y el sitemap antes de habilitarlo.

## Google y primeras cuatro semanas

**Semana 1: indexación y confianza.** Define el dominio, publica el sitio y verifica la propiedad en Google Search Console. Envía `/sitemap.xml`, usa la inspección de URL para solicitar indexación de inicio, CTS, gratificaciones y vacaciones, y revisa que no haya errores móviles. Completa el número de WhatsApp y revisa las fuentes legales.

**Semana 2: contenido útil.** Publica piezas breves con ejemplos reales: CTS de noviembre, gratificación con EPS, vacaciones truncas y vacaciones vencidas. Enlaza cada publicación a la calculadora correspondiente. Revisa consultas e impresiones en Search Console; ajusta títulos y descripciones sin prometer importes exactos.

**Semana 3: comunidades y video.** Comparte una guía práctica en grupos de Facebook de trabajadores solo donde las reglas del grupo lo permitan; responde preguntas y evita publicar el mismo enlace repetidamente. Publica dos o tres videos cortos en TikTok mostrando un ejemplo de cálculo, su desglose y el aviso de que es referencial. En el perfil deja un enlace directo a la herramienta.

**Semana 4: distribución y mejora.** Comparte la calculadora por estados de WhatsApp con una explicación breve, no como cadena. Pide a contadores y comunidades laborales comentarios sobre claridad y casos que faltan. En Search Console compara clics, impresiones y consultas; mejora una página a la vez y registra cambios de contenido y normas.

No compres enlaces ni publiques mensajes masivos. Prioriza respuestas útiles, permiso de los administradores y datos claros de las fuentes.

## Fuentes de los valores iniciales

- RMV S/ 1,230 desde el 1 de octubre de 2026: D.S. 015-2026-TR, [texto en El Peruano](https://busquedas.elperuano.pe/dispositivo/EX/2559163-1).
- RMV S/ 1,130 desde el 1 de enero de 2025: D.S. 006-2024-TR, publicado por el MTPE.
- UIT 2026 S/ 5,500: D.S. 301-2025-EF, [tabla de SUNAT](https://www.sunat.gob.pe/indicestasas/uit.html).
- La referencia del [MTPE para beneficios sociales](https://www.gob.pe/72288-calcular-la-liquidacion-de-beneficios-sociales-para-trabajadores-del-sector-privado) indica que su estimación considera la normativa vigente a septiembre de 2024; contrasta cualquier actualización posterior con la norma publicada.
- Vacaciones: D. Leg. 713 y D.S. 012-92-TR; [texto del D. Leg. 713 en el Congreso](https://www.leyes.congreso.gob.pe/Documentos/DecretosLegislativos/00713.pdf).

Fecha de revisión de valores y fuentes: 16 de octubre de 2026. Esta fecha no significa que el contenido se actualice automáticamente.
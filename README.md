# TP5 — Contratación Digital de Seguros

Prototipo responsive de contratación de seguro para celular. Incluye catálogo, cotización, selección de planes, datos personales, pago simulado y resultados de aprobación o rechazo.

**Importante:** el proyecto utiliza Vite para procesar Tailwind CSS v4 y Basecoat CSS. Por eso, no debe ejecutarse abriendo `index.html` directamente ni mediante la extensión Live Server. Se debe iniciar con los comandos de Vite indicados abajo.

No hay backend ni cobro real.

## Tecnologías

- HTML5 semántico.
- Tailwind CSS v4 mediante `@tailwindcss/vite`.
- Basecoat CSS, tema Vega.
- JavaScript vanilla con módulos ES.
- Vite para desarrollo y compilación.

## Requisitos previos

- [Node.js](https://nodejs.org/) 20.19+ o 22.12+.
- npm (se instala junto con Node.js).
- Visual Studio Code (recomendado).

Para comprobar que Node.js y npm están instalados, abrí una terminal y ejecutá:

```bash
node -v
npm -v
```

## Cómo descargar y abrir el proyecto

Si todavía no tenés el proyecto en tu computadora, cloná el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```

Reemplazá `URL_DEL_REPOSITORIO` por la dirección real del repositorio de GitHub.

Después, abrí la carpeta del proyecto en Visual Studio Code:

1. Abrí Visual Studio Code.
2. Seleccioná **Archivo → Abrir carpeta**.
3. Elegí la carpeta del proyecto, donde se encuentra `package.json`.

Si ya tenés el proyecto descargado, simplemente abrí esa carpeta.

## Cómo ejecutar el proyecto

**No uses Live Server para este proyecto.** La configuración actual necesita que Vite procese Tailwind CSS y Basecoat. Live Server solo sirve archivos estáticos y no ejecuta ese proceso de compilación.

Seguí estos pasos:

1. Abrí la carpeta principal del proyecto en Visual Studio Code.
2. Abrí una terminal desde **Terminal → Nueva terminal**.
3. Verificá que la terminal esté ubicada en la carpeta donde se encuentra `package.json`.
4. Instalá las dependencias:

```bash
npm install
```

5. Iniciá el servidor de desarrollo:

```bash
npm run dev
```

6. Vite mostrará una dirección local en la terminal, normalmente:

```text
http://localhost:5173/
```

7. Abrí esa dirección en el navegador.

**No cierres la terminal mientras estés trabajando:** el servidor de desarrollo debe permanecer activo.

Para detenerlo, volvé a la terminal y presioná `Ctrl + C`.

### Si modificás el código

Vite actualiza la página automáticamente cuando detecta cambios en los archivos del proyecto. Si no ves una modificación, recargá el navegador.

### Si aparece un error

- Si `npm` no se reconoce, comprobá que Node.js esté instalado y reiniciá VS Code.
- Si aparece un error indicando que no encuentra `package.json`, verificá que abriste la carpeta principal del proyecto.
- Si faltan dependencias, ejecutá nuevamente `npm install`.
- Si el puerto 5173 está ocupado, Vite puede ofrecer otro puerto. Utilizá la dirección que aparezca en la terminal.
- Si los planes no cargan, comprobá que estés ejecutando el proyecto mediante Vite y revisá la consola del navegador.

## Compilar y previsualizar la versión de producción

Para comprobar que el proyecto puede compilarse:

```bash
npm run build
```

Vite genera la versión de producción en la carpeta `dist/`.

Para visualizar esa versión localmente:

```bash
npm run preview
```

Abrí en el navegador la dirección que informe Vite.

## Estructura del proyecto

```text
TP5_seguros_landing/
├── index.html
├── css/
│   └── tokens.css
├── data/
│   └── planes.json
├── js/
│   ├── app.js
│   ├── cotizador.js
│   ├── estado.js
│   ├── pago.js
│   ├── render.js
│   └── validaciones.js
├── referencias/
├── package.json
└── vite.config.js
```

## Decisiones técnicas

- Una única página HTML contiene siete secciones numeradas de `data-step="0"` a `data-step="6"`.
- `js/estado.js` exporta el objeto `solicitud`; sus datos viven en memoria y se pierden al recargar.
- `js/app.js` gestiona navegación, formularios, estado y carga de planes. Las validaciones, el cálculo y el renderizado están separados en módulos.
- Los planes se cargan desde `data/planes.json` con `fetch`. Un error de carga se informa y bloquea la continuación.
- `css/tokens.css` importa Tailwind CSS v4 y Basecoat Vega; Vite los compila en una hoja optimizada.
- La cuota mensual se calcula como `Math.round(valor * tasaAnual / 12 * factorAntiguedad)` y se formatea con `Intl.NumberFormat("es-AR")`.
- `js/pago.js` programa la respuesta del pago con `setTimeout` a 1500 ms. La tarjeta `4111111111111111` se aprueba; `4000000000000002` se rechaza; cualquier otro número válido se aprueba.
- La póliza se genera solo después de una aprobación, con formato `POL-AAAA-NNNNNN` y contador secuencial en la sesión actual. No es una emisión aseguradora real ni un identificador global.
- El rechazo permite reintentar o volver al formulario para cambiar el medio de pago; los demás datos del flujo se conservan.
- Volver al inicio reinicia la solicitud y limpia el estado del pago y la póliza.
- Los datos y tarjetas precargados son ilustrativos; no ingresar datos reales.

## Funcionalidades implementadas

- Catálogo con Celular disponible y Hogar, Bicicleta y Viaje como próximamente.
- Cotización de equipo, planes Básico/Plus/Premium y resumen actualizado.
- Validaciones de equipo, datos personales, términos y campos de tarjeta.
- Navegación con guardas entre los pasos 0–4 y estado de la solicitud conservado durante el recorrido.
- Pago simulado, prevención de envíos duplicados, aprobación, rechazo, reintento y cambio de medio de pago.
- Generación de póliza de demostración únicamente tras aprobación.
- Pantallas de éxito y rechazo conectadas al resultado del pago.

## Verificación disponible

- `npm run build` compila correctamente.
- Se verificaron los tres resultados de cuota de la consigna:
  - `$600.000`, menos de 1 año: `$2.000 / $3.000 / $4.500`.
  - `$600.000`, de 1 a 2 años: `$2.200 / $3.300 / $4.950`.
  - `$1.200.000`, más de 2 años: `$5.000 / $7.500 / $11.250`.
- El repositorio no tiene un comando ni suite de pruebas automatizadas configurados.
- Se probaron en navegador el rechazo con `4000000000000002`, el reintento con datos conservados, la aprobación con `4111111111111111`, la aprobación con otro número válido, el cambio de medio de pago, el bloqueo de envíos duplicados, el acceso protegido a resultados y el reinicio.
- El navegador puede ejecutar el callback de `setTimeout` después de los 1500 ms solicitados; JavaScript no garantiza temporización exacta en tiempo real.

## Capturas y referencias

Captura de la implementación en desktop:

![Pantalla de datos personales en desktop](./referencias/captura-desktop.png)

La captura de la implementación en mobile está pendiente. `referencias/image.png` es la referencia visual parcial de Figma, no una captura de la aplicación:

![Referencia visual parcial de Figma para mobile](./referencias/image.png)

La comparación completa con las vistas Desktop · 1440 y Mobile · 390 queda pendiente.

## Publicación

La aplicación esta desplegada en la infraestructura Netlify.
[LINK](https://segurosonlinefcyt.netlify.app/#exito)

## Bonus

No se comprobó ningún bonus implementado. La interfaz muestra una promoción de “20% OFF” para el primer mes, pero el cálculo y el resumen no aplican ese descuento.

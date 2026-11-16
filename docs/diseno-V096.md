# El Castillo - v0.9.6 - Fix pestañas inferiores

## Problema
En v0.9.5 los botones inferiores Inicio / Pedidos / Clientes / Productos dejaban de responder cuando `js/app.js` fallaba en el `init`.
Causa: toda la navegacion dependia de `app.js`. Si `cargarConfig()` o un `render*` tocaba un elemento que no existia en esa pestaña, el script se caia y ningun boton funcionaba.
Ademas, el fallback en HTML usaba `onclick` inline, bloqueado por la CSP estricta.

## Solucion v0.9.6
1. Nuevo archivo `js/tabs.js` independiente.
   - Carga ANTES que `js/app.js` en `index.html`.
   - No depende de `app.js`. Aunque `app.js` se caiga, las pestañas siguen funcionando.
   - Un solo listener delegado en `document` para `.nav-item` y `#btnCarrito`.
   - `showTab(tab)` muestra `#tab-<nombre>`, marca el boton activo, guarda la pestaña en `localStorage` (`castillo_tab_activa`) y vuelve arriba.
   - Al cargar, restaura la pestaña guardada o `inicio`.
   - Si `app.js` esta vivo, avisa sin romperse: `renderClientesAutomaticos`, `renderListaProductosConfig`, `renderPedidosPendientes` solo si existen (`typeof === 'function'` + `try/catch`).

2. `js/app.js` a prueba de nulos (null-safe).
   - `cargarConfig()` con guardias `if (el)` antes de tocar `negNombre`, `negInfo`, `pedidosPorHojaSelect`, `logoPreview`.
   - `renderClientes`, `renderReporte`, `renderCatalogo` y demas renders con guardias: si el contenedor no existe, retornan sin error.
   - `init` envuelto en `try/catch` para que un fallo no mate toda la app.

3. `index.html`
   - Version `v0.9.6` en badge y `css/styles.css?v=096`.
   - Orden de scripts: `js/tabs.js` primero, luego `js/app.js`.
   - Sin `onclick` inline. Sin `eval`. CSP estricta intacta.

## Archivos de esta version
- `index.html` (M)
- `js/app.js` (M)
- `js/tabs.js` (nuevo)
- `docs/diseno-v096.md` (este archivo)

`css/styles.css` no cambio en v0.9.6, por eso no va en la PR.
`manifest.json` no cambio en v0.9.6, no va en la PR.

## Como verificar (incognito)
1. Abrir la URL de Firebase / GitHub Pages en incognito.
2. Badge dice `v0.9.6`.
3. Tocar cada pestaña inferior: Inicio, Pedidos, Clientes, Productos. Cada una abre su contenido solo, sin mezclar.
4. Recargar: debe volver a la ultima pestaña visitada.
5. Pegar un pedido, Analizar, y probar `Productos > Agregar producto` y `Clientes` con busqueda y filtros de semana.

## Workflow Git
Branch: `version-0.9.6`
Commit: `fix: v0.9.6 tabs.js independiente`
Luego: merge PR, borrar branch, tag `v0.9.6`, deploy Firebase Hosting.

# El Castillo - v0.9.7 - Correccion mal escritos + WhatsApp al cliente

## Problema v0.9.6
1. La correccion `Usar Tomate / Agregar como nuevo` existia como funcion pero nunca aparecia:
   - `parsearTexto()` botaba los productos no reconocidos en silencio (resolverItem -> null, sin registro).
   - `analizarPedido()` nunca llamaba a `mostrarProductosNoReconocidos()`.
   - `mostrarProductosNoReconocidos()` usaba IDs que no existen: `pedidoTexto` y `btnAnalizar`, cuando los reales son `textoInput` y `btnAnalizarPedido`. Por eso el boton Usar no re-analizaba.
   - Catalogo partido en 3 claves: `catalogo_verduleria` (parser), `castillo_catalogo` (Productos), `catalogo` (vieja). Un producto agregado en Productos no lo veia el parser.
2. WhatsApp a medias:
   - Solo usaba `itemsEnRevision` (borrador). Despues de Agregar a la hoja, el borrador se limpia y el boton en Pedidos no hacia nada.
   - Siempre abria `wa.me/?text=` sin telefono, habia que elegir el contacto a mano cada vez.

## Solucion v0.9.7
### A) Mal escritos que si aparecen
- `parsearTexto()` ahora guarda `window._noReconocidosV097 = [{nombre, cantidad, unidad}]` por cada producto que no resuelve.
- `analizarPedido()` llama a `mostrarProductosNoReconocidos()` despues de `renderItemsRevision()`.
- `mostrarProductosNoReconocidos()` corregida: usa `textoInput` + `btnAnalizarPedido`, usa `escapeHtml` (CSP / XSS), muestra cantidad + unidad para no perder el pedido.
- Boton **Usar Tomate**: reemplaza el texto mal escrito en `textoInput` y re-analiza.
- Boton **Agregar como nuevo**: crea el producto altiro en el catalogo unificado (con su unidad) y re-analiza, asi aparece en la revision sin ir a Productos y sin perder cantidad.
- `obtenerCatalogoUnificado()` junta las 3 claves + memoria, dedup por nombre normalizado. `guardarCatalogoUnificado()` escribe en las 3 claves.
- `cargarCatalogo()` y `buscarProductoParecido()` usan el unificado. `initAgregarProductoNuevo()` tambien guarda en unificado, asi el parser lo ve altiro.
- Distancia Levenshtein ya existia: `tomte -> tomate`, `savahoria -> zanahoria`, umbral 1 si <=4 letras, 2 si mas. Alias exacto tiene prioridad.

### B) WhatsApp al cliente desde la hoja
- Nuevo campo opcional en Inicio: `telefonoInput` (ej: 56912345678). Se guarda en `pedido.telefono`.
- `normalizarTelefonoChile()`: 9... -> 569..., 56... se mantiene, 8 digitos -> 569...
- `obtenerTelefonoCliente(nombre)`: busca en ultimo pedido con ese cliente, luego campo actual, luego clientes guardados.
- `construirMensajeWhatsAppHoja()`: arma mensaje desde `pedidosPendientes` (toda la hoja), con cliente, lineas, totales por pedido y total hoja.
- `compartirPorWhatsApp()`: si hay borrador usa borrador, si no usa la hoja. Si hay telefono abre `wa.me/569...?text=`, si no `wa.me/?text=` con selector.
- Boton en Pedidos ahora dice `Enviar por WhatsApp al cliente`.

## Archivos
- `index.html` (M) - badge v0.9.7, `?v=097`, campo telefono, texto boton WhatsApp
- `js/app.js` (M) - fixes arriba
- `docs/diseno-v097.md` (este archivo)

`js/tabs.js` y `css/styles.css` no cambian en v0.9.7, no van en la PR. `manifest.json` no cambia.

## Como probar (en incognito, con datos de prueba)
1. Productos: agrega `Tomate`, kg, $1800, alias `tomates, tomatito`. Debe aparecer en la lista.
2. Inicio: pega `Cliente: Prueba\n2 kg tomte, 1 kg savahoria` + Analizar. Debe salir aviso amarillo con `tomte (2 kg) - Usar Tomate / Agregar como nuevo` y `savahoria - Usar Zanahoria` si zanahoria esta en la base.
3. Toca **Usar Tomate**: el texto se corrige a `tomate` y re-analiza, el item aparece en revision.
4. Prueba Agregar como nuevo: pega `2 kg pepinope` (inventado), toca Agregar como nuevo. Debe agregarse y aparecer en revision, y en Productos debe salir `pepinope`.
5. Pedidos: agrega 1 pedido a la hoja con telefono `56912345678`, toca **Enviar por WhatsApp al cliente**. Debe abrir `wa.me/56912345678?text=...` con el resumen. Sin telefono, abre selector.
6. Tabs: Inicio / Pedidos / Clientes / Productos siguen independientes (regression v0.9.6).

## Workflow Git
Branch: `version-0.9.7`
Commit: `feat: v0.9.7 correccion mal escritos + WhatsApp al cliente`
Luego: merge PR, borrar branch, tag `v0.9.7`, deploy Firebase Hosting.

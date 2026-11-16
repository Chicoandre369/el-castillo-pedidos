# El Castillo - v0.9.8 - WhatsApp por pedido (no toda la hoja al mismo cliente)

## Problema v0.9.7 (reportado en tienda)
- El boton global en Pedidos mandaba TODA la hoja al PRIMER cliente de la hoja.
- Si la hoja tenia Cristian + Maria, siempre abria WhatsApp de Cristian (56972087822 en la foto), aunque se quisiera enviar a Maria.
- Causa: `construirMensajeWhatsApp()` para la hoja hacia `obtenerTelefonoCliente(pedidosPendientes[0].cliente)` -> siempre el primero.
- Ademas, el boton en Pedidos decia `Compartir WhatsApp` aunque en index.html decia otra cosa: `agruparAccionesPrincipales()` lo sobreescribia.

## Solucion v0.9.8
### 1) Boton por cada pedido (lo principal)
- Cada tarjeta en Pedidos ahora tiene: `Editar | Eliminar | Enviar a {Cliente} · {telefono o sin telefono}`.
- `enviarWhatsAppPedido(i)`:
  - Arma mensaje SOLO con ese pedido.
  - Telefono: primero `pedido.telefono` (el que se escribio al crear ESE pedido), si no tiene, busca por nombre (cliente repetido).
  - Si tiene telefono: abre `wa.me/569...?text=...` directo a esa persona.
  - Si no tiene: abre `wa.me/?text=...` con selector, y avisa que elijas a ese cliente.
- Cableado en la delegacion `data-action`: `enviarWhatsAppPedido` agregado al mapa `acciones`.

### 2) Boton global ya no se equivoca
- Renombrado a `Enviar toda la hoja` (en index.html y en `agruparAccionesPrincipales()`).
- Si la hoja tiene >1 cliente distinto, NO elige el primero: abre selector y avisa `La hoja tiene X clientes distintos. Usa el boton verde de cada pedido`.
- Si la hoja tiene 1 solo cliente, sigue abriendo directo a el.

### 3) Editar recupera el telefono correcto
- `editarPedidoPendiente()` ahora rellena `telefonoInput` con `p.telefono` de ESE pedido. Antes lo dejaba vacio y al guardar se perdia.

## Archivos
- `index.html` (M) - badge v0.9.8, `?v=098`, boton global `Enviar toda la hoja`
- `js/app.js` (M) - fixes arriba
- `docs/diseno-v098.md` (este archivo)

`js/tabs.js` y `css/styles.css` no cambian.

## Como probar
1. Inicio: pedido 1: Cliente `Cristian`, telefono `972087822`, pedido `2 kilos de tomates`. Agregar a la hoja.
2. Inicio: pedido 2: Cliente `Maria`, telefono `981112233`, pedido `1 kg palta`. Agregar a la hoja.
3. Pedidos: deben verse 2 tarjetas, cada una con su boton `Enviar a Cristian` y `Enviar a Maria`.
4. Toca `Enviar a Maria`: debe abrir `wa.me/56981112233` con SOLO el pedido de Maria, no el de Cristian.
5. Toca `Enviar a Cristian`: debe abrir `wa.me/56972087822` con SOLO el de Cristian.
6. Toca `Enviar toda la hoja`: debe avisar que hay 2 clientes y abrir selector (no mandar todo a Cristian).
7. Pedido sin telefono: crea pedido `Pedro` sin telefono, toca `Enviar a Pedro`: debe abrir selector y decir que elijas a Pedro.

## Workflow Git
Branch: `version-0.9.8`
Commit: `feat: v0.9.8 WhatsApp por pedido`
Luego: merge PR, borrar branch, tag `v0.9.8`, deploy Firebase Hosting.

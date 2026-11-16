# v0.8.1 Reescritura limpia 1:1 referencia

Problema v0.8.0: se parcho HTML viejo con 10 secciones, 3 headers, CSS no aplicaba y logo quedaba gigante (1200px) porque sin CSS no habia limite.

Fix v0.8.1:
- index.html reescrito de cero, max-width 520px como la foto, solo 1 header, 1 card Nuevo Pedido, 1 card Pedidos, resto colapsado en details
- Logo con style inline width:54px height:54px max 54px, nunca mas gigante aunque falle CSS
- Tarjeta pedido exactamente como foto: avatar, nombre grande, fecha badge, productos con emoji + badge kg a la derecha, totales en badges, Compartir WhatsApp + Generar Word lado a lado, Editar/Eliminar en fila
- Bottom nav fija con 4 tabs, scroll suave
- CSS propio en css/styles.css, sin Tailwind CDN por CSP

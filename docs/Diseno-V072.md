# v0.7.2 Fix diseno

Problema v0.7.1: habia 2 headers con logo - topbar + header original con class="logo" sin estilo, el navegador lo mostraba gigante y empujaba todo a una columna angosta.

Fix:
- Eliminado <header class="header"><img class="logo"> duplicado, reemplazado por div .pedidos-head con texto PEDIDOS
- CSS: img.logo max 48px !important para que nunca mas se agrande
- Section/details ahora son cards blancas como prototipo (antes eran texto plano chico)
- Wrap 860px, inputs y botones mas grandes, legible en celular y PC
- Se mantiene: WhatsApp share, PWA, logo chico en topbar

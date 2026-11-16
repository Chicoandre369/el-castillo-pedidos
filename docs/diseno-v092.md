# v0.9.2 Fix Config con inline styles

Problema: Pedidos ya quedo limpio en v0.9.1, pero Config seguia apretado porque el fix estaba en CSS y el celular tenia CSS viejo en cache.
Fix: Config reescrita con div.field + label/input con style inline display:block width:100% padding:12px, no depende de CSS. Catalogo apilado en columna, no 4 columnas. Ademas css/js con ?v=092 para romper cache.

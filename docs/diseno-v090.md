# v0.9.0 Tabs independientes

- Inicio: solo Nuevo Pedido (cliente, textarea, Analizar, revision)
- Pedidos: solo hoja actual (Compartir WhatsApp, Generar Word, Vaciar) + Historial
- Estadisticas: solo Reporte del dia, se recalcula al entrar
- Configuracion: solo Datos negocio + Catalogo + Clientes, visibles sin details colapsados
- showTab() muestra solo 1 tab, oculta resto, scroll arriba, guarda tab en localStorage
- Al agregar pedido -> salta a Pedidos. Al Editar -> vuelve a Inicio. Carrito -> Pedidos
- Sin cambiar IDs, CSP ni logica de Word/WhatsApp

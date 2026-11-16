# v0.9.4 CORREGIDA

- Configuracion -> Productos: solo Agregar producto nuevo (nombre, unidad, precio, alias). Sin Datos del negocio (fijo El Castillo).
- Producto nuevo queda en castillo_catalogo y se reconoce en el proximo pedido.
- Producto mal escrito: buscarProductoParecido con normalizacion sin tildes + Levenshtein (1-2 letras). Aviso con botones Usar sugerencia / Agregar como nuevo.
- Estadisticas -> Clientes: lista automatica desde pedidos, sin carga manual. Filtros Todas / Esta semana / Semana anterior, buscador, top 3 productos que siempre lleva, localidad/telefono/correo, total y ultimo pedido. Boton Nuevo pedido para ese cliente.
- Reporte del dia queda abajo en Clientes, sin borrarlo.

/* El Castillo de la Fruta - v0.2.0 - Logica extraida de index.html original (v0.1.0)
   Seguridad v0.5.0 + Fix lectura corrida v0.5.1: CSP estricta sin inline handlers, validacion, allowlist. sin eval, sin document.write, escapeHtml en renders, CSP en index.html.
   Datos: localStorage (pedidos, catalogo, clientes, historial) - no se suben a Git. */
let catalogo = [];
let pedidosPendientes = [];
let itemsEnRevision = [];
let clientes = [];
let historialPedidos = [];
let ventasLog = [];
let config = {nombreNegocio:'', infoNegocio:'', logo:null, pedidosPorHoja:3};
let editingIndex = null;

function fechaLocalISO(d){
  d = d || new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off*60000);
  return local.toISOString().slice(0,10);
}

// ---------- Persistencia del catálogo ----------
// v1.0.10: catalogo unificado - junta las 3 claves que uso la app en el tiempo
// catalogo_verduleria (principal) + castillo_catalogo (Productos) + catalogo (vieja)
// Sin esto, un producto agregado en Productos no lo veia el parser.
function leerListaCatalogo(clave){
  try{ const v = localStorage.getItem(clave); if(!v) return []; const a = JSON.parse(v); return Array.isArray(a) ? a : []; }catch(e){ return []; }
}
function obtenerCatalogoUnificado(){
  const visto = new Set(); const out = [];
  const todas = [].concat(leerListaCatalogo('catalogo_verduleria'), leerListaCatalogo('castillo_catalogo'), leerListaCatalogo('catalogo'));
  // Tambien lo que ya esta en memoria
  if(Array.isArray(catalogo)) todas.push.apply(todas, catalogo);
  for(const p of todas){
    const k = normTxt(p.nombre || p.name || '');
    if(!k || visto.has(k)) continue;
    visto.add(k); out.push(p);
  }
  return out;
}
function guardarCatalogoUnificado(lista){
  try{ localStorage.setItem('catalogo_verduleria', JSON.stringify(lista)); }catch(e){}
  try{ localStorage.setItem('castillo_catalogo', JSON.stringify(lista)); }catch(e){}
  try{ localStorage.setItem('catalogo', JSON.stringify(lista)); }catch(e){}
  catalogo = lista.slice();
}
function cargarCatalogo(){
  try{ catalogo = obtenerCatalogoUnificado(); }catch(e){ catalogo = []; }
  try{ renderCatalogo(); }catch(e){}
}
function guardarCatalogo(){
  try{
    localStorage.setItem('catalogo_verduleria', JSON.stringify(catalogo));
  }catch(e){
    console.error('No se pudo guardar el catálogo', e);
  }
}

// ---------- Persistencia de config del negocio ----------
function cargarConfig(){
  try{
    const val = localStorage.getItem('config_negocio_verduleria');
    if(val) config = Object.assign(config, JSON.parse(val));
  }catch(e){}
  const _nN = document.getElementById('negNombre'); if(_nN) _nN.value = config.nombreNegocio || '';
  const _nI = document.getElementById('negInfo'); if(_nI) _nI.value = config.infoNegocio || '';
  const _pH = document.getElementById('pedidosPorHojaSelect'); if(_pH) _pH.value = config.pedidosPorHoja || 3;
  const _lP = document.getElementById('logoPreview'); if(_lP && config.logo){ _lP.src = config.logo; _lP.style.display = 'block'; }
  // logo ya manejado arriba con guard (v1.0.10)
}
function guardarConfig(){
  try{ localStorage.setItem('config_negocio_verduleria', JSON.stringify(config)); }catch(e){}
}
function actualizarNombreNegocio(){
  const _a=document.getElementById('negNombre'); if(_a) config.nombreNegocio = _a.value.trim();
  guardarConfig();
}
function actualizarInfoNegocio(){
  const _b=document.getElementById('negInfo'); if(_b) config.infoNegocio = _b.value.trim();
  guardarConfig();
}
function actualizarPedidosPorHoja(){
  const _c=document.getElementById('pedidosPorHojaSelect'); if(_c) config.pedidosPorHoja = parseInt(_c.value) || 3;
  guardarConfig();
  renderPedidosPendientes();
}
function cargarLogo(input){
  const file = input.files && input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    config.logo = e.target.result;
    guardarConfig();
    const prev = document.getElementById('logoPreview');
    prev.src = config.logo; prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
}
function quitarLogo(){
  config.logo = null;
  guardarConfig();
  const prev = document.getElementById('logoPreview');
  prev.src = ''; prev.style.display = 'none';
}

// ---------- Persistencia de pedidos pendientes (hoja actual) ----------
function cargarPedidosPendientes(){
  try{
    const val = localStorage.getItem('pedidos_pendientes_verduleria');
    if(val) pedidosPendientes = JSON.parse(val);
  }catch(e){
    pedidosPendientes = [];
  }
}
function guardarPedidosPendientes(){
  try{ localStorage.setItem('pedidos_pendientes_verduleria', JSON.stringify(pedidosPendientes)); }catch(e){}
}

// ---------- Clientes ----------
function cargarClientes(){
  try{
    const val = localStorage.getItem('clientes_verduleria');
    if(val) clientes = JSON.parse(val);
  }catch(e){
    clientes = [];
  }
  renderClientes();
  renderClientesDatalist();
}
function guardarClientes(){
  try{ localStorage.setItem('clientes_verduleria', JSON.stringify(clientes)); }catch(e){}
}
function buscarCliente(nombre){
  const n = normalizarTexto(nombre);
  return clientes.find(c => normalizarTexto(c.nombre) === n);
}
function renderClientesDatalist(){
  const _dl = document.getElementById('clientesDatalist'); if(!_dl && !document.getElementById('clienteInput')) return;
  const dl = document.getElementById('clientesDatalist');
  if(dl) dl.innerHTML = clientes.map(c => `<option value="${escapeHtml(c.nombre)}">`).join('');
}
function agregarCliente(){
  const nombre = document.getElementById('cliNombre').value.trim();
  const direccion = document.getElementById('cliDireccion').value.trim();
  const telefono = document.getElementById('cliTelefono').value.trim();
  if(!nombre) return;
  let c = buscarCliente(nombre);
  if(c){
    c.direccion = direccion;
    c.telefono = telefono;
  } else {
    clientes.push({nombre, direccion, telefono, deuda: 0});
  }
  document.getElementById('cliNombre').value = '';
  document.getElementById('cliDireccion').value = '';
  document.getElementById('cliTelefono').value = '';
  renderClientes();
  renderClientesDatalist();
  guardarClientes();
}
function eliminarCliente(i){
  clientes.splice(i, 1);
  renderClientes();
  renderClientesDatalist();
  guardarClientes();
}
function abonarDeuda(i){
  const val = prompt('Monto a abonar (resta de la deuda):', '0');
  const monto = parseFloat(val);
  if(!monto || monto <= 0) return;
  clientes[i].deuda = Math.max(0, (clientes[i].deuda || 0) - monto);
  renderClientes();
  guardarClientes();
}
function renderClientes(){
  const cont = document.getElementById('clientesLista');
  const _cc = document.getElementById('cliCount'); if(_cc) _cc.textContent = clientes.length;
  if(!cont) return; // v1.0.10: Clientes manual ya no existe, no tumbar app.js
  if(clientes.length === 0){
    cont.innerHTML = '<p class="empty-hint">Aún no agregas clientes.</p>';
    return;
  }
  cont.innerHTML = clientes.map((c, i) => `
    <div class="cliente-row">
      <div>
        <b>${escapeHtml(c.nombre)}</b>
        <div class="cliente-sub">${escapeHtml(c.direccion || '-')}${c.telefono ? ' · ' + escapeHtml(c.telefono) : ''}</div>
      </div>
      <div class="cliente-deuda ${c.deuda > 0 ? 'con-deuda' : ''}">$${Math.round(c.deuda || 0).toLocaleString('es-CL')}</div>
      <div class="cliente-actions">
        <button class="btn-ghost btn-small" data-action="abonarDeuda" data-index="${i}">Abonar</button>
        <button class="icon-btn" data-action="eliminarCliente" data-index="${i}" title="Eliminar">✕</button>
      </div>
    </div>
  `).join('');
}

// ---------- Historial de documentos generados ----------
function cargarHistorial(){
  try{
    const val = localStorage.getItem('historial_pedidos_verduleria');
    if(val) historialPedidos = JSON.parse(val);
  }catch(e){
    historialPedidos = [];
  }
  renderHistorial();
}
function guardarHistorial(){
  try{ localStorage.setItem('historial_pedidos_verduleria', JSON.stringify(historialPedidos)); }catch(e){}
}
function renderHistorial(){
  const cont = document.getElementById('historialLista');
  const empty = document.getElementById('historialEmpty');
  document.getElementById('historialCount').textContent = historialPedidos.length;
  if(historialPedidos.length === 0){
    cont.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  cont.innerHTML = historialPedidos.map((h, i) => {
    const fechaTxt = new Date(h.fecha).toLocaleString('es-CL');
    const totD = h.pedidos.reduce((a, p) => a + p.items.reduce((a2, it) => a2 + it.precio, 0), 0);
    return `
      <div class="historial-row">
        <div>
          <b>${fechaTxt}</b>
          <div class="cliente-sub">${h.pedidos.length} pedido(s)${totD > 0 ? ' · $' + Math.round(totD).toLocaleString('es-CL') : ''}</div>
        </div>
        <div class="cliente-actions">
          <button class="btn-secondary btn-small" data-action="reimprimirHistorial" data-index="${i}">Reimprimir</button>
          <button class="icon-btn" data-action="eliminarHistorial" data-index="${i}" title="Eliminar">✕</button>
        </div>
      </div>
    `;
  }).reverse().join('');
}
function eliminarHistorial(i){
  historialPedidos.splice(i, 1);
  renderHistorial();
  guardarHistorial();
}
function reimprimirHistorial(i){
  generarWordDesdeLista(historialPedidos[i].pedidos);
}

// ---------- Registro de ventas / reporte del día ----------
function cargarVentasLog(){
  try{
    const val = localStorage.getItem('ventas_log_verduleria');
    if(val) ventasLog = JSON.parse(val);
  }catch(e){
    ventasLog = [];
  }
}
function guardarVentasLog(){
  try{ localStorage.setItem('ventas_log_verduleria', JSON.stringify(ventasLog)); }catch(e){}
}
function registrarVenta(pedido){
  const total = pedido.items.reduce((a, it) => a + it.precio, 0);
  ventasLog.push({diaISO: pedido.diaISO, cliente: pedido.cliente, items: pedido.items, total});
  guardarVentasLog();
}
function renderReporte(){
  const fechaEl = document.getElementById('reporteFecha');
  if(!fechaEl) return; // v1.0.10 guard
  const dia = fechaEl.value || fechaLocalISO();
  const ventasDia = ventasLog.filter(v => v.diaISO === dia);
  const totalVendido = ventasDia.reduce((a, v) => a + v.total, 0);

  const _rr = document.getElementById('reporteResumen'); if(_rr) _rr.innerHTML = `
    <div class="totales">
      <span><b>${ventasDia.length}</b> pedido(s)</span>
      <span><b>$${Math.round(totalVendido).toLocaleString('es-CL')}</b> vendido</span>
    </div>
  `;

  const conteo = {};
  ventasDia.forEach(v => v.items.forEach(it => {
    conteo[it.producto] = (conteo[it.producto] || 0) + it.cantidad;
  }));
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const cont = document.getElementById('reporteTop');
  if(!cont) return;
  if(top.length === 0){
    cont.innerHTML = '<p class="empty-hint">Sin ventas registradas ese día.</p>';
  } else {
    cont.innerHTML = '<ol style="padding-left:18px;margin:6px 0;font-size:0.85rem;">' +
      top.map(([nombre, cant]) => `<li>${escapeHtml(nombre)} — ${cant}</li>`).join('') +
      '</ol>';
  }
}

// ---------- Exportar a CSV / Excel ----------
function descargarCSV(filename, filas){
  const csv = filas.map(f => f.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function exportarCatalogoCSV(){
  const filas = [['Producto', 'Unidad', 'Precio'], ...catalogo.map(p => [p.nombre, p.unidad, p.precio])];
  descargarCSV('catalogo_verduleria.csv', filas);
}
function exportarBaseDatosCSV(){
  const filas = [['Producto', 'Unidad por defecto', 'Alias reconocidos'], ...PRODUCTOS_DB.map(p => [p.nombre, p.unidad, p.alias.join(' | ')])];
  descargarCSV('base_datos_productos.csv', filas);
}

function renderCatalogo(){
  const cont = document.getElementById('catalogoLista');
  const _cc = document.getElementById('catCount'); if(_cc) _cc.textContent = catalogo.length;
  const _cc2 = document.getElementById('catCount2'); if(_cc2) _cc2.textContent = catalogo.length;
  if(!cont) return;
  if(catalogo.length === 0){
    cont.innerHTML = '<p class="empty-hint">Aún no agregas productos.</p>';
    return;
  }
  const buscarEl = document.getElementById('catBuscar');
  const filtro = buscarEl ? normalizarTexto(buscarEl.value) : '';
  const lista = filtro ? catalogo.filter(p => normalizarTexto(p.nombre).includes(filtro)) : catalogo;
  if(lista.length === 0){
    cont.innerHTML = '<p class="empty-hint">Sin resultados para tu búsqueda.</p>';
    return;
  }
  cont.innerHTML = lista.map((p) => {
    const i = catalogo.indexOf(p);
    return `
    <div class="catalogo-row" style="grid-template-columns:1fr 78px 70px auto;">
      <span style="font-size:0.85rem;">${escapeHtml(p.nombre)}</span>
      <span style="font-size:0.8rem;color:#8a8371;">${p.unidad}</span>
      <span style="font-size:0.8rem;color:#8a8371;">${p.precio>0 ? '$'+p.precio : '-'}</span>
      <button class="icon-btn" data-action="eliminarProductoCatalogo" data-index="${i}" title="Eliminar">✕</button>
    </div>
  `;
  }).join('');
}

function agregarProductoCatalogo(){
  const nombre = document.getElementById('catNombre').value.trim();
  const unidad = document.getElementById('catUnidad').value;
  const precio = parseFloat(document.getElementById('catPrecio').value) || 0;
  if(!nombre) return;
  catalogo.push({nombre, unidad, precio});
  document.getElementById('catNombre').value = '';
  document.getElementById('catPrecio').value = '';
  renderCatalogo();
  guardarCatalogo();
}
function eliminarProductoCatalogo(i){
  catalogo.splice(i,1);
  renderCatalogo();
  guardarCatalogo();
}

// ---------- Base de datos de productos ----------
// Formato: [nombre mostrado, unidad por defecto ('kg'|'g'|'unidad'), alias / formas de escribirlo]
const PRODUCTOS_DB_RAW = [
  // --- Verduras ---
  ['Tomate','kg',['tomate','tomates','tomatito','tomatitos']],
  ['Tomate cherry','unidad',['tomate cherry','tomates cherry','cherry']],
  ['Lechuga','unidad',['lechuga','lechugas']],
  ['Lechuga marina','unidad',['lechuga marina','lechugas marinas']],
  ['Lechuga escarola','unidad',['lechuga escarola','escarola']],
  ['Lechuga costina','unidad',['lechuga costina','costina']],
  ['Zapallo italiano','unidad',['zapallo italiano','zapallos italianos','zapallito italiano','zucchini']],
  ['Zapallo camote','kg',['zapallo camote','zapallo']],
  ['Choclo','unidad',['choclo','choclos','maiz']],
  ['Repollo','unidad',['repollo','repollos']],
  ['Repollo morado','unidad',['repollo morado','col morada']],
  ['Pepino','unidad',['pepino','pepinos','pepino ensalada']],
  ['Pepino ensalada','unidad',['pepino ensalada']],
  ['Pimentón rojo','unidad',['pimenton rojo','pimentones rojos','pimiento rojo','pimentones']],
  ['Pimentón verde','unidad',['pimenton verde','pimentones verdes','pimiento verde','pimentones']],
  ['Pimentón amarillo','unidad',['pimenton amarillo','pimentones amarillos','pimiento amarillo','pimentones']],
  ['Ají verde','kg',['aji verde','ajies verdes','aji']],
  ['Ají cristal','kg',['aji cristal']],
  ['Berenjena','unidad',['berenjena','berenjenas']],
  ['Betarraga','unidad',['betarraga','betarragas','beterraga','beterragas']],
  ['Cebolla','unidad',['cebolla','cebollas']],
  ['Cebolla morada','unidad',['cebolla morada','cebollas moradas']],
  ['Cebollín','unidad',['cebollin','cebollines']],
  ['Puerro','unidad',['puerro','puerros']],
  ['Ajo','unidad',['ajo','ajos','cabeza de ajo','cabezas de ajo']],
  ['Apio','unidad',['apio','apios']],
  ['Acelga','unidad',['acelga','acelgas']],
  ['Espinaca','unidad',['espinaca','espinacas']],
  ['Brócoli','unidad',['brocoli','brocolis','brócoli']],
  ['Coliflor','unidad',['coliflor','coliflores']],
  ['Zanahoria','kg',['zanahoria','zanahorias']],
  ['Rabanito','unidad',['rabanito','rabanitos','rabano','rábano']],
  ['Poroto verde','kg',['poroto verde','porotos verdes','poroto granado','porotos granados']],
  ['Arveja','kg',['arveja','arvejas']],
  ['Haba','kg',['haba','habas']],
  ['Alcachofa','unidad',['alcachofa','alcachofas']],
  ['Espárrago','unidad',['esparrago','esparragos','espárrago']],
  ['Champiñón','kg',['champiñon','champiñones','champinon','champinones','hongo','hongos']],
  ['Cilantro','unidad',['cilantro','culantro']],
  ['Perejil','unidad',['perejil']],
  ['Albahaca','unidad',['albahaca']],
  ['Orégano','unidad',['oregano','orégano']],
  ['Menta','unidad',['menta']],
  ['Romero','unidad',['romero']],
  ['Jengibre','kg',['jengibre']],
  ['Papa','kg',['papa','papas']],
  ['Camote','kg',['camote','camotes','batata']],
  ['Alcachofa','unidad',['alcachofa','alcachofas','alcachofa de corte']],

  // --- Frutas ---
  ['Palta','kg',['palta','paltas','palta hass','aguacate']],
  ['Plátano','kg',['platano','platanos','plátano','plátanos','banana','bananas','concha de platano','concha de platanos','conchas de platano','conchas de platanos']],
  ['Manzana','kg',['manzana','manzanas']],
  ['Naranja','kg',['naranja','naranjas']],
  ['Mandarina','kg',['mandarina','mandarinas']],
  ['Limón','kg',['limon','limones','limón']],
  ['Pomelo','kg',['pomelo','pomelos']],
  ['Pera','kg',['pera','peras']],
  ['Uva','kg',['uva','uvas']],
  ['Sandía','unidad',['sandia','sandias','sandía']],
  ['Melón','unidad',['melon','melones','melón']],
  ['Piña','unidad',['piña','piñas','pina','pinas']],
  ['Kiwi','kg',['kiwi','kiwis']],
  ['Durazno','kg',['durazno','duraznos']],
  ['Nectarín','kg',['nectarin','nectarines','nectarín']],
  ['Ciruela','kg',['ciruela','ciruelas']],
  ['Frutillas','unidad',['frutilla','frutillas']],
  ['Arándanos','unidad',['arandano','arandanos','arándano','arándanos']],
  ['Frambuesas','unidad',['frambuesa','frambuesas']],
  ['Moras','unidad',['mora','moras']],
  ['Mango','kg',['mango','mangos']],
  ['Papaya','kg',['papaya','papayas']],
  ['Chirimoya','kg',['chirimoya','chirimoyas']],
  ['Granada','kg',['granada','granadas']],
  ['Membrillo','kg',['membrillo','membrillos']],
  ['Higo','kg',['higo','higos']],
  ['Damasco','kg',['damasco','damascos']],

  // --- Frutos secos ---
  ['Nuez','kg',['nuez','nueces']],
  ['Almendra','kg',['almendra','almendras']],
  ['Maní','kg',['mani','manies','maní']],
  ['Avellana','kg',['avellana','avellanas']],
  ['Castaña','kg',['castaña','castañas']],
  ['Pasas','kg',['pasas','pasas de uva']],
  ['Ciruela seca','kg',['ciruela seca','ciruelas secas']],

  // --- Huevos ---
  ['Huevos','unidad',['huevo','huevos']],

  // --- Otros / productos habituales ---
  ['Dulces','unidad',['dulce','dulces']],
  ['Miel','unidad',['miel']],
  ['Palmitos','unidad',['palmito','palmitos']],
  ['Aceituna','unidad',['aceituna','aceitunas']],
  ['Choclo desgranado','kg',['choclo desgranado','choclo en grano']],
  ['Pepinillos','unidad',['pepinillo','pepinillos','pepinillo dill','pepinillos dill','pepino encurtido','pepinos encurtidos']],
  ['Ají escabeche','unidad',['aji escabeche','ajies escabeche','aji en escabeche','aji escabechado']],
  ['Cebolla escabeche','unidad',['cebolla escabeche','cebollas escabeche','cebolla en escabeche','cebolla escabechada']],

  // --- Embutidos / cecinas ---
  ['Jamón','unidad',['jamon','jamones']],
  ['Jamón de pavo','unidad',['jamon de pavo','jamon pavo']],
  ['Salchichas','unidad',['salchicha','salchichas','vienesa','vienesas']],
  ['Mortadela','unidad',['mortadela','mortadelas']],
  ['Salame','unidad',['salame','salames','salami']],
  ['Chorizo','unidad',['chorizo','chorizos']],
  ['Longaniza','unidad',['longaniza','longanizas']],
  ['Queso de cabeza','unidad',['queso de cabeza']],
  ['Arrollado','unidad',['arrollado','arrollados','arrollado huaso']],
  ['Paté','unidad',['pate','patés','pates']],
  ['Tocino','unidad',['tocino','tocinos']],
  ['Panceta','unidad',['panceta','pancetas']],
  ['Prietas','unidad',['prieta','prietas']],
  ['Queso mantecoso','unidad',['queso mantecoso']],
];
// El 4º elemento (opcional, no usado por ahora en ningún producto) permite
// configurar una EXCEPCIÓN puntual a la regla "cantidad sin unidad = unidad":
// ej. ['Papa','kg',['papa','papas'],'kg'] haría que "5 papas" se interprete
// como 5 kg en vez de 5 unidades. Si se omite, se aplica la regla general.
const PRODUCTOS_DB = PRODUCTOS_DB_RAW.map(([nombre, unidad, alias, reglaCantidadSinUnidad]) => ({
  nombre,
  // Unidad por defecto cuando el producto se escribe SOLO por su nombre,
  // sin cantidad ni unidad (ej: "Papa" -> 1 kg; "Lechuga" -> 1 unidad).
  unidad,
  siempreUnidad: unidad === 'unidad',
  // Unidad a usar cuando el cliente SÍ escribe una cantidad numérica pero
  // sin especificar la unidad (ej: "5 plátanos"). null = usar la regla
  // general (unidad), salvo que se configure una excepción arriba.
  reglaCantidadSinUnidad: reglaCantidadSinUnidad || null,
  alias: [...new Set(alias.map(normalizarTexto))]
}));

function normalizarTexto(s){
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}

function buscarEnBaseDatos(texto){
  const n = normalizarTexto(texto);
  let mejor = null, mejorLen = 0;
  for(const p of PRODUCTOS_DB){
    for(const alias of p.alias){
      if(!alias) continue;
      // límites de palabra: evita que alias cortos (ej: "ajo") coincidan dentro de otra palabra (ej: "trabajo")
      const patron = new RegExp('(^|[^a-záéíóúñ0-9])' + alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-záéíóúñ0-9])');
      if(patron.test(n) && alias.length > mejorLen){
        mejor = p; mejorLen = alias.length;
      }
    }
  }
  return mejor;
}

// ---------- Parseo del pedido pegado ----------
function normUnit(tok){
  if(!tok) return null;
  tok = tok.toLowerCase();
  if(tok.startsWith('k')) return 'kg';
  if(tok.startsWith('g')) return 'g';
  if(tok.startsWith('u')) return 'unidad';
  return null;
}
function capitalize(s){
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function buscarEnCatalogo(nombreProducto){
  const n = normalizarTexto(nombreProducto);
  return catalogo.find(p => {
    const pn = normalizarTexto(p.nombre);
    return n.includes(pn) || pn.includes(n);
  });
}

// Convierte fracciones escritas ("1/2", "1 1/2", "½", "1 ½") en su valor
// decimal equivalente (0.5, 1.5, etc.), dejando el resto de la línea intacta.
function convertirFracciones(linea){
  const simbolos = {'½':0.5,'¼':0.25,'¾':0.75,'⅓':1/3,'⅔':2/3,'⅕':0.2,'⅖':0.4,'⅗':0.6,'⅘':0.8};
  const redondear = (n) => Math.round(n * 1000) / 1000;

  // "1 ½" (entero + símbolo de fracción)
  linea = linea.replace(/(\d+)\s+([½¼¾⅓⅔⅕⅖⅗⅘])/g, (m, entero, simb) =>
    String(redondear(parseInt(entero, 10) + simbolos[simb]))
  );
  // "½" solo
  linea = linea.replace(/([½¼¾⅓⅔⅕⅖⅗⅘])/g, (m, simb) => String(simbolos[simb]));
  // "1 1/2" (fracción mixta con espacio)
  linea = linea.replace(/(\d+)\s+(\d+)\/(\d+)/g, (m, entero, num, den) => {
    const d = parseInt(den, 10);
    if(d === 0) return m;
    return String(redondear(parseInt(entero, 10) + parseInt(num, 10) / d));
  });
  // "1/2" (fracción simple, sin número pegado antes)
  linea = linea.replace(/(^|[^\d.])(\d+)\/(\d+)/g, (m, pre, num, den) => {
    const d = parseInt(den, 10);
    if(d === 0) return m;
    return pre + String(redondear(parseInt(num, 10) / d));
  });
  return linea;
}

function extraerCantidadYUnidad(texto){
  const unidadTok = '(kgs?|kilos?|k|grs?|gramos?|uds?|unid(?:ades)?|un|u)';
  let m;

  // 1) "5 kg de papa", "2 kilos de manzana"
  m = texto.match(new RegExp('^(\\d+(?:[.,]\\d+)?)\\s*' + unidadTok + '\\.?\\s*(?:de\\s+)?(.+)$', 'i'));
  if(m){
    return {
      cantidad: parseFloat(m[1].replace(',', '.')),
      unidad: normUnit(m[2]),
      producto: m[3].trim(),
      cantidadExplicita: true
    };
  }

  // 2) "papa 5 kg", "manzana 2 kilos"
  m = texto.match(new RegExp('^(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*' + unidadTok + '\\.?$', 'i'));
  if(m){
    return {
      cantidad: parseFloat(m[2].replace(',', '.')),
      unidad: normUnit(m[3]),
      producto: m[1].trim(),
      cantidadExplicita: true
    };
  }

  // 3) "5 papa", "3 tomates", "5 plátanos"
  m = texto.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/i);
  if(m){
    return {
      cantidad: parseFloat(m[1].replace(',', '.')),
      unidad: null,
      producto: m[2].trim(),
      cantidadExplicita: true
    };
  }

  // 4) "papa x5", "tomates x 3 kg"
  m = texto.match(new RegExp('^(.+?)\\s*[xX×]\\s*(\\d+(?:[.,]\\d+)?)\\s*' + unidadTok + '?\\.?$', 'i'));
  if(m){
    return {
      cantidad: parseFloat(m[2].replace(',', '.')),
      unidad: normUnit(m[3]),
      producto: m[1].trim(),
      cantidadExplicita: true
    };
  }

  // 5) Solo nombre: "lechuga", "papa"
  return {
    cantidad: null,
    unidad: null,
    producto: texto.trim(),
    cantidadExplicita: false
  };
}

function limpiarProductoExtraido(producto){
  return producto
    .replace(/^[.\-–—\s]+|[.\-–—\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectarProductoEnTexto(texto){
  const matchCatalogo = buscarEnCatalogo(texto);
  const matchBase = buscarEnBaseDatos(texto);
  if(!matchCatalogo && !matchBase) return null;

  const base = matchBase || null;
  const cat = matchCatalogo || null;
  return {
    catalogo: cat,
    base,
    nombre: cat ? cat.nombre : base.nombre
  };
}

function resolverItem(productoTexto, cantidad, unidad, cantidadExplicita){
  const textoLimpio = limpiarProductoExtraido(productoTexto);
  if(!textoLimpio) return null;

  const encontrado = detectarProductoEnTexto(textoLimpio);
  if(!encontrado) return null;

  const catMatch = encontrado.catalogo;
  const baseMatch = encontrado.base;

  let cantidadFinal = cantidad;
  if(cantidadFinal === null || Number.isNaN(cantidadFinal)){
    cantidadFinal = 1;
  }
  if(cantidadFinal === 0) return null;

  // Prioridad:
  // 1. Unidad escrita explícitamente por el cliente.
  // 2. Regla específica del producto, si existe.
  // 3. Si escribió una cantidad sin unidad -> unidad.
  // 4. Si escribió solo el nombre -> unidad habitual del catálogo/base.
  let unidadFinal = unidad;
  if(!unidadFinal){
    if(cantidadExplicita){
      unidadFinal = (baseMatch && baseMatch.reglaCantidadSinUnidad)
        || 'unidad';
    } else {
      unidadFinal = catMatch ? catMatch.unidad : (baseMatch ? baseMatch.unidad : 'unidad');
    }
  }

  // Mantener la regla existente de productos vendidos por unidad.
  // Estos productos (por ejemplo cebolla, lechuga, etc.) ya estaban
  // configurados como "siempreUnidad" y esa lógica NO se modifica.
  // Por lo tanto, "cebolla 1 kg" seguirá mostrándose como 1 unidad,
  // igual que en la versión original.

  if(baseMatch && baseMatch.siempreUnidad) unidadFinal = 'unidad';

  const nombreFinal = catMatch
    ? catMatch.nombre
    : (baseMatch ? baseMatch.nombre : textoLimpio);

  const precio = catMatch ? (parseFloat(catMatch.precio) || 0) : 0;

  return {
    producto: capitalize(nombreFinal),
    cantidad: cantidadFinal,
    unidad: unidadFinal,
    precio
  };
}

function separarMultiplesProductos(linea){
  // v0.5.1: pedidos "hacia el lado" - "2 alcachofas 4 pepinos 2 lechugas"
  if(/[,;]/.test(linea)){
    const porComa = linea.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    if(porComa.length > 1){
      let out = [];
      for(let p of porComa) out.push(...separarMultiplesProductos(p));
      return out;
    }
  }
  const partes = linea.split(/\s+\by\b\s+/i).map(s => s.trim()).filter(Boolean);
  if(partes.length > 1){
    const resultados = [];
    for(let i = 0; i < partes.length; i++){
      let parte = partes[i];
      if(i === 0){
        const pos = parte.search(/\d/);
        if(pos > 0) parte = parte.slice(pos);
      }
      const tieneProducto = buscarEnCatalogo(parte) || buscarEnBaseDatos(parte);
      const tieneCantidad = /\d/.test(parte);
      if(tieneProducto || tieneCantidad) resultados.push(parte);
    }
    if(resultados.length) {
      let final = [];
      for(let r of resultados) final.push(...separarPorNumeros(r));
      return final;
    }
    return [linea];
  }
  return separarPorNumeros(linea);
}
function separarPorNumeros(linea){
  const t = linea.trim();
  if(!t) return [linea];
  const nums = t.match(/\d+(?:[.,]\d+)?/g) || [];
  if(nums.length < 2) return [linea];
  let desdeNum = t;
  const primerNum = t.search(/\d/);
  if(primerNum > 0) desdeNum = t.slice(primerNum);
  const trozos = desdeNum.split(/\s+(?=\d+(?:[.,]\d+)?\s)/).map(s => s.trim()).filter(Boolean);
  if(trozos.length <= 1) return [linea];
  const todosValidos = trozos.every(tr => buscarEnCatalogo(tr) || buscarEnBaseDatos(tr) || /\d/.test(tr));
  if(!todosValidos) return [linea];
  return trozos;
}

function parsearTexto(texto){
  window._noReconocidosV097 = [];
  const lineas = texto.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const items = [];

  for(let raw of lineas){
    let linea = raw.replace(/^[-*•·]+\s*/, '');
    linea = convertirFracciones(linea);

    // Primero intenta separar varias solicitudes en la misma línea.
    const segmentos = separarMultiplesProductos(linea);

    for(let segmento of segmentos){
      // Quitar conectores/palabras de relleno antes de la solicitud.
      segmento = segmento
        .replace(/^(?:(?:hola|holaa|buenas|buenos dias|buenas días|tambien|también|casero|casera|necesito|quiero|por favor|porfa)\s+)+/i, '')
        .trim();

      if(!segmento) continue;

      const parsed = extraerCantidadYUnidad(segmento);
      const item = resolverItem(
        parsed.producto,
        parsed.cantidad,
        parsed.unidad,
        parsed.cantidadExplicita
      );

      if(item){
        items.push(item);
      } else {
        // v1.0.10: no se pierde - queda para mostrar Usar / Agregar como nuevo
        const nombreNo = (parsed.producto || '').trim();
        if(nombreNo){
          if(!window._noReconocidosV097) window._noReconocidosV097 = [];
          const ya = window._noReconocidosV097.some(function(x){ return normTxt(x.nombre) === normTxt(nombreNo); });
          if(!ya) window._noReconocidosV097.push({ nombre: nombreNo, cantidad: parsed.cantidad || 1, unidad: parsed.unidad || null });
        }
      }
    }
  }

  return items;
}

function analizarPedido(){
  const texto = document.getElementById('textoInput').value;
  const statusEl = document.getElementById('statusMsg');
  if(!texto.trim()){
    statusEl.innerHTML = '<div class="status-msg warn">Pega primero el texto del pedido.</div>';
    return;
  }
  itemsEnRevision = parsearTexto(texto);
  if(itemsEnRevision.length === 0){
    statusEl.innerHTML = '<div class="status-msg warn">No se detectaron productos automáticamente. Agrega las líneas manualmente abajo.</div>';
  } else {
    statusEl.innerHTML = `<div class="status-msg ok">${itemsEnRevision.length} producto(s) detectado(s). Revisa antes de agregar.</div>`;
  }
  document.getElementById('revisionWrap').style.display = 'block';
  renderItemsRevision();
  try{ if(window._noReconocidosV097 && window._noReconocidosV097.length) mostrarProductosNoReconocidos(window._noReconocidosV097); else { const oldA = document.getElementById('avisoNoReconocidos'); if(oldA) oldA.remove(); } }catch(e){}
}

function renderItemsRevision(){
  const cont = document.getElementById('itemsLista');
  cont.innerHTML = itemsEnRevision.map((it, i) => `
    <div class="item-row">
      <input type="text" value="${escapeHtml(it.producto)}" data-field="producto" data-index="${i}" data-item-input="1" />
      <input type="number" step="0.1" value="${it.cantidad}" data-field="cantidad" data-index="${i}" data-item-input="1" />
      <select data-field="unidad" data-index="${i}" data-item-input="1">
        <option value="kg" ${it.unidad==='kg'?'selected':''}>kg</option>
        <option value="g" ${it.unidad==='g'?'selected':''}>g</option>
        <option value="unidad" ${it.unidad==='unidad'?'selected':''}>unidad</option>
        <option value="oferta" ${it.unidad==='oferta'?'selected':''}>OFERTA</option>
      </select>
      <input type="number" value="${it.precio}" data-field="precio" data-index="${i}" data-item-input="1" />
      <button class="icon-btn" data-action="quitarItemRevision" data-index="${i}">✕</button>
    </div>
  `).join('');
  actualizarTotalesPreview();
}
function quitarItemRevision(i){
  itemsEnRevision.splice(i,1);
  renderItemsRevision();
}
function agregarLineaManual(){
  itemsEnRevision.push({producto:'', cantidad:1, unidad:'unidad', precio:0});
  renderItemsRevision();
}
function actualizarTotalesPreview(){
  const totK = itemsEnRevision.filter(it=>it.unidad==='kg').reduce((a,it)=>a+it.cantidad,0);
  const totG = itemsEnRevision.filter(it=>it.unidad==='g').reduce((a,it)=>a+it.cantidad,0);
  const totU = itemsEnRevision.filter(it=>it.unidad==='unidad').reduce((a,it)=>a+it.cantidad,0);
  const totD = itemsEnRevision.reduce((a,it)=>a+it.precio,0);
  document.getElementById('totalesPreview').innerHTML = `
    <span><b>${totK.toLocaleString('es-CL')}</b> kg</span>
    ${totG>0?`<span><b>${totG.toLocaleString('es-CL')}</b> g</span>`:''}
    <span><b>${totU.toLocaleString('es-CL')}</b> unidades</span>
    <span><b>$${Math.round(totD).toLocaleString('es-CL')}</b></span>
  `;
}

function agregarPedidoALaHoja(){
  const cliente = document.getElementById('clienteInput').value.trim();
  const statusEl = document.getElementById('statusMsg');
  if(!cliente){
    statusEl.innerHTML = '<div class="status-msg warn">Falta el nombre del cliente.</div>';
    return;
  }
  const items = itemsEnRevision.filter(it => it.producto.trim() !== '');
  if(items.length === 0){
    statusEl.innerHTML = '<div class="status-msg warn">Agrega al menos un producto.</div>';
    return;
  }

  const esFiado = document.getElementById('fiadoCheckbox').checked;

  if(editingIndex !== null){
    // Actualiza un pedido ya existente en la hoja (no vuelve a registrar venta ni fiado)
    pedidosPendientes[editingIndex].cliente = cliente;
    pedidosPendientes[editingIndex].items = JSON.parse(JSON.stringify(items));
    // v1.0.10: al editar, guardar tambien el telefono y mantener la fecha original de emision
    try{ const telEd = document.getElementById('telefonoInput') ? document.getElementById('telefonoInput').value.trim() : ''; if(telEd) pedidosPendientes[editingIndex].telefono = telEd; }catch(e){}
    editingIndex = null;
    document.getElementById('btnCancelarEdicion').style.display = 'none';
    statusEl.innerHTML = '<div class="status-msg ok">Pedido actualizado.</div>';
  } else {
    const telefonoPedido = (document.getElementById('telefonoInput') ? document.getElementById('telefonoInput').value.trim() : '');
    const pedidoObj = {
      cliente,
      telefono: telefonoPedido,
      items: JSON.parse(JSON.stringify(items)),
      fecha: new Date().toISOString(),
      diaISO: fechaLocalISO(),
      fiado: esFiado
    };
    pedidosPendientes.push(pedidoObj);
    registrarVenta(pedidoObj);

    if(esFiado){
      const totD = items.reduce((a, it) => a + it.precio, 0);
      let c = buscarCliente(cliente);
      if(!c){
        c = {nombre: cliente, direccion: '', telefono: '', deuda: 0};
        clientes.push(c);
      }
      c.deuda = (c.deuda || 0) + totD;
      renderClientes();
      renderClientesDatalist();
      guardarClientes();
    }
    statusEl.innerHTML = '<div class="status-msg ok">Pedido agregado a la hoja.</div>';
  }

  // reset del formulario
  document.getElementById('clienteInput').value = '';
  if(document.getElementById('telefonoInput')) document.getElementById('telefonoInput').value = '';
  document.getElementById('textoInput').value = '';
  document.getElementById('fiadoCheckbox').checked = false;
  document.getElementById('revisionWrap').style.display = 'none';
  itemsEnRevision = [];

  renderPedidosPendientes();
  guardarPedidosPendientes();
  renderReporte();
}

function editarPedidoPendiente(i){
  const p = pedidosPendientes[i];
  document.getElementById('clienteInput').value = p.cliente;
  try{ if(document.getElementById('telefonoInput')) document.getElementById('telefonoInput').value = p.telefono || ''; }catch(e){}
  itemsEnRevision = JSON.parse(JSON.stringify(p.items));
  editingIndex = i;
  document.getElementById('revisionWrap').style.display = 'block';
  document.getElementById('btnCancelarEdicion').style.display = 'block';
  document.getElementById('statusMsg').innerHTML = '<div class="status-msg warn">Editando el pedido de ' + escapeHtml(p.cliente) + '. Corrige y guarda, o cancela.</div>';
  renderItemsRevision();
  document.getElementById('clienteInput').scrollIntoView({behavior: 'smooth', block: 'center'});
}
function cancelarEdicion(){
  editingIndex = null;
  itemsEnRevision = [];
  document.getElementById('clienteInput').value = '';
  if(document.getElementById('telefonoInput')) document.getElementById('telefonoInput').value = '';
  document.getElementById('textoInput').value = '';
  document.getElementById('revisionWrap').style.display = 'none';
  document.getElementById('btnCancelarEdicion').style.display = 'none';
  document.getElementById('statusMsg').innerHTML = '';
}

function eliminarPedidoPendiente(i){
  pedidosPendientes.splice(i,1);
  renderPedidosPendientes();
  guardarPedidosPendientes();
}
function vaciarHoja(){
  if(pedidosPendientes.length === 0) return;
  if(confirm('¿Vaciar todos los pedidos de la hoja actual?')){
    pedidosPendientes = [];
    renderPedidosPendientes();
    guardarPedidosPendientes();
  }
}

function renderPedidosPendientes(){
  const cont = document.getElementById('pedidosLista');
  const empty = document.getElementById('pedidosEmpty');
  const count = document.getElementById('pedidosCount');
  const btnGen = document.getElementById('btnGenerar');
  const pageHint = document.getElementById('pageHint');

  count.textContent = pedidosPendientes.length;
  btnGen.disabled = pedidosPendientes.length === 0;

  const porHoja = config.pedidosPorHoja || 3;

  if(pedidosPendientes.length === 0){
    cont.innerHTML = '';
    empty.style.display = 'block';
    pageHint.textContent = `Se agrupan de a ${porHoja} pedidos por hoja de Word.`;
    return;
  }
  empty.style.display = 'none';
  const totalHojas = Math.ceil(pedidosPendientes.length / porHoja);
  pageHint.textContent = `${pedidosPendientes.length} pedido(s) → ${totalHojas} hoja(s) de papel (${porHoja} por hoja).`;

  cont.innerHTML = pedidosPendientes.map((pedido, i) => {
    const totK = pedido.items.filter(it=>it.unidad==='kg').reduce((a,it)=>a+it.cantidad,0);
    const totG = pedido.items.filter(it=>it.unidad==='g').reduce((a,it)=>a+it.cantidad,0);
    const totU = pedido.items.filter(it=>it.unidad==='unidad').reduce((a,it)=>a+it.cantidad,0);
    const totD = pedido.items.reduce((a,it)=>a+it.precio,0);
    const hoja = Math.floor(i/porHoja)+1;
    const fechaHoy = new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'2-digit',year:'numeric'});
    return `
      <div class="ticket">
        <div class="ticket-head"><span class="cliente">${escapeHtml(pedido.cliente)}</span><span class="ticket-num">📅 ${fechaHoy} · Hoja ${hoja}</span></div>
        <ul>${pedido.items.map(it => `<li><span>${emojiParaProducto(it.producto)} ${escapeHtml(it.producto)}</span><span>${it.cantidad} ${it.unidad}</span></li>`).join('')}</ul>
        <div class="ticket-foot">${totK>0?`<span>${totK} kg</span>`:''}${totG>0?`<span>${totG} g</span>`:''}${totU>0?`<span>${totU} unidades</span>`:''}${totD>0?`<span>$${Math.round(totD).toLocaleString('es-CL')}</span>`:''}</div>
        <div class="ticket-actions"><button data-action="editarPedidoPendiente" data-index="${i}">✏️ Editar</button><button data-action="eliminarPedidoPendiente" data-index="${i}">🗑️ Eliminar</button><button data-action="enviarWhatsAppPedido" data-index="${i}" style="background:#25D366;color:#fff;border:0;border-radius:999px;padding:7px 12px;font-weight:700;font-size:13px;cursor:pointer;">💬 Enviar a ${escapeHtml(pedido.cliente)}${pedido.telefono ? ' · ' + escapeHtml(pedido.telefono) : ' · sin teléfono'}</button></div>
      </div>`;
  }).join('');
}

// ---------- Generar Word ----------
function generarWord(){
  if(typeof generarDocxReal === 'function'){ generarDocxReal(); return; }
  if(pedidosPendientes.length === 0) return;
  generarWordDesdeLista(pedidosPendientes);

  historialPedidos.push({
    fecha: new Date().toISOString(),
    pedidos: JSON.parse(JSON.stringify(pedidosPendientes))
  });
  guardarHistorial();
  renderHistorial();
}

var LOGO_EMBEDDED = "data:image/jpeg;base64,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";
function construirHtmlHoja(lista){
  if(!lista || lista.length === 0) return null;
  const fechaGen = new Date();
  const fecha = fechaGen.toLocaleDateString('es-CL');
  const horaGen = fechaGen.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'});
  const porHoja = config.pedidosPorHoja || 3;
  const chunks = [];
  for(let i=0;i<lista.length;i+=porHoja) chunks.push(lista.slice(i,i+porHoja));
  const fontSize = porHoja >= 4 ? '10.5px' : (porHoja <= 2 ? '13px' : '12px');
  const nombreNeg = (config && config.nombreNegocio ? config.nombreNegocio : 'El Castillo de la Fruta') || 'El Castillo de la Fruta';
  const infoNeg = (config && config.infoNegocio ? config.infoNegocio : '') || '';
  const logoSrc = (config && config.logo) ? config.logo : LOGO_EMBEDDED;
  const logoHtml = `<img src="${logoSrc}" onerror="this.style.display='none'" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid #fff;">`;
  const logoHtmlPedido = `<img src="${logoSrc}" onerror="this.style.display='none'" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid #fff;vertical-align:middle;">`;
  function fechaPedidoStr(p){
    try{
      if(p && p.fecha){ const d = new Date(p.fecha); if(!isNaN(d)) return d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'}); }
      if(p && p.diaISO){ const parts = String(p.diaISO).split('-'); if(parts.length===3) return parts[2] + '-' + parts[1] + '-' + parts[0]; }
    }catch(e){}
    return fecha + ' ' + horaGen;
  }
  let bodyHtml = '';
  chunks.forEach((chunk, ci) => {
    const totalHojaD = chunk.reduce((a,p)=> a + (p.items||[]).reduce((b,it)=> b + (it.precio||0), 0), 0);
    const totalHojaKg = chunk.reduce((a,p)=> a + (p.items||[]).filter(it=>it.unidad==='kg').reduce((b,it)=> b + it.cantidad, 0), 0);
    bodyHtml += `<div style="${ci>0?'page-break-before:always;':''}">`;
    bodyHtml += `
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px;background:#2F5233;color:#fff;">
        <tr>
          <td style="width:62px;padding:8px 6px 8px 10px;vertical-align:middle;">${logoHtml}</td>
          <td style="padding:8px 6px;vertical-align:middle;">
            <div style="font-size:18px;font-weight:900;line-height:1.1;">${escapeHtml(nombreNeg)}</div>
            ${infoNeg ? `<div style="font-size:11px;opacity:.9;line-height:1.2;">${escapeHtml(infoNeg)}</div>` : `<div style="font-size:11px;opacity:.9;">Verduleria - Pedidos del dia</div>`}
          </td>
          <td style="padding:8px 10px 8px 6px;text-align:right;vertical-align:middle;">
            <div style="font-size:12px;font-weight:700;">Hoja ${ci+1} de ${chunks.length}</div>
            <div style="font-size:11px;">Generada ${fecha} ${horaGen}</div>
            <div style="font-size:11px;">${chunk.length} pedido(s) en esta hoja</div>
          </td>
        </tr>
      </table>`;
    chunk.forEach(pedido => {
      const totK = pedido.items.filter(it=>it.unidad==='kg').reduce((a,it)=>a+it.cantidad,0);
      const totG = pedido.items.filter(it=>it.unidad==='g').reduce((a,it)=>a+it.cantidad,0);
      const totU = pedido.items.filter(it=>it.unidad==='unidad').reduce((a,it)=>a+it.cantidad,0);
      const totD = pedido.items.reduce((a,it)=>a+it.precio,0);
      let totalTxt = [];
      if(totK>0) totalTxt.push(totK.toLocaleString('es-CL')+' kg');
      if(totG>0) totalTxt.push(totG.toLocaleString('es-CL')+' g');
      if(totU>0) totalTxt.push(totU.toLocaleString('es-CL')+' unidades');
      if(totD>0) totalTxt.push('$'+Math.round(totD).toLocaleString('es-CL'));
      const fiadoTxt = pedido.fiado ? ' &nbsp; <span style="background:#F59E0B;color:#fff;padding:2px 8px;border-radius:999px;font-size:10px;">FIADO</span>' : '';
      const fechaEmision = fechaPedidoStr(pedido);
      const telTxt = pedido.telefono ? ` &nbsp;|&nbsp; Tel: ${escapeHtml(pedido.telefono)}` : '';
      bodyHtml += `
        <table class="pedido-tabla">
          <tr><td style="width:46px;background:#2F5233;padding:3px;text-align:center;vertical-align:middle;border:1px solid #2F5233;">${logoHtmlPedido}</td><td colspan="3" class="cliente-cell">Cliente: ${escapeHtml(pedido.cliente)}${fiadoTxt}</td></tr>
          <tr><td colspan="4" style="background:#F7F4EA;font-size:11px;padding:4px 8px;border:1px solid #6B9362;border-top:0;">Pedido emitido: <b>${fechaEmision}</b>${telTxt}</td></tr>
          <tr class="header-row"><th>Producto</th><th>Cantidad</th><th>Unidad</th><th>Subtotal</th></tr>
          ${pedido.items.map(it => `<tr><td>${escapeHtml(it.producto)}</td><td>${it.cantidad}</td><td>${it.unidad}</td><td>${it.precio>0 ? '$'+Math.round(it.precio).toLocaleString('es-CL') : '-'}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="4">Total: ${totalTxt.join(' | ') || '-'}</td></tr>
        </table>
        <div style="height:14px;"></div>
      `;
    });
    bodyHtml += `<div style="border-top:1px dashed #6B9362;padding-top:6px;font-size:11px;color:#555;display:flex;justify-content:space-between;"><span>${chunk.length} pedido(s) en esta hoja ${totalHojaKg>0 ? '&nbsp;|&nbsp; '+totalHojaKg.toLocaleString('es-CL')+' kg' : ''}</span><span><b>Total hoja: $${Math.round(totalHojaD).toLocaleString('es-CL')}</b></span></div>`;
    bodyHtml += `<div style="text-align:center;font-size:10px;color:#888;margin-top:6px;">${escapeHtml(nombreNeg)} - Gracias por su compra - Revisa tu pedido antes de salir</div>`;
    bodyHtml += `</div>`;
  });
  const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset="utf-8"><title>Pedidos - ${escapeHtml(nombreNeg)}</title>
  <style>
    @page{size:A4;margin:12mm;}
    body{font-family:Calibri,Arial,sans-serif;font-size:${fontSize};color:#222;max-width:800px;margin:0 auto;padding:12px;}
    table.pedido-tabla{width:100%;border-collapse:collapse;margin-bottom:6px;border:1.5px solid #2F5233;}
    table.pedido-tabla td, table.pedido-tabla th{border:1px solid #6B9362;padding:4px 6px;}
    .cliente-cell{background:#2F5233;color:#fff;font-weight:bold;font-size:${porHoja>=4?'11.5px':'13px'};}
    .header-row th{background:#EDE6D0;text-align:left;}
    .total-row td{font-weight:bold;background:#F7F4EA;}
    @media print{ .no-print{display:none !important;} body{padding:0;} }
  </style></head>
  <body>
  ${bodyHtml}
  </body></html>`;
  return {html: fullHtml, fecha};
}
function generarWordDesdeLista(lista){
  if(!lista || lista.length === 0) return;
  const built = construirHtmlHoja(lista);
  if(!built || !built.html) return;
  const blob = new Blob(['\ufeff', built.html], {type: 'application/msword'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos_${built.fecha.replace(/\//g,'-')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  document.getElementById('statusMsg').innerHTML = '<div class="status-msg ok">Hoja lista para Imprimir / Guardar como PDF. Ya no se descarga .doc porque iPhone lo marcaba como danado.</div>';
}
// v1.0.10: Vista previa de la hoja sin abrir Word - abre la misma hoja en una pestaña nueva, se ve igual que el .doc
function descargarHoja(){
  var st = document.getElementById('statusMsg');
  var n = (pedidosPendientes && pedidosPendientes.length) ? pedidosPendientes.length : 0;
  if(!n){
    if(st) st.innerHTML = '<div class="status-msg warn">No hay pedidos en la hoja para descargar. Primero pega un pedido, Analizar y Agregar a la hoja.</div>';
    return;
  }
  var built = construirHtmlHoja(pedidosPendientes);
  if(!built || !built.html){
    if(st) st.innerHTML = '<div class="status-msg warn">No se pudo armar la hoja.</div>';
    return;
  }
  // v1.0.10: Descarga directa REAL. No es .doc falso (HTML con nombre .doc = iPhone dice danado).
  // Es .html, que es lo que realmente es la hoja. iPhone lo previsualiza y lo abre en Safari sin error.
  // Nombre: pedidos_16-11-2026.html - se guarda en Archivos > Descargas y se puede compartir por WhatsApp.
  var blob = new Blob(['\ufeff', built.html], {type: 'text/html;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'pedidos_' + built.fecha.replace(/\//g,'-') + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} }, 5000);
  if(st) st.innerHTML = '<div class="status-msg ok">Hoja descargada como .html con ' + n + ' pedido(s). Buscala en Archivos > Descargas. Si la tocas, se abre en Safari y se ve igual que la vista previa. Desde ahi puedes Compartir o Imprimir / Guardar como PDF.</div>';
}

// v1.0.10: DOCX REAL (no HTML renombrado). Un .docx es un ZIP con XML de Word.
// Genera un ZIP sin compresion (stored) con CRC32 en JS puro, sin librerias externas.
// Asi Android lo abre con "Abrir siempre con" el programa de impresion, como hacia la app anterior.
// Incluye: encabezado El Castillo, fecha por pedido, telefono, tabla de productos, totales por pedido y total hoja.
// Logo: se incluye como imagen JPEG en word/media/image1.jpeg y se referencia en cada pedido.
function crc32Table(){
  if(window.__crcTable) return window.__crcTable;
  var t = [];
  for(var n=0;n<256;n++){ var c=n; for(var k=0;k<8;k++){ c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); } t[n]=c >>> 0; }
  window.__crcTable = t; return t;
}
function crc32Bytes(bytes){
  var table = crc32Table(); var crc = 0xFFFFFFFF;
  for(var i=0;i<bytes.length;i++){ crc = table[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8); }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function strToBytes(s){ return new TextEncoder().encode(s); }
function base64ToBytes(b64){
  var bin = atob(b64); var bytes = new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function crearZipDocx(archivos){
  // archivos: [{name, data: Uint8Array}] - stored (sin compresion)
  var partes = []; var central = []; var offset = 0;
  function pushBytes(arr){ partes.push(arr); offset += arr.length; }
  function u16(n){ var a = new Uint8Array(2); new DataView(a.buffer).setUint16(0, n, true); return a; }
  function u32(n){ var a = new Uint8Array(4); new DataView(a.buffer).setUint32(0, n >>> 0, true); return a; }
  function concat(list){ var total = 0; list.forEach(function(a){ total += a.length; }); var out = new Uint8Array(total); var p=0; list.forEach(function(a){ out.set(a,p); p+=a.length; }); return out; }
  archivos.forEach(function(f){
    var nameBytes = strToBytes(f.name);
    var crc = crc32Bytes(f.data);
    var headerOffset = offset;
    var local = concat([strToBytes('PK\x03\x04'), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(f.data.length), u32(f.data.length), u16(nameBytes.length), u16(0), nameBytes, f.data]);
    pushBytes(local);
    var cen = concat([strToBytes('PK\x01\x02'), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(f.data.length), u32(f.data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(headerOffset), nameBytes]);
    central.push(cen);
  });
  var centralStart = offset;
  central.forEach(function(c){ pushBytes(c); });
  var centralSize = offset - centralStart;
  var end = concat([strToBytes('PK\x05\x06'), u16(0), u16(0), u16(archivos.length), u16(archivos.length), u32(centralSize), u32(centralStart), u16(0)]);
  pushBytes(end);
  return new Blob([concat(partes)], {type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
function escapeXml(s){
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function generarDocxReal(){
  var st = document.getElementById('statusMsg');
  var n = (pedidosPendientes && pedidosPendientes.length) ? pedidosPendientes.length : 0;
  if(!n){ if(st) st.innerHTML = '<div class="status-msg warn">No hay pedidos en la hoja para descargar. Primero pega un pedido, Analizar y Agregar a la hoja.</div>'; return; }
  var fechaGen = new Date();
  var fecha = fechaGen.toLocaleDateString('es-CL');
  var horaGen = fechaGen.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'});
  var nombreNeg = (config && config.nombreNegocio ? config.nombreNegocio : 'El Castillo de la Fruta') || 'El Castillo de la Fruta';
  var totalHojaD = pedidosPendientes.reduce(function(a,p){ return a + (p.items||[]).reduce(function(b,it){ return b + (it.precio||0); }, 0); }, 0);
  var totHojaKg = pedidosPendientes.reduce(function(a,p){ return a + (p.items||[]).filter(function(it){ return it.unidad==='kg'; }).reduce(function(b,it){ return b+it.cantidad; }, 0); }, 0);
  var totHojaG = pedidosPendientes.reduce(function(a,p){ return a + (p.items||[]).filter(function(it){ return it.unidad==='g'; }).reduce(function(b,it){ return b+it.cantidad; }, 0); }, 0);
  var totHojaU = pedidosPendientes.reduce(function(a,p){ return a + (p.items||[]).filter(function(it){ return it.unidad==='unidad'; }).reduce(function(b,it){ return b+it.cantidad; }, 0); }, 0);
  function fechaPedidoStr(p){
    try{
      if(p && p.fecha){ var d = new Date(p.fecha); if(!isNaN(d)) return d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'}); }
      if(p && p.diaISO){ var parts = String(p.diaISO).split('-'); if(parts.length===3) return parts[2] + '-' + parts[1] + '-' + parts[0]; }
    }catch(e){}
    return fecha + ' ' + horaGen;
  }
  function fmtCant(v){ return Number(v).toLocaleString('es-CL'); }
  function totalTxtFor(items){
    var k = items.filter(function(it){ return it.unidad==='kg'; }).reduce(function(a,it){ return a+it.cantidad; }, 0);
    var g = items.filter(function(it){ return it.unidad==='g'; }).reduce(function(a,it){ return a+it.cantidad; }, 0);
    var u = items.filter(function(it){ return it.unidad==='unidad'; }).reduce(function(a,it){ return a+it.cantidad; }, 0);
    var d = items.reduce(function(a,it){ return a+it.precio; }, 0);
    var parts = [];
    if(k>0) parts.push(fmtCant(k)+' kg');
    if(g>0) parts.push(fmtCant(g)+' g');
    if(u>0) parts.push(fmtCant(u)+' unidades');
    if(d>0) parts.push('$'+Math.round(d).toLocaleString('es-CL'));
    return parts.join('  |  ') || '-';
  }
  // Helpers XML - con noProof para que Word no subraye en azul/rojo
  function run(texto, bold, size, color, italic){
    return '<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b ' + (bold ? 'w:val="true"' : 'w:val="false"') + '/><w:i ' + (italic ? 'w:val="true"' : 'w:val="false"') + '/><w:sz w:val="' + (size||22) + '"/><w:szCs w:val="' + (size||22) + '"/><w:color w:val="' + (color||'000000') + '"/><w:noProof/></w:rPr><w:t xml:space="preserve">' + escapeXml(texto) + '</w:t></w:r>';
  }
  function para(runs, align, shading, spaceBefore, spaceAfter, borderBottom){
    var pPr = '<w:pPr><w:jc w:val="' + (align||'left') + '"/>';
    if(shading) pPr += '<w:shd w:fill="' + shading + '" w:val="clear"/>';
    pPr += '<w:spacing w:before="' + (spaceBefore||0) + '" w:after="' + (spaceAfter||120) + '" w:line="276" w:lineRule="auto"/>';
    if(borderBottom) pPr += '<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="4" w:color="F97316"/></w:pBdr>';
    pPr += '<w:rPr><w:noProof/></w:rPr></w:pPr>';
    return '<w:p>' + pPr + runs.join('') + '</w:p>';
  }
  function paraVacio(){ return '<w:p><w:pPr><w:spacing w:after="100"/></w:pPr></w:p>'; }
  // LOGO como dibujo real centrado - esto era lo que faltaba en v1.0.8
  var tieneLogo = false;
  var logoBytesTmp = new Uint8Array(0);
  try{
    var ls = (typeof LOGO_EMBEDDED !== 'undefined' && LOGO_EMBEDDED) ? LOGO_EMBEDDED : '';
    if(ls && ls.indexOf('base64,') !== -1){ logoBytesTmp = base64ToBytes(ls.split('base64,')[1]); tieneLogo = logoBytesTmp.length > 5000; }
    else if(config && config.logo && config.logo.indexOf('base64,') !== -1){ logoBytesTmp = base64ToBytes(config.logo.split('base64,')[1]); tieneLogo = logoBytesTmp.length > 5000; }
  }catch(e){ tieneLogo = false; }
  var body = '';
  if(tieneLogo){
    // 2.1 pulgadas = 1905000 EMU aprox, cuadrado para el logo original
    var drawing = '<w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="1905000" cy="1905000"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Logo Castillo"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="Logo Castillo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1905000" cy="1905000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    body += '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/><w:rPr><w:noProof/></w:rPr></w:pPr>' + drawing + '</w:p>';
  }
  body += para([run(nombreNeg, true, 36, '1A4D2E')], 'center', null, 0, 40, false);
  body += para([run('Verduleria  -  Pedidos del dia', false, 22, '555555'), run('  |  Generada ' + fecha + ' ' + horaGen + '  |  ' + n + ' pedido(s)', false, 22, '555555')], 'center', null, 0, 200, true);
  body += paraVacio();
  pedidosPendientes.forEach(function(pedido){
    var fiadoTxt = pedido.fiado ? '  |  FIADO' : '';
    // Banner verde del cliente - igual que la hoja bonita
    body += para([run('  Cliente: ' + pedido.cliente + fiadoTxt, true, 28, 'FFFFFF')], 'left', '1A4D2E', 200, 80, false);
    var telTxt = pedido.telefono ? '  |  Tel: ' + pedido.telefono : '';
    body += para([run('Pedido emitido: ' + fechaPedidoStr(pedido) + telTxt, false, 20, '666666', true)], 'left', null, 0, 140, false);
    // Tabla bonita
    function celda(texto, bold, bg, color, align){
      return '<w:tc><w:tcPr><w:shd w:fill="' + (bg||'FFFFFF') + '" w:val="clear"/><w:tcW w:w="1800" w:type="dxa"/><w:tcMar><w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="' + (align||'left') + '"/><w:spacing w:after="0"/><w:rPr><w:noProof/></w:rPr></w:pPr>' + run(texto, bold, 22, color||'1A2E1A') + '</w:p></w:tc>';
    }
    function fila(celdas){ return '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + celdas.join('') + '</w:tr>'; }
    var rows = '';
    rows += fila([celda('Producto', true, 'EDE6D0', '1A4D2E', 'left'), celda('Cantidad', true, 'EDE6D0', '1A4D2E', 'center'), celda('Unidad', true, 'EDE6D0', '1A4D2E', 'center'), celda('Subtotal', true, 'EDE6D0', '1A4D2E', 'right')]);
    pedido.items.forEach(function(it, idxRow){
      var bg = (idxRow % 2 === 0) ? 'FFFFFF' : 'F7F4EA';
      rows += fila([celda(it.producto, false, bg, '222222', 'left'), celda(String(it.cantidad), false, bg, '222222', 'center'), celda(it.unidad, false, bg, '222222', 'center'), celda(it.precio>0 ? '$'+Math.round(it.precio).toLocaleString('es-CL') : '-', false, bg, '222222', 'right')]);
    });
    body += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/></w:tblCellMar><w:tblBorders><w:top w:val="single" w:sz="8" w:color="1A4D2E"/><w:left w:val="single" w:sz="8" w:color="1A4D2E"/><w:bottom w:val="single" w:sz="8" w:color="1A4D2E"/><w:right w:val="single" w:sz="8" w:color="1A4D2E"/><w:insideH w:val="single" w:sz="4" w:color="C9D6C2"/><w:insideV w:val="single" w:sz="4" w:color="C9D6C2"/></w:tblBorders><w:tblGrid><w:gridCol w:w="3600"/><w:gridCol w:w="1200"/><w:gridCol w:w="1200"/><w:gridCol w:w="1800"/></w:tblGrid></w:tblPr>' + rows + '</w:tbl>';
    // Barra de total por pedido - fuera de la tabla para que no quede apretada
    body += para([run('Total: ' + totalTxtFor(pedido.items), true, 24, '1A4D2E')], 'right', 'F7F4EA', 80, 200, false);
  });
  // Total hoja - si es $0 no mostramos $0, mostramos kg / unidades como en la hoja bonita
  var totalHojaParts = [];
  if(totHojaKg>0) totalHojaParts.push(fmtCant(totHojaKg)+' kg');
  if(totHojaG>0) totalHojaParts.push(fmtCant(totHojaG)+' g');
  if(totHojaU>0) totalHojaParts.push(fmtCant(totHojaU)+' unidades');
  if(totalHojaD>0) totalHojaParts.push('$'+Math.round(totalHojaD).toLocaleString('es-CL'));
  var totalHojaTxt = totalHojaParts.join('  |  ') || '-';
  body += para([run('Total hoja: ' + totalHojaTxt, true, 26, '1A4D2E')], 'center', 'EDE6D0', 200, 80, false);
  body += para([run(nombreNeg + '  -  Gracias por su compra  -  Revisa tu pedido antes de salir', false, 20, '555555', true)], 'center', null, 0, 0, false);
  var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>' + body +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360"/><w:cols w:space="720"/></w:sectPr></w:body></w:document>';
  var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>';
  var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  var docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' + (tieneLogo ? '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/>' : '') + '</Relationships>';
  var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="es-CL"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>';
  var logoBytes = logoBytesTmp;
  var archivos = [
    {name: '[Content_Types].xml', data: strToBytes(contentTypes)},
    {name: '_rels/.rels', data: strToBytes(rels)},
    {name: 'word/document.xml', data: strToBytes(documentXml)},
    {name: 'word/_rels/document.xml.rels', data: strToBytes(docRels)},
    {name: 'word/styles.xml', data: strToBytes(styles)}
  ];
  if(tieneLogo && logoBytes.length > 0){ archivos.push({name: 'word/media/image1.jpeg', data: logoBytes}); }
  var blob = crearZipDocx(archivos);
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'pedidos_' + fecha.replace(/\//g,'-') + '.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} }, 5000);
  if(st) st.innerHTML = '<div class="status-msg ok">DOCX bonito descargado con ' + n + ' pedido(s), con logo, colores y totales. En Android sigue abriendo con Abrir siempre con tu programa de impresion.</div>';
}

function vistaPreviaHoja(){
  var st = document.getElementById('statusMsg');
  var box = document.getElementById('vistaPreviaBox');
  var n = (pedidosPendientes && pedidosPendientes.length) ? pedidosPendientes.length : 0;
  if(!n){
    if(st) st.innerHTML = '<div class="status-msg warn">No hay pedidos en la hoja para previsualizar. Primero pega un pedido, toca Analizar y Agregar a la hoja. La hoja tiene 0 pedidos ahora.</div>';
    if(box){ box.style.display='none'; box.innerHTML=''; }
    return;
  }
  var built = construirHtmlHoja(pedidosPendientes);
  if(!built || !built.html){
    if(st) st.innerHTML = '<div class="status-msg warn">No se pudo armar la hoja. Intenta de nuevo.</div>';
    return;
  }
  var htmlConBarra = built.html.replace('</body>', '<div class="no-print" style="position:sticky;bottom:0;background:#2F5233;color:#fff;padding:12px;text-align:center;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;"><button id="btnImprimirPreview" style="background:#fff;color:#2F5233;border:0;border-radius:999px;padding:10px 18px;font-weight:800;cursor:pointer;">\uD83D\uDDBA\uFE0F Imprimir / Guardar como PDF</button></div><script>document.getElementById("btnImprimirPreview").addEventListener("click",function(){window.print();});</script></body>');
  var mostrado = false;
  try{
    var blob = new Blob(['\ufeff', htmlConBarra], {type: 'text/html;charset=utf-8'});
    var url = URL.createObjectURL(blob);
    var win = window.open(url, '_blank', 'noopener');
    if(win && !win.closed){ mostrado = true; setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} }, 60000); }
    else { try{ URL.revokeObjectURL(url); }catch(e){} }
  }catch(e){ mostrado = false; }
  if(!mostrado){
    if(box){
      box.style.display = 'block';
      box.innerHTML = '<div style="background:#2F5233;color:#fff;padding:10px 12px;font-weight:800;display:flex;justify-content:space-between;align-items:center;"><span>\uD83D\uDC40 Vista previa - ' + n + ' pedido(s) en la hoja</span><button id="btnCerrarVista" style="background:#fff;color:#2F5233;border:0;border-radius:999px;padding:6px 12px;font-weight:800;cursor:pointer;">Cerrar \u2715</button></div><div style="max-height:70vh;overflow:auto;padding:10px;">' + built.html + '</div>';
      var btnCerrar = document.getElementById('btnCerrarVista');
      if(btnCerrar) btnCerrar.addEventListener('click', function(){ box.style.display='none'; box.innerHTML=''; });
      box.scrollIntoView({behavior:'smooth', block:'start'});
    }
  } else {
    if(box){ box.style.display='none'; box.innerHTML=''; }
  }
  if(st) st.innerHTML = '<div class="status-msg ok">Vista previa abierta con ' + n + ' pedido(s). Si ves la hoja en blanco, baja en esta misma pantalla: quedo pegada abajo de los botones, en el cuadro verde.</div>';
}


// ================= v0.5.0 SEGURIDAD WEB =================
// Bug: CSP script-src 'self' bloquea handlers inline (onclick="..."). Por eso Analizar no hacia nada en GitHub Pages y si en Netlify (sin CSP).
// Fix: 0 handlers inline, todo con addEventListener + delegacion. Permite CSP estricta sin unsafe-inline en scripts (OWASP).
function sanitizarTexto(v, maxLen){
  if(typeof v !== 'string') return '';
  return v.trim().slice(0, maxLen || 200);
}
function validarNumero(v, min, max){
  const n = parseFloat(v);
  if(!Number.isFinite(n)) return 0;
  if(min !== undefined && n < min) return min;
  if(max !== undefined && n > max) return max;
  return n;
}
function validarArchivoLogo(file){
  if(!file) return {ok:false, msg:'Sin archivo'};
  if(!file.type || !file.type.startsWith('image/')) return {ok:false, msg:'El logo debe ser una imagen'};
  if(file.size > 2*1024*1024) return {ok:false, msg:'El logo debe pesar menos de 2MB'};
  return {ok:true};
}
document.addEventListener('click', function(e){
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const action = btn.getAttribute('data-action');
  const idx = parseInt(btn.getAttribute('data-index'), 10);
  if(!Number.isFinite(idx)) return;
  const acciones = { abonarDeuda, eliminarCliente, reimprimirHistorial, eliminarHistorial, eliminarProductoCatalogo, quitarItemRevision, editarPedidoPendiente, eliminarPedidoPendiente, enviarWhatsAppPedido };
  const fn = acciones[action];
  if(typeof fn === 'function') fn(idx);
});
document.addEventListener('change', function(e){
  const el = e.target;
  if(!el || !el.getAttribute('data-item-input')) return;
  const idx = parseInt(el.getAttribute('data-index'), 10);
  const field = el.getAttribute('data-field');
  if(!Number.isFinite(idx) || !itemsEnRevision[idx]) return;
  if(field === 'producto') itemsEnRevision[idx].producto = sanitizarTexto(el.value, 120);
  if(field === 'cantidad') itemsEnRevision[idx].cantidad = validarNumero(el.value, 0, 10000);
  if(field === 'unidad'){ const permitidas = ['kg','g','unidad']; if(permitidas.includes(el.value)) itemsEnRevision[idx].unidad = el.value; }
  if(field === 'precio') itemsEnRevision[idx].precio = validarNumero(el.value, 0, 10000000);
  if(typeof actualizarTotalesPreview === 'function') actualizarTotalesPreview();
});
document.addEventListener('input', function(e){
  const el = e.target;
  if(el && el.id === 'catBuscar' && typeof renderCatalogo === 'function') renderCatalogo();
});
function cablearEventosEstaticos(){
  const mapa = [
    ['btnQuitarLogo','click', function(){ if(typeof quitarLogo==='function') quitarLogo(); }],
    ['btnAgregarProductoCatalogo','click', function(){ if(typeof agregarProductoCatalogo==='function') agregarProductoCatalogo(); }],
    ['btnExportarCatalogoCSV','click', function(){ if(typeof exportarCatalogoCSV==='function') exportarCatalogoCSV(); }],
    ['btnExportarBaseDatosCSV','click', function(){ if(typeof exportarBaseDatosCSV==='function') exportarBaseDatosCSV(); }],
    ['btnAgregarCliente','click', function(){ if(typeof agregarCliente==='function') agregarCliente(); }],
    ['btnAnalizarPedido','click', function(){ if(typeof analizarPedido==='function') analizarPedido(); }],
    ['btnAgregarLineaManual','click', function(){ if(typeof agregarLineaManual==='function') agregarLineaManual(); }],
    ['btnAgregarPedidoALaHoja','click', function(){ if(typeof agregarPedidoALaHoja==='function') agregarPedidoALaHoja(); }],
    ['btnCancelarEdicion','click', function(){ if(typeof cancelarEdicion==='function') cancelarEdicion(); }],
    ['btnGenerar','click', function(){ if(typeof generarWord==='function') generarWord(); }],
    ['btnVistaPrevia','click', function(){ if(typeof vistaPreviaHoja==='function') vistaPreviaHoja(); }],
    ['btnDescargarHoja','click', function(){ if(typeof descargarHoja==='function') descargarHoja(); }],
    ['btnVaciarHoja','click', function(){ if(typeof vaciarHoja==='function') vaciarHoja(); }],
    ['negNombre','change', function(){ if(typeof actualizarNombreNegocio==='function') actualizarNombreNegocio(); }],
    ['negInfo','change', function(){ if(typeof actualizarInfoNegocio==='function') actualizarInfoNegocio(); }],
    ['pedidosPorHojaSelect','change', function(){ if(typeof actualizarPedidosPorHoja==='function') actualizarPedidosPorHoja(); }],
    ['reporteFecha','change', function(){ if(typeof renderReporte==='function') renderReporte(); }],
  ];
  mapa.forEach(function(item){
    const el = document.getElementById(item[0]);
    if(el) el.addEventListener(item[1], item[2]);
  });
  const logoInput = document.getElementById('negLogo');
  if(logoInput){
    logoInput.addEventListener('change', function(){
      const f = logoInput.files && logoInput.files[0];
      const v = validarArchivoLogo(f);
      if(!v.ok){ alert(v.msg); logoInput.value=''; return; }
      if(typeof cargarLogo==='function') cargarLogo(logoInput);
    });
  }
}
// ================= FIN v0.5.0 =================
// init v1.0.10: cada paso en try/catch, un render fallido no tumba el resto
try{ cablearEventosEstaticos(); }catch(e){ console.error('init cablear', e); }
try{ cargarConfig(); }catch(e){ console.error('init cargarConfig', e); }
try{ cargarCatalogo(); }catch(e){ console.error('init cargarCatalogo', e); }
try{ cargarClientes(); }catch(e){ console.error('init cargarClientes', e); }
try{ cargarPedidosPendientes(); }catch(e){ console.error('init cargarPedidos', e); }
try{ renderPedidosPendientes(); }catch(e){ console.error('init renderPedidos', e); }
try{ cargarHistorial(); }catch(e){ console.error('init cargarHistorial', e); }
try{ cargarVentasLog(); }catch(e){ console.error('init cargarVentas', e); }
const _rf = document.getElementById('reporteFecha'); if(_rf) _rf.value = fechaLocalISO();
try{ renderReporte(); }catch(e){ console.error('init renderReporte', e); }

// ================= v0.7.0 - Compartir por WhatsApp =================
// Flujo local: 1) llega pedido a WhatsApp 2) copiar 3) pegar en app anclada 4) Analizar
// 5) pesar y poner valor 6) Generar Word para imprimir y corchetear en la caja
// 7) NUEVO: Compartir por WhatsApp - genera texto listo para enviar al cliente:
// "Hola {cliente}, tu pedido en El Castillo: - 2 kg Tomate $... Total $... Revisa tu hoja impresa en la caja. Gracias!"
// v1.0.10: WhatsApp al cliente desde la hoja
function normalizarTelefonoChile(tel){
  if(!tel) return '';
  let t = String(tel).replace(/[^0-9+]/g,'');
  if(t.startsWith('+')) t = t.slice(1);
  if(t.startsWith('56') && t.length === 11) return t;
  if(t.length === 9 && t.startsWith('9')) return '56' + t;
  if(t.length === 8) return '569' + t;
  return t;
}
function obtenerTelefonoCliente(nombreCliente){
  // 1) ultimo pedido con ese cliente que tenga telefono
  try{
    for(let i = pedidosPendientes.length - 1; i >= 0; i--){ const p = pedidosPendientes[i]; if(p && normTxt(p.cliente) === normTxt(nombreCliente) && p.telefono) return normalizarTelefonoChile(p.telefono); }
  }catch(e){}
  // 2) campo actual
  try{ const v = document.getElementById('telefonoInput') ? document.getElementById('telefonoInput').value.trim() : ''; if(v) return normalizarTelefonoChile(v); }catch(e){}
  // 3) clientes guardados
  try{
    const c = (clientes || []).find(function(x){ return normTxt(x.nombre) === normTxt(nombreCliente); });
    if(c && c.telefono) return normalizarTelefonoChile(c.telefono);
  }catch(e){}
  return '';
}
function construirMensajeWhatsAppHoja(){
  if(!pedidosPendientes || !pedidosPendientes.length) return null;
  let partes = [];
  let granTotal = 0;
  pedidosPendientes.forEach(function(p){
    const lineas = (p.items || []).map(function(it){ return '- ' + it.cantidad + ' ' + it.unidad + ' ' + it.producto + ' - $' + Math.round(it.precio || 0).toLocaleString('es-CL'); });
    const tot = (p.items || []).reduce(function(a,it){ return a + (it.precio || 0); }, 0);
    granTotal += tot;
    partes.push('Pedido de ' + p.cliente + (p.fiado ? ' (FIADO)' : '') + ':\n' + lineas.join('\n') + '\nTotal: $' + Math.round(tot).toLocaleString('es-CL'));
  });
  return 'Hola, tu pedido en El Castillo de la Fruta:\n\n' + partes.join('\n\n') + '\n\nTotal hoja: $' + Math.round(granTotal).toLocaleString('es-CL') + '\nRevisa tu hoja impresa que va corcheteada en tu caja. \u00a1Gracias!';
}
function construirMensajeWhatsApp(){
  const items = itemsEnRevision.filter(function(it){ return it.producto && it.producto.trim() !== ''; });
  if(items.length){
    const cliente = (document.getElementById('clienteInput').value || '').trim() || 'Cliente';
    const lineas = items.map(function(it){ return '- ' + it.cantidad + ' ' + it.unidad + ' ' + it.producto + ' - $' + Math.round(it.precio || 0).toLocaleString('es-CL'); });
    const total = items.reduce(function(a,it){ return a + (it.precio || 0); }, 0);
    const totalKg = items.filter(function(it){ return it.unidad==='kg'; }).reduce(function(a,it){ return a + it.cantidad; }, 0);
    const totalUn = items.filter(function(it){ return it.unidad==='unidad'; }).reduce(function(a,it){ return a + it.cantidad; }, 0);
    let msg = 'Hola ' + cliente + ', tu pedido en El Castillo de la Fruta:\n' + lineas.join('\n') + '\n';
    if(totalKg>0) msg += 'Total kilos: ' + totalKg + ' kg\n';
    if(totalUn>0) msg += 'Total unidades: ' + totalUn + '\n';
    msg += 'Total: $' + Math.round(total).toLocaleString('es-CL') + '\nRevisa tu hoja impresa que va corcheteada en tu caja. \u00a1Gracias!';
    return { msg: msg, telefono: obtenerTelefonoCliente(cliente) };
  }
  // Si ya esta en la hoja, usar la hoja (antes devolvia null y el boton no hacia nada)
  const msgHoja = construirMensajeWhatsAppHoja();
  if(msgHoja){
    const distintos = [];
    try{ pedidosPendientes.forEach(function(x){ const k = normTxt(x.cliente); if(distintos.indexOf(k) === -1) distintos.push(k); }); }catch(e){}
    if(distintos.length > 1){
      const st2 = document.getElementById('statusMsg');
      if(st2) st2.innerHTML = '<div class="status-msg warn">La hoja tiene ' + distintos.length + ' clientes distintos. Usa el boton verde de cada pedido para enviarle solo su pedido a cada uno.</div>';
      return { msg: msgHoja, telefono: '', esHoja: true };
    }
    const primer = pedidosPendientes[0] ? pedidosPendientes[0].cliente : '';
    return { msg: msgHoja, telefono: obtenerTelefonoCliente(primer), esHoja: true };
  }
  return null;
}
// v1.0.10: enviar SOLO un pedido a SU cliente
function construirMensajeWhatsAppPedido(p){
  if(!p) return null;
  const lineas = (p.items || []).map(function(it){ return '- ' + it.cantidad + ' ' + it.unidad + ' ' + it.producto + ' - $' + Math.round(it.precio || 0).toLocaleString('es-CL'); });
  const tot = (p.items || []).reduce(function(a,it){ return a + (it.precio || 0); }, 0);
  const totalKg = (p.items || []).filter(function(it){ return it.unidad==='kg'; }).reduce(function(a,it){ return a + it.cantidad; }, 0);
  const totalUn = (p.items || []).filter(function(it){ return it.unidad==='unidad'; }).reduce(function(a,it){ return a + it.cantidad; }, 0);
  let msg = 'Hola ' + p.cliente + ', tu pedido en El Castillo de la Fruta:\n' + lineas.join('\n') + '\n';
  if(totalKg>0) msg += 'Total kilos: ' + totalKg + ' kg\n';
  if(totalUn>0) msg += 'Total unidades: ' + totalUn + '\n';
  msg += 'Total: $' + Math.round(tot).toLocaleString('es-CL') + (p.fiado ? ' (FIADO)' : '') + '\nRevisa tu hoja impresa que va corcheteada en tu caja. \u00a1Gracias!';
  return msg;
}
function enviarWhatsAppPedido(i){
  const p = pedidosPendientes[i];
  const statusEl = document.getElementById('statusMsg');
  if(!p){ if(statusEl) statusEl.innerHTML = '<div class="status-msg warn">Ese pedido ya no esta en la hoja.</div>'; return; }
  const msg = construirMensajeWhatsAppPedido(p);
  let tel = '';
  try{ if(p.telefono) tel = normalizarTelefonoChile(p.telefono); }catch(e){}
  if(!tel) tel = obtenerTelefonoCliente(p.cliente);
  const url = tel ? 'https://wa.me/' + tel + '?text=' + encodeURIComponent(msg) : 'https://wa.me/?text=' + encodeURIComponent(msg);
  window.open(url, '_blank', 'noopener');
  if(statusEl) statusEl.innerHTML = '<div class="status-msg ok">' + (tel ? 'Abriendo WhatsApp de ' + escapeHtml(p.cliente) + ' (' + tel + '). ' : 'Abriendo WhatsApp. Elige a ' + escapeHtml(p.cliente) + ' porque ese pedido no tiene telefono guardado. ') + 'Se envio solo su pedido, no toda la hoja.</div>';
}
function compartirPorWhatsApp(){
  const res = construirMensajeWhatsApp();
  const statusEl = document.getElementById('statusMsg');
  if(!res){
    if(statusEl) statusEl.innerHTML = '<div class="status-msg warn">Primero analiza el pedido y agrega productos para compartir.</div>';
    return;
  }
  const url = res.telefono ? 'https://wa.me/' + res.telefono + '?text=' + encodeURIComponent(res.msg) : 'https://wa.me/?text=' + encodeURIComponent(res.msg);
  window.open(url, '_blank', 'noopener');
  if(statusEl) statusEl.innerHTML = '<div class="status-msg ok">' + (res.telefono ? 'Abriendo WhatsApp al cliente ' + res.telefono + '. ' : 'Mensaje listo para WhatsApp. Elige al cliente y env\u00edalo. ') + 'La hoja Word sigue lista para imprimir.</div>';
}
// Cablear boton WhatsApp (seguro, sin inline)
document.addEventListener('DOMContentLoaded', function(){
  const b = document.getElementById('btnCompartirWhatsApp');
  if(b) b.addEventListener('click', compartirPorWhatsApp);
});
// Fallback si DOMContentLoaded ya paso
(function(){
  const b = document.getElementById('btnCompartirWhatsApp');
  if(b && !b.dataset.cableado){ b.dataset.cableado='1'; b.addEventListener('click', compartirPorWhatsApp); }
})();

// ================= v0.8.0 - Clean UI: emoji, badges, bottom nav, carrito =================
function emojiParaProducto(nombre){
  const n = (nombre||'').toLowerCase();
  if(n.includes('pepino')) return '🥒';
  if(n.includes('tomate')) return '🍅';
  if(n.includes('zanahoria')) return '🥕';
  if(n.includes('lechuga')) return '🥬';
  if(n.includes('palta')||n.includes('aguacate')) return '🥑';
  if(n.includes('manzana')) return '🍎';
  if(n.includes('naranja')) return '🍊';
  if(n.includes('plátano')||n.includes('platano')||n.includes('banana')) return '🍌';
  if(n.includes('pera')) return '🍐';
  if(n.includes('uva')) return '🍇';
  if(n.includes('frutilla')||n.includes('fresa')) return '🍓';
  if(n.includes('limón')||n.includes('limon')) return '🍋';
  if(n.includes('cebolla')) return '🧅';
  if(n.includes('papa')||n.includes('patata')) return '🥔';
  if(n.includes('huevo')) return '🥚';
  if(n.includes('pimiento')||n.includes('piment')) return '🫑';
  if(n.includes('zapallo')||n.includes('calabaza')) return '🎃';
  if(n.includes('sandía')||n.includes('sandia')) return '🍉';
  if(n.includes('melón')||n.includes('melon')) return '🍈';
  if(n.includes('kiwi')) return '🥝';
  if(n.includes('choclo')||n.includes('maíz')||n.includes('maiz')) return '🌽';
  return '🥦';
}
// Envolver botones principales en flex cuando existen
function agruparAccionesPrincipales(){
  const wa = document.getElementById('btnCompartirWhatsApp');
  const word = document.getElementById('btnGenerar');
  if(wa && word && !wa.parentElement.classList.contains('acciones-principales')){
    const wrap = document.createElement('div');
    wrap.className = 'acciones-principales';
    wa.parentNode.insertBefore(wrap, wa);
    wrap.appendChild(wa); wrap.appendChild(word);
    wa.textContent = '💬 Enviar toda la hoja';
    word.textContent = '📄 Generar Word';
  }
}
// Bottom nav: scroll suave a secciones, sin esconder nada para no romper flujo
function initBottomNav(){ return; /* v1.0.10: los tabs los maneja showTab, este nav viejo solo hacia scroll y peleaba */ }
function actualizarCarrito(){
  const el = document.getElementById('cartCount');
  if(!el) return;
  const n = (typeof pedidosPendientes !== 'undefined' ? pedidosPendientes.length : 0) + (typeof itemsEnRevision !== 'undefined' && itemsEnRevision.length>0 ? 1 : 0);
  el.textContent = Math.max(n, 0);
  el.style.display = n===0 ? 'none' : 'flex';
}
document.addEventListener('DOMContentLoaded', ()=>{ agruparAccionesPrincipales(); initBottomNav(); actualizarCarrito(); });
setTimeout(()=>{ agruparAccionesPrincipales(); actualizarCarrito(); }, 800);

// v0.8.1 bottom nav DESACTIVADO en v1.0.10 - lo maneja showTab, el viejo solo hacia scroll
(function(){ return; })();

// ================= v0.9.1 Tabs independientes =================
function showTab(tab){ if(!tab) return;
  document.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));
  const page = document.getElementById('tab-'+tab);
  if(page) page.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b=>{
    const isActive = b.dataset.nav===tab;
    b.classList.toggle('active', isActive);
    b.style.background = isActive ? '#F0FDF4' : 'none';
    b.style.color = isActive ? '#14532D' : '#9CA3AF';
  });
  window.scrollTo({top:0, behavior:'instant'});
  try{ localStorage.setItem('castillo_tab_activa', tab); }catch(e){}
  if(tab==='clientes'){ if(typeof renderReporte==='function') renderReporte(); if(typeof renderClientesAutomaticos==='function') renderClientesAutomaticos(); }
  if(tab==='productos' && typeof renderListaProductosConfig==='function') renderListaProductosConfig();
  if(tab==='pedidos' && typeof renderPedidosPendientes==='function') renderPedidosPendientes();
}
function initTabsV091(){
  document.querySelectorAll('.nav-item').forEach(b=>{
    b.addEventListener('click', ()=> showTab(b.dataset.nav));
  });
  const cart = document.getElementById('btnCarrito');
  if(cart) cart.addEventListener('click', ()=> showTab('pedidos'));
  // Flujo: al agregar a la hoja, saltar a Pedidos
  const btnAdd = document.getElementById('btnAgregarPedidoALaHoja');
  if(btnAdd) btnAdd.addEventListener('click', ()=> setTimeout(()=> showTab('pedidos'), 250));
  // Al editar, volver a Inicio
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-action="editarPedidoPendiente"]');
    if(btn) setTimeout(()=> showTab('inicio'), 100);
  });
  // Tab guardada o Inicio por defecto
  let saved = 'inicio';
  try{ saved = localStorage.getItem('castillo_tab_activa') || 'inicio'; }catch(e){}
  if(!['inicio','pedidos','clientes','productos'].includes(saved)) saved='inicio';
  showTab(saved);
}
document.addEventListener('DOMContentLoaded', initTabsV091);

// ================= v1.0.10 CORREGIDA: productos nuevos + clientes automaticos =================
// Negocio fijo - ya no se edita
const NEGOCIO_FIJO = { nombre: 'El Castillo de la Fruta', direccion: '', telefono: '' };
function normTxt(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }
function lev(a,b){ const m=a.length,n=b.length; if(!m) return n; if(!n) return m; const d=Array.from({length:m+1},(_,i)=>[i]); for(let j=1;j<=n;j++) d[0][j]=j; for(let i=1;i<=m;i++){ for(let j=1;j<=n;j++){ d[i][j]=Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); } } return d[m][n]; }
function buscarProductoParecido(nombreMal){
  const n = normTxt(nombreMal);
  if(!n) return null;
  let catalogo = [];
  try{ catalogo = obtenerCatalogoUnificado(); }catch(e){ try{ catalogo = JSON.parse(localStorage.getItem('castillo_catalogo')||'[]'); }catch(e2){} }
  // 1) alias exacto
  for(const p of catalogo){ const alias = (p.alias||'').split(',').map(normTxt); if(alias.includes(n)) return {producto:p, tipo:'alias'}; }
  // 2) parecido por distancia (tolera 1-2 letras mal escritas: tomte -> tomate, savahoria -> zanahoria)
  let mejor=null, mejorDist=99;
  for(const p of catalogo){ const d = lev(n, normTxt(p.nombre||p.name||'')); if(d<mejorDist){ mejorDist=d; mejor=p; } }
  const umbral = n.length<=4 ? 1 : 2;
  if(mejor && mejorDist<=umbral) return {producto:mejor, tipo:'parecido', dist:mejorDist};
  return null;
}
window.buscarProductoParecido = buscarProductoParecido;
// Mostrar aviso cuando un producto del pedido no se reconocio
function mostrarProductosNoReconocidos(noReconocidos){
  const wrap = document.getElementById('revisionWrap');
  if(!wrap || !noReconocidos || !noReconocidos.length) return;
  const items = noReconocidos.map(function(it){
    const n = typeof it === 'string' ? it : (it.nombre || '');
    const cant = (typeof it === 'object' && it.cantidad) ? it.cantidad : 1;
    const uni = (typeof it === 'object' && it.unidad) ? it.unidad : '';
    const sug = buscarProductoParecido(n);
    const nombreSug = sug ? (sug.producto.nombre || sug.producto.name || '') : '';
    const btnSug = sug ? '<button type="button" data-corregir-a="' + escapeHtml(nombreSug) + '" data-corregir-de="' + escapeHtml(n) + '" style="margin-left:6px;padding:6px 10px;border:none;border-radius:999px;background:#14532D;color:#fff;font-weight:700;font-size:12px;">Usar ' + escapeHtml(nombreSug) + '</button>' : '';
    return '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #F3F4F6;"><span>\u26a0\ufe0f <b>' + escapeHtml(n) + '</b> (' + escapeHtml(String(cant)) + ' ' + escapeHtml(uni || 'unidad') + ') no est\u00e1 en la lista.</span>' + btnSug + '<button type="button" data-agregar-nuevo="' + escapeHtml(n) + '" data-cantidad="' + escapeHtml(String(cant)) + '" data-unidad="' + escapeHtml(uni || 'kg') + '" style="padding:6px 10px;border:1px solid #14532D;border-radius:999px;background:#fff;color:#14532D;font-weight:700;font-size:12px;">\uff0b Agregar como nuevo</button></div>';
  }).join('');
  const div = document.createElement('div');
  div.id='avisoNoReconocidos';
  div.style.cssText='background:#FFFBEB;border:1px solid #FDE68A;border-radius:14px;padding:12px;margin:10px 0;';
  div.innerHTML = '<b>\u00bfEl cliente escribi\u00f3 mal un producto?</b><p style="margin:4px 0 8px;color:#6B7280;font-size:13px;">No se perdi\u00f3. Elige corregirlo o agr\u00e9galo como producto nuevo y la pr\u00f3xima vez ya lo va a reconocer.</p>' + items;
  const old = document.getElementById('avisoNoReconocidos'); if(old) old.remove();
  wrap.prepend(div);
  div.querySelectorAll('[data-agregar-nuevo]').forEach(function(b){ b.addEventListener('click', function(){
    // v1.0.10: crea el producto altiro y re-analiza, sin perder cantidad/unidad
    const nombre = b.dataset.agregarNuevo; const cant = parseFloat(b.dataset.cantidad || '1') || 1; const uni = b.dataset.unidad || 'kg';
    try{
      const lista = obtenerCatalogoUnificado();
      if(!lista.some(function(p){ return normTxt(p.nombre||p.name) === normTxt(nombre); })){
        lista.push({ nombre: nombre, name: nombre, unidad: uni, precio: 0, alias: nombre });
        guardarCatalogoUnificado(lista);
      }
    }catch(e){}
    const ta = document.getElementById('textoInput');
    if(ta){ const btn = document.getElementById('btnAnalizarPedido'); if(btn) btn.click(); }
    const st = document.getElementById('statusMsg'); if(st) st.innerHTML = '<div class="status-msg ok">\u2705 ' + escapeHtml(nombre) + ' agregado. Ya aparece en la revisi\u00f3n.</div>';
  }); });
  div.querySelectorAll('[data-corregir-a]').forEach(function(b){ b.addEventListener('click', function(){
    // v1.0.10 IDs correctos: textoInput + btnAnalizarPedido (antes usaba pedidoTexto / btnAnalizar que no existen)
    const ta = document.getElementById('textoInput');
    if(ta){ ta.value = ta.value.split(b.dataset.corregirDe).join(b.dataset.corregirA); const btn = document.getElementById('btnAnalizarPedido'); if(btn) btn.click(); }
  }); });
}
window.mostrarProductosNoReconocidos = mostrarProductosNoReconocidos;
// --- Agregar producto nuevo ---
function initAgregarProductoNuevo(){
  const btn = document.getElementById('btnAgregarProductoNuevo'); if(!btn) return;
  const unidadSel = document.getElementById('nuevoProdUnidad');
  if(unidadSel) unidadSel.addEventListener('change', ()=>{ document.getElementById('nuevoProdUnidadLabel').textContent = unidadSel.value; });
  btn.addEventListener('click', ()=>{
    const nombre = (document.getElementById('nuevoProdNombre').value||'').trim();
    const unidad = unidadSel.value||'kg';
    const precio = parseFloat(document.getElementById('nuevoProdPrecio').value||'0')||0;
    const alias = (document.getElementById('nuevoProdAlias').value||'').trim();
    const msg = document.getElementById('msgNuevoProducto');
    if(!nombre){ msg.textContent='Escribe el nombre del producto.'; msg.style.color='#B91C1C'; return; }
    let cat=[]; try{ cat=JSON.parse(localStorage.getItem('castillo_catalogo')||'[]'); }catch(e){}
    if(cat.some(p=> normTxt(p.nombre||p.name)==normTxt(nombre))){ msg.textContent='Ese producto ya está en la lista.'; msg.style.color='#B91C1C'; return; }
    cat.push({ nombre, name:nombre, unidad, precio, alias });
    // v1.0.10: guardar en las 3 claves + memoria para que el parser lo vea altiro
    try{ guardarCatalogoUnificado(cat); }catch(e){ localStorage.setItem('castillo_catalogo', JSON.stringify(cat)); try{ localStorage.setItem('catalogo', JSON.stringify(cat)); }catch(e2){} }
    msg.textContent = `✅ ${nombre} agregado. Ya lo puedes usar en el próximo pedido.`; msg.style.color='#14532D';
    document.getElementById('nuevoProdNombre').value=''; document.getElementById('nuevoProdPrecio').value=''; document.getElementById('nuevoProdAlias').value='';
    renderListaProductosConfig();
    if(typeof renderCatalogo==='function') renderCatalogo();
  });
  const busc = document.getElementById('buscarProductoNuevo');
  if(busc) busc.addEventListener('input', renderListaProductosConfig);
}
function renderListaProductosConfig(){
  const cont = document.getElementById('listaProductosConfig'); if(!cont) return;
  let cat=[]; try{ cat=JSON.parse(localStorage.getItem('castillo_catalogo')||'[]'); }catch(e){}
  const q = normTxt(document.getElementById('buscarProductoNuevo')?.value||'');
  const filtrados = q ? cat.filter(p=> normTxt(p.nombre||p.name).includes(q)) : cat;
  const c2 = document.getElementById('catCount2'); if(c2) c2.textContent = cat.length;
  const cOld = document.getElementById('catCount'); if(cOld) cOld.textContent = cat.length;
  if(!filtrados.length){ cont.innerHTML='<p style="color:#6B7280;font-size:13px;">Sin productos con ese nombre. Agrégalo arriba.</p>'; return; }
  cont.innerHTML = filtrados.slice(-50).reverse().map(p=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #F3F4F6;"><span><b>${p.nombre||p.name}</b> <span style="color:#6B7280;">· ${p.unidad||'kg'}</span></span><b>$${(p.precio||0).toLocaleString('es-CL')}</b></div>`).join('');
}
// --- Clientes automaticos desde pedidos ---
function obtenerClientesAutomaticos(){
  // Fuente 1: pedidos pendientes + historial guardado
  let pedidos=[];
  try{ pedidos = JSON.parse(localStorage.getItem('castillo_pedidos')||localStorage.getItem('pedidosPendientes')||'[]'); }catch(e){}
  try{ const hist = JSON.parse(localStorage.getItem('castillo_historial')||'[]'); if(Array.isArray(hist)) pedidos = pedidos.concat(hist); }catch(e){}
  // Fuente 2: si la app guarda clientes viejos, los mezcla sin duplicar
  let viejos=[]; try{ viejos = JSON.parse(localStorage.getItem('castillo_clientes')||'[]'); }catch(e){}
  const mapa = new Map();
  const agregar = (nombre, info)=>{
    if(!nombre) return; const key = normTxt(nombre);
    if(!mapa.has(key)) mapa.set(key, { nombre: nombre.trim(), pedidos:0, total:0, productos:{}, localidad:'', telefono:'', correo:'', ultima:'', semanas:new Set() });
    const c = mapa.get(key); c.pedidos++; c.total += (info.total||0);
    (info.productos||[]).forEach(pr=>{ const k=pr.nombre||pr.name||pr; c.productos[k]=(c.productos[k]||0)+(pr.kg||pr.cantidad||1); });
    if(info.localidad) c.localidad=info.localidad; if(info.telefono) c.telefono=info.telefono; if(info.correo) c.correo=info.correo;
    if(info.fecha){ c.ultima=info.fecha; const d=new Date(info.fecha); const lunes=new Date(d); lunes.setDate(d.getDate()-((d.getDay()+6)%7)); c.semanas.add(lunes.toISOString().slice(0,10)); }
  };
  pedidos.forEach(p=> agregar(p.cliente||p.nombre||p.clienteNombre, { total:p.total||p.monto||0, productos:p.productos||p.items||[], localidad:p.localidad||p.direccion||p.direc, telefono:p.telefono||p.fono, correo:p.correo||p.email, fecha:p.fecha||p.createdAt }));
  viejos.forEach(v=> agregar(v.nombre||v.name, { localidad:v.localidad||v.direccion, telefono:v.telefono||v.fono, correo:v.correo||v.email }));
  return [...mapa.values()].sort((a,b)=> b.pedidos - a.pedidos);
}
function renderClientesAutomaticos(){
  const cont = document.getElementById('listaClientesAuto'); if(!cont) return;
  let lista = obtenerClientesAutomaticos();
  const q = normTxt(document.getElementById('buscarCliente')?.value||'');
  if(q) lista = lista.filter(c=> normTxt(c.nombre).includes(q) || normTxt(c.localidad).includes(q));
  const filtro = document.querySelector('.chip-semana.activo')?.dataset.filtroSemana || 'todas';
  if(filtro!=='todas'){
    const hoy=new Date(); const lunes=new Date(hoy); lunes.setDate(hoy.getDate()-((hoy.getDay()+6)%7));
    const semanaEsta = lunes.toISOString().slice(0,10);
    const lunesAnt = new Date(lunes); lunesAnt.setDate(lunes.getDate()-7); const semanaAnt = lunesAnt.toISOString().slice(0,10);
    lista = lista.filter(c=> c.semanas.has(filtro==='esta'? semanaEsta : semanaAnt));
  }
  const msg = document.getElementById('msgClientesAuto');
  if(!lista.length){ cont.innerHTML=''; if(msg) msg.textContent = 'Aún no hay clientes. Pega un pedido en Inicio y acá va a aparecer solo.'; return; }
  if(msg) msg.textContent = `${lista.length} cliente(s) · Ordenados por los que más piden`;
  cont.innerHTML = lista.map(c=>{
    const top = Object.entries(c.productos).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([n,k])=> `${n} (${k} kg)`).join(' · ') || 'Sin detalle de productos todavía';
    const contacto = [c.localidad, c.telefono, c.correo].filter(Boolean).join(' · ');
    return `<article style="background:#fff;border:1px solid #E8EDE9;border-radius:16px;padding:14px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;gap:8px;"><b style="font-size:16px;">${c.nombre}</b><span style="background:#F0FDF4;color:#14532D;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;white-space:nowrap;">${c.pedidos} pedido(s)</span></div>
      ${contacto? `<p style="margin:6px 0 0;color:#4B5563;font-size:13px;">${contacto}</p>` : `<p style="margin:6px 0 0;color:#9CA3AF;font-size:13px;">Sin localidad / teléfono todavía — agrégalo cuando lo tengas</p>`}
      <p style="margin:8px 0 0;font-size:13px;"><span style="color:#6B7280;">Siempre lleva:</span> <b>${top}</b></p>
      <p style="margin:4px 0 0;font-size:13px;color:#6B7280;">Total: <b style="color:#111;">$${c.total.toLocaleString('es-CL')}</b> · Último: ${c.ultima? new Date(c.ultima).toLocaleDateString('es-CL') : '—'}</p>
      <button data-pedido-cliente="${c.nombre.replace(/"/g,'')}" style="margin-top:10px;padding:8px 14px;border:1px solid #E5E7EB;border-radius:999px;background:#fff;font-weight:700;font-size:13px;">＋ Nuevo pedido para ${c.nombre.split(' ')[0]}</button>
    </article>`;
  }).join('');
  cont.querySelectorAll('[data-pedido-cliente]').forEach(b=> b.addEventListener('click', ()=>{
    const input = document.getElementById('clienteNombre') || document.querySelector('input[placeholder*="cliente" i]');
    if(input) input.value = b.dataset.pedidoCliente;
    showTab('inicio');
  }));
}
function initClientesAutomaticos(){
  const busc = document.getElementById('buscarCliente'); if(busc) busc.addEventListener('input', renderClientesAutomaticos);
  document.querySelectorAll('.chip-semana').forEach(ch=> ch.addEventListener('click', ()=>{
    document.querySelectorAll('.chip-semana').forEach(x=>{ x.classList.remove('activo'); x.style.background='#fff'; x.style.color='#111'; x.style.borderColor='#E5E7EB'; });
    ch.classList.add('activo'); ch.style.background='#14532D'; ch.style.color='#fff'; ch.style.borderColor='#14532D';
    renderClientesAutomaticos();
  }));
  const chip0 = document.querySelector('.chip-semana'); if(chip0) chip0.classList.add('activo');
}
document.addEventListener('DOMContentLoaded', ()=>{ initAgregarProductoNuevo(); initClientesAutomaticos(); renderListaProductosConfig(); renderClientesAutomaticos(); });

window.obtenerCatalogoUnificado = obtenerCatalogoUnificado;
window.normalizarTelefonoChile = normalizarTelefonoChile;
window.construirMensajeWhatsAppHoja = construirMensajeWhatsAppHoja;

window.enviarWhatsAppPedido = enviarWhatsAppPedido;
window.construirMensajeWhatsAppPedido = construirMensajeWhatsAppPedido;

window.vistaPreviaHoja = vistaPreviaHoja;
window.construirHtmlHoja = construirHtmlHoja;

window.descargarHoja = descargarHoja;

window.generarDocxReal = generarDocxReal;

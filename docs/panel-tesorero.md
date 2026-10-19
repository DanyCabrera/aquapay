# Panel de tesorería

El rol `tesorero` dispone de Dashboard, Emitir e Historial. Comparte con Administración el logo, las superficies, la navegación y los temas blanco y negro, manteniendo sus propios permisos y accesos.

## Módulos

- Dashboard: recaudación mensual por concepto, recibos emitidos, evolución anual, tarifa vigente, beneficiarios y viviendas activos, accesos de trabajo y los cinco recibos más recientes.
- Emitir: selección de beneficiario y vivienda activa, búsqueda por nombre o DPI, consulta de pendientes, tarifa anual o compra de chorro y resumen antes de registrar el cobro. La numeración mostrada es preliminar; el servidor asigna el número definitivo al guardar. Después se abre el visor PDF existente.
- Historial: búsqueda por nombre, DPI o recibo, año de pago, filtro por concepto, totales del listado, paginación, exportación CSV y consulta de PDF. La consulta devuelve como máximo 500 recibos; se indica este límite y se recomienda acotar por año o beneficiario al alcanzarlo.

Las listas usan tarjetas en pantallas menores de 768px y tablas desde ese ancho. El menú es un cajón en móvil y tablet, y una barra lateral desde 1024px. El resumen del cobro queda al lado del formulario a partir de 1280px y debajo en pantallas menores.

Los estados sin movimientos explican el siguiente paso. Los errores de conexión tienen reintento y se distinguen de las consultas sin resultados. Los indicadores muestran importes reales; no se crean pagos para completar el diseño.

## Verificación

Configurar `tesoreroDpi` y `tesoreroPassword` en `frontend/cypress.env.json` (ignorado por Git), o usar `E2E_TESORERO_DPI` y `E2E_TESORERO_PASSWORD`.

Desde `frontend`:

```powershell
npx tsc --noEmit
npm run cypress:typecheck
npm run test:e2e:tesorero -- --config baseUrl=http://localhost:3001
```

El backend debe estar disponible en el puerto 4100, o configurado mediante `E2E_API_URL`. La suite verifica la sesión real del rol, consulta beneficiarios y pendientes sin emitir cobros, comprueba los tres módulos a 360, 768 y 1280px y revisa los temas y el logo. Los casos de paginación, exportación y errores utilizan respuestas interceptadas exclusivas de la prueba; no escriben recibos en la base de datos.

# Panel de administrador

## Beneficiarios de demostración

Se registraron 20 personas ficticias con nombre, DPI sintético de 13 dígitos,
teléfono, dirección, año de inicio del servicio y fecha de instalación.
En conjunto tienen 24 viviendas y 28 chorros. No se generaron recibos ni pagos.
Los registros anteriores se conservaron.

El script `backend/scripts/seed-admin-beneficiarios.cjs` permite verificar o
completar estos mismos registros sin duplicarlos. Utiliza `E2E_ADMIN_DPI` y
`E2E_ADMIN_PASSWORD`, o las credenciales locales de `frontend/cypress.env.json`.
No imprime contraseñas ni tokens. Los DPI de demostración van de
`9902600000001` a `9902600000020`.

```powershell
cd backend
node scripts/seed-admin-beneficiarios.cjs
```

## Revisión de módulos

| Módulo | Cambios |
| --- | --- |
| Navegación | Fondo y barras blancos en tema claro y negros en tema oscuro; logo de `frontend/public/logo.png`, sección de comunidad y administración, usuario y rol reales y navegación móvil. |
| Dashboard | Indicadores del padrón, viviendas y chorros; gráfica mensual con ingresos reales; estado de registros; accesos rápidos; últimos beneficiarios y actividad de pagos. |
| Beneficiarios | Resumen de la consulta, filtros de estado, ordenación, búsqueda corregida, exportación CSV y confirmaciones de gestión. |
| Registro | Asistente visual de tres pasos, ayudas por etapa y edición de campos numéricos sin valores forzados. |
| Ficha | Información de contacto, fechas, viviendas y conexiones; edición de nombre y teléfono; gestión de viviendas, chorros y estado. |
| Consulta de pagos | Indicadores según los filtros, búsqueda y limpieza de filtros; guía cuando no hay movimientos; errores diferenciados de resultados vacíos. |
| Reportes | Padrón como vista inicial, cuatro categorías, resúmenes, búsqueda, paginación, filtro anual aplicado explícitamente y exportación PDF/CSV. |
| Tarifa | Tarifa vigente separada de cambios pendientes, simulador sin cobros, cantidad de conexiones y guardado habilitado solo al modificar un importe válido. |

Las secciones financieras permanecen sin movimientos si tesorería no ha emitido
recibos. No se agregan ingresos ficticios para llenar gráficos. Los indicadores
de conexiones suman la cantidad de chorros; el dashboard excluye beneficiarios
y viviendas inactivos del servicio activo.

## Verificación

```powershell
cd frontend
npx tsc --noEmit
npm run cypress:typecheck
# Con frontend en 3001:
$env:E2E_BASE_URL = 'http://localhost:3001'
npm run test:e2e:admin
```

La suite comprueba permisos, navegación móvil y oscura, registro y edición,
búsqueda, confirmaciones, eliminación y descargas. Sus registros temporales
usan DPI con prefijo `887`, independientes de los 20 beneficiarios de demostración.

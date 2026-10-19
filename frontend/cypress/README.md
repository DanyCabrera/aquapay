# E2E de ADMIN con Cypress

Esta suite usa únicamente una cuenta con rol `administrador` (ADMIN). Trabaja
contra el frontend, el backend y la base de datos reales, sin respuestas simuladas.
Las pruebas existentes de Playwright siguen usando su propio comando.

## Preparación

Desde `frontend`, ejecutar `npm install`. Tener el backend configurado con su
base de datos y una cuenta ADMIN activa; la suite no crea cuentas del sistema
ni restablece contraseñas.

Copiar `cypress.env.example.json` a `cypress.env.json` y completar las credenciales
de una cuenta ADMIN de pruebas. Mantener el DPI como cadena de 13 dígitos.
`cypress.env.json` está excluido de Git.

También se pueden usar `E2E_ADMIN_DPI` y `E2E_ADMIN_PASSWORD` como variables
de entorno, sin crear el archivo.

## Ejecución

Levantar los servidores en terminales separadas:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

Después, desde `frontend`:

```powershell
# Ejecutar únicamente la suite ADMIN, sin abrir la interfaz de Cypress
npm run test:e2e:admin

# Abrir la interfaz de Cypress y seleccionar admin.cy.ts
npm run cypress:open
```

Por defecto, frontend: `http://localhost:3000`; backend: `http://localhost:4100`.
Para otros puertos, configurar `E2E_BASE_URL` y `E2E_API_URL`. El frontend debe
tener `NEXT_PUBLIC_API_URL` apuntando al mismo backend que las pruebas.
Los comandos de Cypress requieren que ambos servidores estén levantados.

## Cobertura

- Login por interfaz, comprobación del rol devuelto por el backend y recarga.
- Validación de DPI y contraseña, contraseña inválida, rutas sin sesión,
  cierre de sesión y bloqueo posterior.
- Dashboard y menú de ADMIN.
- Navegación móvil y tema oscuro con identidad de Administrador.
- Redirección de ADMIN desde Emitir, Emitir nuevo e Historial.
- Respuesta HTTP 403 al intentar operaciones de tesorería con el token ADMIN.
- Registro por interfaz de persona, vivienda y chorro; búsqueda por DPI.
- Búsqueda por nombre y edición persistente del teléfono desde la ficha.
- Confirmaciones visuales con cancelación, desactivación persistente y reactivación.
- Eliminación del beneficiario de prueba y comprobación de respuesta 404 posterior.
- Consulta de pagos del beneficiario sin recibos.
- Lectura de tarifa, simulador, guardado sin cambios deshabilitado y lugar de pago de solo lectura.
- Reportes de ingresos, recibos, viviendas y usuarios; descarga de PDF.

## Datos y resultados

Ejecutar contra una base de pruebas: cada corrida crea una persona llamada
`E2E Cypress ADMIN …`, con DPI que empieza por `887`, su vivienda y un chorro.
El flujo completo elimina esa persona, su vivienda y su chorro al finalizar.
Si un paso falla antes de eliminar, el `afterEach` desactiva la persona como limpieza.
Si se interrumpe el proceso abruptamente, desactivar manualmente el registro.
No se emiten cobros ni se cambia la tarifa compartida.

Cypress imprime los resultados en la terminal y guarda capturas de las confirmaciones y de fallos en
`cypress/screenshots/`; el PDF descargado queda en `cypress/downloads/`.
Estas carpetas están excluidas de Git. Los tipos de Cypress se comprueban con
`npm run cypress:typecheck`, separados de los tipos de Next.js y Playwright.

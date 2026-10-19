# E2E del panel tesorero

Pruebas de Playwright sobre login, permisos, dashboard, emitir (vista previa PDF, imprimir y descargar), historial y el menú.

## Cómo correrlas

Con frontend en `http://localhost:3000` y backend en `http://localhost:4100`:

```bash
cd frontend
npm run test:e2e
```

Si los servidores no están arriba, Playwright intenta levantarlos y reutiliza los que ya responden.

## Cuentas

- Tesorero: DPI `9990000000003` / `AquaPayHist1!`
- Admin (solo para crear y desactivar el beneficiario de prueba): DPI `9990000000009` / `AquaPayHist1!`

Si el login del tesorero falla, el setup llama a `POST /api/auth/restablecer-password` y deja otra vez `AquaPayHist1!`.

## Semilla

Cada corrida de emitir e historial crea un beneficiario nuevo `E2E Tesorero …`, con DPI que empieza en `888`, una vivienda del año en curso y un chorro. Historial además cobra esa tarifa por API. Al terminar se desactiva el beneficiario. Los recibos no se borran.

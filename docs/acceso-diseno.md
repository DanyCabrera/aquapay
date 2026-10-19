# Diseño de acceso

Login y registro comparten `AuthShell`, el logo de AquaPay, la paleta de los paneles y los temas blanco y negro.

Desde 1024px se muestran dos columnas: una presentación breve de la marca y el formulario. En móvil y tablet se oculta la presentación y se limita el formulario a 460px, manteniendo el desplazamiento vertical cuando sea necesario. Los campos y botones principales tienen 48px de altura.

Se conservan el formato del DPI, las validaciones, la visibilidad de contraseña, el indicador de fortaleza, el consentimiento, el acceso a recuperación y la selección de rol según las opciones devueltas por el backend. Los textos se limitan al propósito de cada formulario y a una presentación breve del servicio.

La suite `frontend/cypress/e2e/auth-design.cy.ts` verifica los dos temas, el logo, los anchos 360/768/1280px, las validaciones, la navegación y un inicio de sesión real de TESORERO. No crea cuentas ni restablece contraseñas.

```powershell
# Desde frontend, con los servidores activos y la cuenta de prueba configurada.
node node_modules/cypress/bin/cypress run --e2e --browser electron --spec cypress/e2e/auth-design.cy.ts --config baseUrl=http://localhost:3001
```

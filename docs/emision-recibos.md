# Emisión de recibos

Desde 1280px, el resumen del paso 3 conserva su posición inicial respecto de la pantalla al desplazar el formulario. Se ajusta al ancho disponible si se contrae el menú o cambia la ventana. Si el contenido del resumen supera la altura disponible, tiene desplazamiento propio para mantener accesible el botón Emitir. En pantallas menores permanece dentro del flujo del formulario.

El paso 2 incluye Descripción (opcional), con un máximo de 500 caracteres. El texto se recorta en los extremos y se envía en `descripcionPago` para tarifa anual y compra de chorro. Si está vacío o solo contiene espacios, se usa la descripción automática. Se conserva si el cobro falla y se limpia después de emitir correctamente.

El PDF distribuye las descripciones en líneas y reserva el espacio necesario antes del total y la firma.

Verificación realizada: dos casos Cypress en `frontend/cypress/e2e/tesorero-emision.cy.ts`, tres pruebas de PDF en `backend/src/services/pdf.service.test.ts`, TypeScript de frontend y backend y ESLint de los componentes. Los POST de cobro se interceptan en Cypress: no se generan pagos reales.

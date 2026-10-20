# Emisión de recibos

Desde 1280px, el resumen del paso 3 conserva su posición inicial respecto de la pantalla al desplazar el formulario. Se ajusta al ancho disponible si se contrae el menú o cambia la ventana. Si el contenido del resumen supera la altura disponible, tiene desplazamiento propio para mantener accesible el botón Emitir. En pantallas menores permanece dentro del flujo del formulario.

En teléfono, el correlativo aparece dentro del encabezado y sale de la pantalla al desplazarse; no se superpone a la fecha ni a la descripción. Los controles tienen un mínimo de 48px y texto de 16px. El resumen y los recibos recientes ocupan todo el ancho disponible. Se comprueban los anchos de 320, 390 y 633px, además del comportamiento fijo en escritorio.

El paso 2 incluye Descripción (opcional), con un máximo de 500 caracteres. El texto se recorta en los extremos y se envía en `descripcionPago` para tarifa anual y compra de chorro. Si está vacío o solo contiene espacios, se usa la descripción automática. Se conserva si el cobro falla y se limpia después de emitir correctamente.

El PDF distribuye las descripciones en líneas y reserva el espacio necesario antes del total y la firma.

La suite `frontend/cypress/e2e/tesorero-emision.cy.ts` contiene cinco casos: resumen fijo, descripción opcional y tres anchos de teléfono. Las tres pruebas de PDF están en `backend/src/services/pdf.service.test.ts`. Los POST de cobro se interceptan en Cypress: no se generan pagos reales.

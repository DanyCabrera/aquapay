# Correcciones QA del panel tesorero

Referencia: Informe_QA_Panel_Tesorero_AquaPay.docx, 20 de octubre de 2026.

| Hallazgo | Resolución local | Validación |
| --- | --- | --- |
| QA-T01 | El rediseño anterior eliminó el saludo recortado. La identificación conserva el nombre completo, sin añadir texto redundante. | Usuario simulado «QA Tesorero AquaPay»: nombre completo visible y ausencia de «Hola, QA.». |
| QA-T02 | Contador en una sola cadena, sin espacio antes del punto, con búsqueda sin espacios exteriores y concordancia singular/plural. | Búsqueda con un resultado y sin resultados. |
| QA-T03 | «1 recibo» en singular; «recibos» para cero o varios. | Historial con 0, 1 y 2 registros. |
| QA-T04 | Tras confirmar el cobro se restablecen Tarifa anual, año actual y selección de chorro. | Compra exitosa simulada: visor abierto, formulario limpio y correlativo actualizado. Si falla, se conservan concepto, beneficiario y descripción. |

La suite `frontend/cypress/e2e/tesorero-qa.cy.ts` simula toda la API. No crea cuentas, emite pagos reales ni elimina beneficiarios.

La impresión nativa y la lectura visual del PDF en Chrome/Edge, señaladas como pruebas pendientes en el informe, no se presentan como defectos corregidos por estos cambios. No se realiza despliegue a producción.

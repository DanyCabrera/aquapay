# Correcciones QA del administrador

Referencia: Informe_QA_Panel_Administrador_AquaPay.docx, 20 de octubre de 2026. El informe enumera un hallazgo medio y cuatro bajos, sin fallos altos.

Orden aplicado:

1. **QA-A01 (medio):** saludo con el nombre completo y sin espacios exteriores antes del punto. Se elimina la frase adicional para mantener el encabezado breve.
2. **QA-A02 (bajo):** captura del DPI con presentación 4-5-4, validación de los 13 dígitos y envío de solo números a la API.
3. **QA-A03 (bajo):** formato 4-5-4 en las celdas DPI de reportes. La búsqueda acepta también el DPI agrupado. Los datos originales de la exportación CSV se conservan.
4. **QA-A05 (bajo):** botón Editar dirección en cada vivienda, exclusivo del administrador. Usa el PATCH existente, protegido por rol, y envía únicamente la dirección corregida. No cambia el año de cobro, estado ni conexiones. Valida de 3 a 300 caracteres, permite cancelar y conserva lo escrito si falla.
5. **QA-A04 (bajo):** singular «1 chorro» y plural para las demás cantidades en el simulador.

La suite `frontend/cypress/e2e/admin-qa.cy.ts` comprueba los cinco hallazgos y el manejo de errores al editar la dirección. Simula toda la API, incluido el almacenamiento y la lectura posterior de la dirección; no modifica el padrón ni la tarifa de producción.

La lectura visual del PDF y la impresión nativa figuran como pruebas pendientes en el informe, no como defectos reproducidos. No se eliminan registros de QA ni se despliega a producción como parte de estos cambios.

## Limpieza visual del panel administrador

- Inicio conserva saludo completo, indicadores, gráfico, padrón y actividad reciente; se retiran accesos duplicados y subtítulos que repiten el título.
- Beneficiarios y su ficha tienen encabezados y estados vacíos breves. Se mantienen confirmaciones de eliminación/estado y la restricción de edición del DPI.
- Registro utiliza una columna centrada con ancho máximo, sin la tarjeta de instrucciones laterales. Mantiene los tres pasos y las validaciones.
- Pagos elimina la guía de uso en el estado vacío y el recordatorio del rol.
- Reportes compacta las categorías y retira la tarjeta de ayuda. Conserva una nota breve que diferencia el PDF completo del CSV filtrado.
- Tarifa simplifica las explicaciones y conserva unidades, simulación, compra separada y aviso de cambios sin guardar.

Verificación con la suite admin-qa: regresiones del informe y recorrido de siete páginas a 390 y 1280 px en ambos temas. Datos y escrituras simulados.

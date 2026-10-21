"""Informe de QA manual del panel administrador. No altera la aplicación."""
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from pathlib import Path

NAVY = RGBColor(0x14, 0x34, 0x59)
OUT = Path(__file__).resolve().parent / "Informe_QA_Panel_Administrador_AquaPay.docx"


def set_run_font(run, name="Times New Roman", size=12, bold=False, italic=False, color=None):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color is not None:
        run.font.color.rgb = color


def shade_cell(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def paragraph(doc, text, size=12, bold=False, align="left", space_after=8, italic=False, color=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "justify":
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r = p.add_run(text)
    set_run_font(r, "Times New Roman", size, bold, italic, color)
    return p


def heading(doc, text, level=1):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(8)
    r = p.add_run(text)
    set_run_font(r, "Calibri", 14 if level == 1 else 12, True, color=NAVY)


def add_page_number(paragraph_obj):
    run = paragraph_obj.add_run()
    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld2 = OxmlElement("w:fldChar")
    fld2.set(qn("w:fldCharType"), "end")
    run._r.append(fld1)
    run._r.append(instr)
    run._r.append(fld2)


def table(doc, headers, rows):
    tbl = doc.add_table(rows=1 + len(rows), cols=len(headers))
    tbl.style = "Table Grid"
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers):
        cell = tbl.rows[0].cells[i]
        cell.text = ""
        r = cell.paragraphs[0].add_run(h)
        set_run_font(r, "Calibri", 9, True, color=RGBColor(255, 255, 255))
        shade_cell(cell, "143459")
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            cell = tbl.rows[ri + 1].cells[ci]
            cell.text = ""
            r = cell.paragraphs[0].add_run(val)
            set_run_font(r, "Calibri", 9)
            if ri % 2 == 1:
                shade_cell(cell, "F4F7FB")
    doc.add_paragraph().paragraph_format.space_after = Pt(6)


def bullets(doc, items):
    for b in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(b)
        set_run_font(r, "Times New Roman", 12)


def build():
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Cm(2.5)
    sec.bottom_margin = Cm(2.5)
    sec.left_margin = Cm(2.5)
    sec.right_margin = Cm(2.5)
    sec.page_width = Cm(21.59)
    sec.page_height = Cm(27.94)
    normal = doc.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal.font.size = Pt(12)

    header = sec.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    set_run_font(header.add_run("AquaPay  ·  Aldea Sibaná"), "Calibri", 10, color=NAVY)
    footer = sec.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(footer.add_run("Informe de QA  ·  Panel administrador    "), "Calibri", 10, color=NAVY)
    add_page_number(footer)

    paragraph(doc, "INFORME DE QA MANUAL", size=14, bold=True, align="center", space_after=2)
    paragraph(doc, "Panel administrador de AquaPay", size=16, bold=True, align="center", space_after=6)
    paragraph(
        doc,
        "Fecha: 20 de octubre de 2026. Ambiente: producción (https://aquapay-silk.vercel.app contra https://aquapay-production.up.railway.app). No se modificó código ni se hizo commit. La tarifa se restauró a Q 120.00. No se borró a ningún vecino real.",
        size=11,
        italic=True,
        align="center",
        space_after=12,
        color=RGBColor(0x55, 0x55, 0x55),
    )

    heading(doc, "1. Resumen")
    paragraph(
        doc,
        "El panel administrador en producción sirve para el padrón, la consulta de pagos, los reportes y la tarifa. El administrador entra, restablece su clave, recorre el menú propio y no entra a Emitir ni a Historial. No se reprodujo ningún fallo alto. Se reprodujeron 1 fallo medio y 4 fallos bajos. Ninguno bloquea la administración del padrón, la consulta de pagos, los reportes ni la tarifa.",
        align="justify",
    )
    table(
        doc,
        ["Severidad", "Cantidad", "¿Bloquea padrón / pagos / reportes / tarifa?"],
        [
            ["Alta", "0", "No"],
            ["Media", "1", "No"],
            ["Baja", "4", "No"],
        ],
    )

    heading(doc, "2. Condiciones de la prueba")
    paragraph(
        doc,
        "Se usó la cuenta de administrador DPI 1234 34205 1109 (DANY ABIMAEL CABRERA HERNANDEZ). El restablecer de esta misma cuenta se recorrió y, al terminar, se restauró la clave original. Se registró un beneficiario de QA, DPI 8880 00000 0888, nombre QA Beneficiario AquaPay, teléfono 55559999, vivienda «Vivienda QA, lote 88, Aldea Sibaná», 1 chorro, cobro desde 2026. Quedó activo. No se emitieron recibos a su nombre. No se tocó a María Fernanda López García ni a Ana Lucía Ramírez Morales. La tarifa vigente al inicio era Q 120.00; se cambió a Q 99.99 y se restauró de inmediato a Q 120.00.",
        align="justify",
    )

    heading(doc, "3. Lo que funciona")
    bullets(
        doc,
        [
            "Login: campos vacíos dejan Iniciar Sesión deshabilitado. El DPI se muestra 4-5-4 (1234 34205 1109). Credenciales inválidas: «DPI o contraseña incorrectos.» Con la cuenta de administrador se entra al dashboard.",
            "Restablecer: DPI inexistente «No hay una cuenta activa con ese DPI.» Claves distintas dejan Restablecer deshabilitado. Un cambio válido muestra «Contraseña actualizada. Entre con el mismo DPI.» y permite entrar con la clave nueva.",
            "Menú del administrador: Dashboard, Beneficiarios, Consultar pago, Reportes y Tarifa. No aparecen Emitir ni Historial. Hay un acceso Registrar (atajo a /usuarios/nuevo) y Salir.",
            "Dashboard: 24 beneficiarios activos, 25 en el padrón, 28 viviendas, 35 chorros, total cobrado Q 1,740.00 (3 recibos del mes). Accesos a padrón, consultar pago, reportes y tarifa. No ofrece Emitir ni Historial.",
            "Beneficiarios: listado de 10 en 10 (1–10 de 24, luego 11–20). Búsqueda por nombre (Ana Lucía → 1) y por DPI 9902600000001 (María Fernanda). Filtro Activos (23) e Inactivos (el de QA al desactivarlo). El DPI del listado se ve 4-5-4.",
            "Registrar QA: persona + vivienda + 1 chorro, precio Q 1,500.00. Queda activo, con ficha 8880 00000 0888, 1 vivienda y 1 chorro. Mensaje «Beneficiario registrado correctamente».",
            "DPI repetido: «Ya existe un usuario de comunidad con ese DPI» y no avanza al paso 2.",
            "Editar ficha: el teléfono pasó de 55558888 a 55559999 y el detalle coincidió. El DPI no se modifica desde esta ficha.",
            "Desactivar: pasa a Inactivos. El listado de cobro del tesorero (GET /api/usuarios filtrado por activo) no lo incluye. Al activar de nuevo vuelve al padrón activo.",
            "Consultar pago: 2 personas y 3 recibos en 2026, Q 1,740.00. Agrupa último pago y total (María Fernanda Q 1,620.00 tarifa y chorro; Ana Lucía Q 120.00). Filtro por nombre, por DPI y año 2025 vacío (0 personas, Q 0.00). Ver recibos abre 002 y 003. Ver PDF pide el archivo con token (sin sesión, 401; con sesión, PDF %PDF-1.7). El cuadro tiene Cerrar, Imprimir y Descargar. Al cerrar, el listado sigue igual.",
            "Reportes: Usuarios 25 filas (padrón completo), Viviendas 28, Recibos 2026 con 3 filas e importe Q 1,740.00, Ingresos 2026 con 1 mes. Año 2025 de recibos: 0 filas y «Sin movimientos en este período». Búsqueda «Ana Lucía» deja 1–1 de 1. Paginación de 12 (1–12 y 13–24 de 25). El PDF de usuarios se descarga como application/pdf.",
            "Tarifa: vigente Q 120.00. Lugar de pago de solo lectura: Aldea Sibaná, El Asintal, Retalhuleu. 0 y −10 dejan Guardar deshabilitado y no cambian la vigente. El simulador con 2 chorros × Q 99.99 = Q 199.98; no genera recibos. Guardar Q 99.99 muestra la nueva vigente; restaurar Q 120.00 la deja otra vez en 120.",
            "Autorización: /facturacion y /historial con sesión de administrador vuelven a /dashboard. Sin sesión, /usuarios y /reportes piden login. Salir vuelve a Entrar.",
            "Celular (390×844): menú hamburguesa con las mismas cinco rutas de administración. Las tarjetas del dashboard se apilan y no quedan tapadas. Escritorio: menú lateral, tablas y formulario de tarifa caben en pantalla.",
        ],
    )

    heading(doc, "4. Tabla de defectos")
    table(
        doc,
        ["Id", "Sev.", "Pantalla", "Pasos", "Resultado actual", "Resultado esperado", "¿Bloquea padrón / pagos / reportes / tarifa?"],
        [
            [
                "QA-A01",
                "Media",
                "Dashboard",
                "Entrar como DANY ABIMAEL CABRERA HERNANDEZ.",
                "El saludo dice «Hola, DANY .» Toma solo la primera palabra y deja un espacio antes del punto.",
                "Debe saludar con un nombre que identifique a la persona, sin recorte ni espacio suelto.",
                "No",
            ],
            [
                "QA-A02",
                "Baja",
                "Registrar",
                "En el paso 1 escribir un DPI de 13 dígitos.",
                "El campo muestra 8880000000888, sin grupos 4-5-4. El placeholder sí pide 0000 00000 0000.",
                "El DPI se captura con 13 dígitos y se muestra 4-5-4, como en Entrar y en la ficha.",
                "No",
            ],
            [
                "QA-A03",
                "Baja",
                "Reportes · Usuarios",
                "Abrir el reporte de usuarios.",
                "La columna DPI sale en crudo (9902600000003). En Beneficiarios y Consultar pago sí se ve 4-5-4.",
                "El DPI debe mostrarse 4-5-4 en todas las tablas de administración.",
                "No",
            ],
            [
                "QA-A04",
                "Baja",
                "Tarifa",
                "Dejar el simulador en 1 chorro.",
                "Texto «1 chorros × Q 120.00 / año».",
                "«1 chorro» cuando la cantidad es uno.",
                "No",
            ],
            [
                "QA-A05",
                "Baja",
                "Ficha del beneficiario",
                "Abrir QA Beneficiario AquaPay y buscar cómo cambiar la dirección de la vivienda ya creada.",
                "Editar datos solo permite nombre y teléfono. Se puede agregar otra vivienda o otro chorro, no editar la dirección existente.",
                "La ficha debería permitir corregir la dirección de una vivienda registrada, o dejar claro que hay que dar de alta otra.",
                "No",
            ],
        ],
    )

    heading(doc, "5. Orden sugerido de corrección")
    paragraph(
        doc,
        "1. QA-A01: el administrador ve el dashboard en cada sesión; el mismo recorte ya se vio en tesorería. 2. QA-A02 y QA-A03: unificar el formato 4-5-4 del DPI en registrar y en el reporte de usuarios. 3. QA-A05: permitir editar la dirección o documentar que solo se agrega una vivienda nueva. 4. QA-A04: plural del simulador.",
        align="justify",
    )

    heading(doc, "6. Pruebas que no se pudieron completar")
    bullets(
        doc,
        [
            "Diálogo nativo de Imprimir: el botón Imprimir se habilita cuando el PDF carga, pero en este navegador embebido no se abrió un cuadro de impresión comprobable.",
            "Vista previa visual del PDF: el visor abre Recibo 003 con Cerrar, Imprimir y Descargar. El archivo autenticado es %PDF-1.7, pero el recuadro se vio negro en este navegador. Hay que confirmar en Chrome o Edge de escritorio que las páginas se leen. No se reporta como defecto de producto.",
            "Exportar CSV desde el botón de la pantalla: en Recibos 2025 (vacío) el botón queda deshabilitado, correcto. No se pulsó Exportar CSV sobre un reporte con filas; el PDF de usuarios sí se descargó por API.",
            "Eliminar vivienda o chorro con recibos: en la ficha no hay un control de eliminar vivienda ni chorro. No se forzó el bloqueo de la base. No se intentó borrar las viviendas de María Fernanda ni de Ana Lucía.",
        ],
    )

    heading(doc, "7. Observaciones (no son defectos de código)")
    paragraph(
        doc,
        "En el padrón siguen apareciendo fichas «E2E Cypress ADMIN…». No son vecinos reales. El botón Registrar del menú es un atajo a dar de alta; no sustituye a Beneficiarios. El restablecer contraseña solo con el DPI es el diseño actual. El texto de la tesis en Entrar no se reporta. El panel tesorero no se recorrió, salvo comprobar que un inactivo no entra en el listado de cobro y que el administrador no abre Emitir ni Historial. El beneficiario de QA 8880 00000 0888 quedó activo y sin recibos; se puede borrar si ya no se necesita.",
        align="justify",
    )

    heading(doc, "8. Conclusión")
    paragraph(
        doc,
        "El administrador puede cuidar el padrón, consultar quién pagó, sacar reportes y cambiar la tarifa sin perder el control de cobros siguientes. Los cinco defectos reproducidos son de saludo, formato de DPI, copia del simulador y la falta de edición de una dirección ya guardada. Ninguno detiene la operación. Lo primero a corregir es el saludo del dashboard.",
        align="justify",
    )

    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    build()

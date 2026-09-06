# -*- coding: utf-8 -*-
"""
Genera la documentacion tecnica-academica de AquaPay en formato Word (.docx).

Todo el contenido esta basado en evidencia extraida del codigo fuente del
proyecto. Los puntos no verificables se marcan como [INFORMACION FALTANTE].
"""

import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(OUT_DIR, "Documentacion-Tecnica-AquaPay.docx")
DIAG = os.path.join(OUT_DIR, "mermaid_diagramas")

ACCENT = RGBColor(0x0A, 0x0A, 0x0A)
MUTED = RGBColor(0x60, 0x60, 0x60)
WARN = RGBColor(0xB0, 0x30, 0x30)

doc = Document()

# ---------------------------------------------------------------- estilos ---
normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(11)
normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.15

for name, size, color in (
    ("Heading 1", 16, ACCENT),
    ("Heading 2", 13, ACCENT),
    ("Heading 3", 11.5, ACCENT),
):
    st = doc.styles[name]
    st.font.name = "Calibri"
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = color
    st.paragraph_format.space_before = Pt(14 if name == "Heading 1" else 10)
    st.paragraph_format.space_after = Pt(6)
    st.paragraph_format.keep_with_next = True

section = doc.sections[0]
section.top_margin = Cm(2.5)
section.bottom_margin = Cm(2.5)
section.left_margin = Cm(3.0)
section.right_margin = Cm(2.5)


# --------------------------------------------------------------- helpers ---
def h1(text):
    doc.add_page_break()
    return doc.add_heading(text, level=1)


def h1_nobreak(text):
    return doc.add_heading(text, level=1)


def h2(text):
    return doc.add_heading(text, level=2)


def h3(text):
    return doc.add_heading(text, level=3)


def p(text, italic=False, bold=False, color=None, align=None):
    par = doc.add_paragraph()
    run = par.add_run(text)
    run.italic = italic
    run.bold = bold
    if color is not None:
        run.font.color.rgb = color
    if align is not None:
        par.alignment = align
    else:
        par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    return par


def bullet(text, level=0):
    par = doc.add_paragraph(text, style="List Bullet")
    par.paragraph_format.left_indent = Cm(0.8 + 0.6 * level)
    par.paragraph_format.space_after = Pt(2)
    return par


def numbered(text):
    par = doc.add_paragraph(text, style="List Number")
    par.paragraph_format.space_after = Pt(2)
    return par


def shade(paragraph, hexcolor):
    pr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), hexcolor)
    pr.append(shd)


def code(text, caption=None):
    if caption:
        cap = doc.add_paragraph()
        r = cap.add_run(caption)
        r.italic = True
        r.font.size = Pt(9)
        r.font.color.rgb = MUTED
        cap.paragraph_format.space_after = Pt(2)
    par = doc.add_paragraph()
    par.paragraph_format.left_indent = Cm(0.4)
    par.paragraph_format.space_before = Pt(4)
    par.paragraph_format.space_after = Pt(8)
    run = par.add_run(text)
    run.font.name = "Consolas"
    run.font.size = Pt(8.5)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Consolas")
    shade(par, "F4F4F5")
    return par


def note(text, color=WARN):
    par = doc.add_paragraph()
    par.paragraph_format.left_indent = Cm(0.4)
    par.paragraph_format.space_before = Pt(4)
    par.paragraph_format.space_after = Pt(8)
    run = par.add_run(text)
    run.font.size = Pt(10)
    run.bold = True
    run.font.color.rgb = color
    shade(par, "FDF3F3" if color == WARN else "F1F5F9")
    return par


def missing(what):
    return note("[INFORMACION FALTANTE] " + what)


def placeholder(text):
    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = par.add_run("[" + text + "]")
    run.italic = True
    run.font.size = Pt(9.5)
    run.font.color.rgb = MUTED
    shade(par, "F8F8F8")
    par.paragraph_format.space_before = Pt(6)
    par.paragraph_format.space_after = Pt(10)
    return par


def fig(filename, caption, width_cm=15.0):
    """Inserta un diagrama PNG generado a partir de Mermaid."""
    FIG_COUNT[0] += 1
    path = os.path.join(DIAG, filename)
    if os.path.exists(path):
        doc.add_picture(path, width=Cm(width_cm))
        doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    else:
        placeholder("Diagrama no encontrado: " + filename)
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = cap.add_run("Figura %d. %s" % (FIG_COUNT[0], caption))
    r.italic = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = MUTED
    cap.paragraph_format.space_after = Pt(8)
    return cap


TABLE_COUNT = [0]
FIG_COUNT = [0]


def table(headers, rows, widths=None, caption=None, font_size=8.5):
    TABLE_COUNT[0] += 1
    if caption:
        cap = doc.add_paragraph()
        r = cap.add_run("Tabla %d. %s" % (TABLE_COUNT[0], caption))
        r.bold = True
        r.font.size = Pt(9)
        cap.paragraph_format.space_before = Pt(8)
        cap.paragraph_format.space_after = Pt(3)

    t = doc.add_table(rows=1, cols=len(headers))
    try:
        t.style = "Table Grid"
    except KeyError:
        pass
    t.alignment = WD_TABLE_ALIGNMENT.CENTER

    hdr = t.rows[0].cells
    for i, htxt in enumerate(headers):
        hdr[i].text = ""
        par = hdr[i].paragraphs[0]
        run = par.add_run(str(htxt))
        run.bold = True
        run.font.size = Pt(font_size)
        par.paragraph_format.space_after = Pt(0)
        shade(par, "E8E8EA")

    for row in rows:
        cells = t.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = ""
            par = cells[i].paragraphs[0]
            run = par.add_run("" if val is None else str(val))
            run.font.size = Pt(font_size)
            par.paragraph_format.space_after = Pt(0)

    if widths:
        for r_ in t.rows:
            for i, w in enumerate(widths):
                r_.cells[i].width = Cm(w)

    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


def rf_card(rid, nombre, descripcion, actor, precond, flujo, resultado):
    rows = [
        ("Identificador", rid),
        ("Nombre", nombre),
        ("Descripcion", descripcion),
        ("Actor", actor),
        ("Precondiciones", precond),
        ("Flujo principal", flujo),
        ("Resultado esperado", resultado),
    ]
    t = doc.add_table(rows=0, cols=2)
    try:
        t.style = "Table Grid"
    except KeyError:
        pass
    for k, v in rows:
        cells = t.add_row().cells
        cells[0].text = ""
        pk = cells[0].paragraphs[0]
        rk = pk.add_run(k)
        rk.bold = True
        rk.font.size = Pt(8.5)
        pk.paragraph_format.space_after = Pt(0)
        shade(pk, "F1F1F3")
        cells[1].text = ""
        pv = cells[1].paragraphs[0]
        rv = pv.add_run(v)
        rv.font.size = Pt(8.5)
        pv.paragraph_format.space_after = Pt(0)
        cells[0].width = Cm(3.6)
        cells[1].width = Cm(12.4)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    return t


def add_toc():
    par = doc.add_paragraph()
    run = par.add_run()
    f1 = OxmlElement("w:fldChar")
    f1.set(qn("w:fldCharType"), "begin")
    it = OxmlElement("w:instrText")
    it.set(qn("xml:space"), "preserve")
    it.text = 'TOC \\o "1-3" \\h \\z \\u'
    f2 = OxmlElement("w:fldChar")
    f2.set(qn("w:fldCharType"), "separate")
    t = OxmlElement("w:t")
    t.text = "Indice: haga clic derecho sobre este texto y elija 'Actualizar campos'."
    f2.append(t)
    f3 = OxmlElement("w:fldChar")
    f3.set(qn("w:fldCharType"), "end")
    run._r.append(f1)
    run._r.append(it)
    run._r.append(f2)
    run._r.append(f3)


def add_page_numbers():
    for sec in doc.sections:
        footer = sec.footer
        par = footer.paragraphs[0]
        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = par.add_run()
        f1 = OxmlElement("w:fldChar")
        f1.set(qn("w:fldCharType"), "begin")
        it = OxmlElement("w:instrText")
        it.set(qn("xml:space"), "preserve")
        it.text = "PAGE"
        f2 = OxmlElement("w:fldChar")
        f2.set(qn("w:fldCharType"), "end")
        run._r.append(f1)
        run._r.append(it)
        run._r.append(f2)
        run.font.size = Pt(9)
        run.font.color.rgb = MUTED


# =========================================================== 1. PORTADA ===
def cover_line(text, size=11, bold=False, space=6, caps=False):
    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = par.add_run(text.upper() if caps else text)
    run.bold = bold
    run.font.size = Pt(size)
    par.paragraph_format.space_after = Pt(space)
    return par


for _ in range(2):
    doc.add_paragraph()

cover_line("[INFORMACION FALTANTE: NOMBRE DE LA UNIVERSIDAD]", 13, True, 4, True)
cover_line("[INFORMACION FALTANTE: FACULTAD]", 11, False, 4)
cover_line("[INFORMACION FALTANTE: CARRERA]", 11, False, 30)

placeholder("ESPACIO PARA EL ESCUDO O LOGOTIPO DE LA UNIVERSIDAD")

for _ in range(2):
    doc.add_paragraph()

cover_line(
    "AQUAPAY: SISTEMA WEB PARA LA ADMINISTRACION DEL SERVICIO "
    "DE AGUA POTABLE DE ALDEA SIBANA, EL ASINTAL, RETALHULEU",
    15,
    True,
    10,
)
cover_line("Documentacion tecnica y academica del proyecto", 11, False, 40)

for _ in range(3):
    doc.add_paragraph()

cover_line("Presentado por:", 10, True, 2)
cover_line("[INFORMACION FALTANTE: NOMBRE COMPLETO DEL ESTUDIANTE]", 11, False, 4)
cover_line("[INFORMACION FALTANTE: NUMERO DE CARNE]", 10, False, 20)

cover_line("Asesor:", 10, True, 2)
cover_line("[INFORMACION FALTANTE: NOMBRE DEL ASESOR]", 11, False, 24)

cover_line("[INFORMACION FALTANTE: LUGAR]", 10, False, 2)
cover_line("[INFORMACION FALTANTE: MES Y ANIO]", 10, False, 2)

# ============================================================ 2. INDICE ===
doc.add_page_break()
h1_nobreak("INDICE")
p(
    "El indice se genera automaticamente a partir de los estilos de titulo del "
    "documento. Para actualizarlo en Microsoft Word, seleccione el campo, haga "
    "clic derecho y elija 'Actualizar campos' y luego 'Actualizar toda la tabla'.",
    italic=True,
)
add_toc()

# ====================================================== 3. INTRODUCCION ===
h1("1. INTRODUCCION")

h2("1.1 Contexto del proyecto")
p(
    "AquaPay es una aplicacion web desarrollada para el Comite de Agua Potable de "
    "Aldea Sibana, del municipio de El Asintal, departamento de Retalhuleu, "
    "Guatemala. El sistema administra el cobro del servicio comunitario de agua "
    "potable, sustituyendo el control manual de pagos y la emision de recibos en "
    "papel por un proceso digital centralizado."
)
p(
    "El proyecto esta organizado como un repositorio con dos aplicaciones "
    "independientes: un cliente web construido con Next.js y una interfaz de "
    "programacion de aplicaciones (API) construida con Express y TypeORM sobre una "
    "base de datos PostgreSQL administrada por Supabase. Esta separacion se "
    "evidencia en la estructura de directorios del proyecto, que contiene las "
    "carpetas 'frontend/' y 'backend/' con archivos 'package.json' independientes."
)

h2("1.2 Problema que busca resolver")
p(
    "El sistema atiende el registro y control de los pagos del servicio de agua "
    "potable de la comunidad. Segun la logica implementada en el codigo, el cobro "
    "se estructura sobre dos conceptos economicos distintos: la tarifa anual del "
    "servicio, que se calcula por cada chorro (punto de agua) activo de una "
    "vivienda, y el pago unico por la compra de un chorro nuevo. El sistema debe "
    "determinar automaticamente que anios adeuda cada vivienda y evitar que un "
    "mismo periodo se cobre dos veces."
)

h2("1.3 Proposito del sistema")
p(
    "El proposito del sistema es proveer al comite una herramienta que permita: "
    "registrar a los beneficiarios de la comunidad junto con sus viviendas y "
    "chorros; calcular de forma automatica la deuda acumulada por concepto de "
    "tarifa anual; emitir recibos numerados de forma correlativa; generar el "
    "comprobante en formato PDF; y consultar indicadores de recaudacion y reportes "
    "administrativos."
)

h2("1.4 Usuarios objetivo")
p(
    "El sistema define dos roles de usuario, declarados como un tipo enumerado en "
    "la base de datos ('rol_sistema') y en la entidad 'Perfil':"
)
table(
    ["Rol", "Descripcion", "Modulos accesibles"],
    [
        [
            "administrador",
            "Responsable de la configuracion del sistema y del registro de "
            "beneficiarios, viviendas y chorros.",
            "Dashboard, Beneficiarios, Pagos, Reportes, Configuracion",
        ],
        [
            "tesorero",
            "Responsable de recibir los pagos y emitir los recibos "
            "correspondientes.",
            "Dashboard, Facturas",
        ],
    ],
    widths=[3.0, 8.0, 5.0],
    caption="Roles de usuario definidos en el sistema",
)
p(
    "Adicionalmente, el sistema gestiona una entidad denominada 'usuarios_comunidad' "
    "(beneficiarios), que representa a los vecinos que reciben el servicio. Estos "
    "no son usuarios del sistema: no poseen credenciales de acceso y son "
    "unicamente sujetos de registro y cobro."
)

h2("1.5 Tecnologias principales")
p(
    "El sistema se construyo con TypeScript en ambos extremos. En el cliente se "
    "utiliza Next.js 15 con el enrutador de aplicaciones (App Router) y React 19; "
    "en el servidor, Express 4 con TypeORM 0.3 sobre PostgreSQL. La autenticacion, "
    "el almacenamiento de archivos y la base de datos se delegan en Supabase. El "
    "detalle completo de versiones se presenta en el capitulo 15."
)

h2("1.6 Estructura general del documento")
p(
    "El documento se organiza en cuatro bloques. El primero (capitulos 1 a 9) "
    "presenta el planteamiento academico: problema, justificacion, objetivos, "
    "alcance y marco teorico. El segundo (capitulos 10 a 16) documenta el analisis "
    "y el diseno del sistema, incluyendo requerimientos, arquitectura, base de "
    "datos y estructura del proyecto. El tercero (capitulos 17 a 23) detalla la "
    "implementacion, la interfaz de programacion, la seguridad, las pruebas, el "
    "despliegue y los manuales tecnico y de usuario. El cuarto (capitulos 24 a 28) "
    "recoge resultados, conclusiones, recomendaciones, bibliografia y anexos."
)

# ============================================== 4. PLANTEAMIENTO PROBLEMA ===
h1("2. PLANTEAMIENTO DEL PROBLEMA")

h2("2.1 Situacion actual")
missing(
    "No se localizo en el repositorio ningun documento de levantamiento de "
    "requerimientos, acta de reunion, entrevista o diagnostico que describa como "
    "opera actualmente el comite antes de la implementacion del sistema. Esta "
    "seccion debe redactarse con informacion de campo obtenida directamente del "
    "Comite de Agua Potable de Aldea Sibana."
)
p(
    "La informacion verificable dentro del proyecto permite inferir unicamente las "
    "caracteristicas del proceso que el sistema automatiza, no su estado previo. "
    "Dichas caracteristicas se enumeran a continuacion como evidencia de codigo:"
)
bullet(
    "El cobro se realiza de forma presencial y en un lugar fijo. El sistema "
    "almacena el valor de configuracion 'lugar_pago' con el valor por omision "
    "'Aldea Sibana, El Asintal, Retalhuleu' y lo imprime en cada recibo."
)
bullet(
    "El recibo requiere firma manuscrita del tesorero. El generador de PDF "
    "('pdf.service.ts') dibuja explicitamente una linea y la leyenda 'Firma del "
    "tesorero (manuscrita)'."
)
bullet(
    "La numeracion de recibos es correlativa y se reinicia cada anio, lo que "
    "corresponde a la practica de talonarios fisicos anuales."
)
bullet(
    "El monto adeudado se acumula por anios completos, no por meses, lo que indica "
    "un esquema de cobro anual por punto de agua."
)

h2("2.2 Problema identificado")
p(
    "A partir de las reglas implementadas, el problema que el sistema resuelve es "
    "el control de la morosidad y la trazabilidad del cobro anual del servicio de "
    "agua potable cuando una vivienda puede tener multiples chorros y multiples "
    "anios pendientes de forma simultanea. El calculo manual de esta deuda es "
    "propenso a error, ya que requiere multiplicar la tarifa vigente por la "
    "cantidad de chorros activos y por la cantidad de anios adeudados, verificando "
    "ademas que ningun periodo se haya cobrado previamente."
)

h2("2.3 Causas")
bullet(
    "Ausencia de un registro digital unico de beneficiarios, viviendas y puntos de "
    "agua."
)
bullet(
    "Calculo manual de la deuda acumulada, dependiente de la memoria o de registros "
    "en papel."
)
bullet(
    "Numeracion manual de recibos, susceptible de duplicidad o salto de "
    "correlativo."
)
bullet(
    "Falta de segregacion formal de funciones entre quien administra el padron y "
    "quien recibe el dinero."
)

h2("2.4 Consecuencias")
bullet("Riesgo de cobrar dos veces el mismo periodo a un mismo beneficiario.")
bullet("Riesgo de omitir anios adeudados y reducir la recaudacion del comite.")
bullet("Dificultad para producir reportes de ingresos y morosidad.")
bullet("Ausencia de respaldo verificable del comprobante entregado al vecino.")

h2("2.5 Problema central")
p(
    "El Comite de Agua Potable de Aldea Sibana carece de un mecanismo automatizado "
    "que calcule la deuda anual acumulada por vivienda en funcion de sus chorros "
    "activos, que garantice la unicidad del correlativo de recibos y que resguarde "
    "digitalmente los comprobantes emitidos.",
    bold=True,
)

h2("2.6 Necesidad de una solucion tecnologica")
p(
    "La solucion implementada responde a esta necesidad mediante tres mecanismos "
    "verificables en el codigo. Primero, el metodo 'aniosPendientes' del servicio "
    "de facturacion determina automaticamente los anios adeudados comparando los "
    "anios transcurridos desde 'anio_inicio_cobro' contra los registros existentes "
    "en la tabla 'pagos_anuales'. Segundo, la restriccion de unicidad "
    "'UNIQUE (chorro_id, anio)' en dicha tabla impide a nivel de base de datos que "
    "un mismo chorro se cobre dos veces por el mismo anio. Tercero, el metodo "
    "'siguienteNumero' calcula el correlativo consultando el ultimo recibo del anio "
    "en curso, y la tabla 'recibos' declara las restricciones "
    "'UNIQUE (anio_recibo, secuencia)' y 'UNIQUE (numero_recibo)'."
)

# ========================================================= 5. JUSTIFICACION ===
h1("3. JUSTIFICACION")

h2("3.1 Importancia del proyecto")
p(
    "El agua potable constituye un servicio basico administrado de forma comunitaria "
    "en numerosas aldeas de Guatemala. La sostenibilidad economica de estos sistemas "
    "depende directamente de la eficacia de su cobro. Un sistema de informacion que "
    "reduzca el error humano en el calculo de la deuda y que garantice la "
    "trazabilidad de cada quetzal recaudado contribuye de manera directa a la "
    "continuidad del servicio."
)

h2("3.2 Beneficios")
table(
    ["Beneficio", "Mecanismo tecnico que lo sustenta"],
    [
        [
            "Eliminacion del error de calculo",
            "El total se computa en el servidor como tarifa x chorros activos x "
            "anios seleccionados ('facturacion.service.ts'); la interfaz solo lo "
            "muestra.",
        ],
        [
            "Imposibilidad de doble cobro anual",
            "Restriccion 'UNIQUE (chorro_id, anio)' en la tabla 'pagos_anuales' y "
            "validacion previa de anios pendientes.",
        ],
        [
            "Correlativo unico de recibos",
            "Restricciones 'UNIQUE (anio_recibo, secuencia)' y "
            "'UNIQUE (numero_recibo)' en la tabla 'recibos'.",
        ],
        [
            "Respaldo digital del comprobante",
            "Cada recibo genera un PDF que se almacena en Supabase Storage y se "
            "registra en la tabla 'recibos_pdf'.",
        ],
        [
            "Segregacion de funciones",
            "El middleware 'requireRoles' impide que el administrador emita "
            "recibos y que el tesorero modifique el padron de beneficiarios.",
        ],
        [
            "Visibilidad de la recaudacion",
            "El metodo 'dashboard' agrega ingresos por mes y el modulo de reportes "
            "exporta a PDF.",
        ],
    ],
    widths=[5.0, 11.0],
    caption="Beneficios del sistema y su sustento tecnico",
)

h2("3.3 Usuarios beneficiados")
bullet(
    "Tesorero del comite: reduce el tiempo de atencion por vecino y elimina el "
    "calculo manual."
)
bullet(
    "Administrador del comite: obtiene indicadores de recaudacion y un padron "
    "digital consultable."
)
bullet(
    "Vecinos beneficiarios: reciben un comprobante numerado con el detalle de los "
    "anios cancelados y el monto expresado en letras."
)

h2("3.4 Mejoras respecto al proceso anterior")
missing(
    "La comparacion cuantitativa con el proceso anterior (tiempo por transaccion, "
    "porcentaje de error, nivel de morosidad antes y despues) no puede derivarse "
    "del codigo fuente. Se requiere medicion en campo para sustentar esta seccion."
)

# =========================================================== 6. OBJETIVOS ===
h1("4. OBJETIVOS")

h2("4.1 Objetivo general")
p(
    "Desarrollar un sistema de informacion web que automatice el registro de "
    "beneficiarios y el cobro del servicio de agua potable del Comite de Agua "
    "Potable de Aldea Sibana, El Asintal, Retalhuleu, mediante el calculo "
    "automatico de la deuda anual por chorro y la emision de recibos digitales "
    "numerados de forma correlativa.",
    bold=True,
)

h2("4.2 Objetivos especificos")
p("Los objetivos especificos se derivan de las funcionalidades efectivamente implementadas:")
numbered(
    "Implementar un modulo de autenticacion basado en el Documento Personal de "
    "Identificacion (DPI) y contrasena, con control de acceso diferenciado para "
    "los roles administrador y tesorero."
)
numbered(
    "Desarrollar un modulo de gestion del padron que permita registrar, consultar, "
    "actualizar y habilitar o deshabilitar beneficiarios, viviendas y chorros."
)
numbered(
    "Implementar un algoritmo que determine automaticamente los anios pendientes de "
    "pago de una vivienda a partir de su anio de inicio de cobro y de los pagos "
    "previamente registrados."
)
numbered(
    "Desarrollar un modulo de facturacion que emita recibos por concepto de tarifa "
    "anual y por compra de chorro, calculando el monto total y su expresion en "
    "letras de forma automatica."
)
numbered(
    "Generar un comprobante en formato PDF por cada recibo emitido y almacenarlo en "
    "un servicio de almacenamiento en la nube."
)
numbered(
    "Implementar un panel de indicadores y un modulo de reportes exportables que "
    "permitan al administrador supervisar la recaudacion."
)
numbered(
    "Garantizar la integridad de los datos mediante restricciones de unicidad en la "
    "base de datos y validacion de entradas en el servidor."
)

# ============================================ 7. ALCANCE Y LIMITACIONES ===
h1("5. ALCANCE Y LIMITACIONES")

h2("5.1 Alcance")
p(
    "El alcance se delimita a las funcionalidades verificadas en el codigo fuente. "
    "Se clasifican en tres estados para evitar sobreestimacion."
)

h3("5.1.1 Funcionalidades implementadas")
table(
    ["Modulo", "Funcionalidad verificada"],
    [
        [
            "Autenticacion",
            "Registro de cuentas de sistema, inicio de sesion con DPI y contrasena, "
            "consulta del perfil autenticado y verificacion de token mediante JWKS.",
        ],
        [
            "Control de acceso",
            "Restriccion por rol en el servidor ('requireRoles') y en la interfaz "
            "('canAccessPath', 'RoleGate').",
        ],
        [
            "Padron de beneficiarios",
            "Alta, consulta, busqueda por nombre o DPI, actualizacion y "
            "activacion/desactivacion logica.",
        ],
        [
            "Viviendas y chorros",
            "Alta y actualizacion de viviendas y de chorros asociados, con anio de "
            "inicio de cobro y precio de compra.",
        ],
        [
            "Calculo de deuda",
            "Determinacion automatica de anios pendientes por vivienda considerando "
            "todos los chorros activos.",
        ],
        [
            "Facturacion",
            "Cobro de tarifa anual (uno o varios anios en un mismo recibo) y cobro "
            "de compra de chorro, ambos dentro de una transaccion de base de datos.",
        ],
        [
            "Numeracion de recibos",
            "Correlativo automatico con reinicio anual y formato de tres digitos.",
        ],
        [
            "Generacion de PDF",
            "Creacion del comprobante con pdf-lib, carga a Supabase Storage, URL "
            "firmada con vigencia de una hora y entrega en base64.",
        ],
        [
            "Monto en letras",
            "Conversion del importe numerico a texto en quetzales.",
        ],
        [
            "Indicadores",
            "Panel con totales de usuarios, viviendas, chorros, recibos e ingresos "
            "del mes, y grafico de ingresos por mes.",
        ],
        [
            "Reportes",
            "Reportes de usuarios, viviendas, pagos e ingresos, con exportacion a "
            "PDF.",
        ],
        [
            "Configuracion",
            "Consulta y actualizacion de la tarifa anual vigente.",
        ],
        [
            "Interfaz",
            "Diseno responsivo con tema claro y oscuro conmutables.",
        ],
    ],
    widths=[4.0, 12.0],
    caption="Funcionalidades implementadas y verificadas en codigo",
)

h3("5.1.2 Funcionalidades parcialmente implementadas")
table(
    ["Funcionalidad", "Estado real verificado"],
    [
        [
            "Cierre de sesion",
            "El endpoint 'POST /api/auth/logout' existe y la interfaz limpia el "
            "almacenamiento local, pero el metodo 'logout' del servicio retorna "
            "'{ ok: true }' sin invalidar el token en Supabase. El token permanece "
            "valido hasta su expiracion natural.",
        ],
        [
            "Firma digital del recibo",
            "El metodo 'intentarFirmar' esta implementado, pero solo firma si existe "
            "un certificado P12 en la ruta indicada por 'PDF_SIGN_P12_PATH'. Sin "
            "certificado, el PDF se entrega sin firmar.",
        ],
        [
            "Precio unitario del chorro",
            "La constante 'PRECIO_CHORRO_UNITARIO = 1500' esta definida unicamente "
            "en el cliente ('frontend/src/lib/navigation.ts'). El servidor acepta "
            "cualquier valor de 'precioCompra' mayor o igual a cero.",
        ],
        [
            "Validacion de tipo de reporte",
            "La clase 'TipoReporteDto' esta definida pero no se aplica en las rutas. "
            "Un tipo invalido produce un error 500 en lugar de un 400.",
        ],
        [
            "Control de acceso por ruta en el cliente",
            "La funcion 'canAccessPath' retorna 'true' para rutas no declaradas en "
            "'NAV_LINKS', por lo que actua como lista de exclusion y no de "
            "inclusion.",
        ],
    ],
    widths=[4.5, 11.5],
    caption="Funcionalidades parcialmente implementadas",
)

h3("5.1.3 Funcionalidades no implementadas")
table(
    ["Funcionalidad", "Evidencia de ausencia"],
    [
        [
            "Autenticacion multifactor (MFA/TOTP)",
            "Las columnas 'mfa_secreto' y 'mfa_habilitado' existen en la tabla "
            "'perfiles' y la dependencia 'otplib' esta declarada, pero no existe "
            "ningun endpoint ni importacion de 'otplib' en 'backend/src'. Las "
            "paginas '/mfa/setup' y '/mfa/verificar' del cliente unicamente "
            "redirigen.",
        ],
        [
            "Recuperacion de contrasena",
            "La interfaz de inicio de sesion muestra un aviso indicando que el "
            "restablecimiento automatico no esta disponible. No existe endpoint "
            "asociado.",
        ],
        [
            "Pagos en linea",
            "No existe integracion con ninguna pasarela de pago.",
        ],
        [
            "Notificaciones por correo o mensajeria",
            "No se localizo ningun servicio de envio de notificaciones.",
        ],
        [
            "Bitacora de auditoria",
            "No existe tabla ni servicio que registre el historial de cambios sobre "
            "las entidades.",
        ],
        [
            "Aplicacion movil nativa",
            "El proyecto es exclusivamente web.",
        ],
    ],
    widths=[4.5, 11.5],
    caption="Funcionalidades no implementadas",
)

h2("5.2 Limitaciones")
bullet(
    "Dependencia de proveedor: la autenticacion, la base de datos y el "
    "almacenamiento dependen de Supabase. Una interrupcion de este servicio "
    "inhabilita el sistema completo."
)
bullet(
    "Conectividad permanente requerida: el sistema no opera sin conexion a "
    "Internet, condicion relevante en el contexto rural de la aldea."
)
bullet(
    "La tabla 'pagos_compra_chorro' no declara una restriccion de unicidad sobre "
    "'chorro_id'. La proteccion contra doble cobro de compra se realiza unicamente "
    "en la capa de aplicacion, lo que deja abierta una condicion de carrera ante "
    "peticiones concurrentes."
)
bullet(
    "El token de sesion se almacena en 'localStorage' o 'sessionStorage' del "
    "navegador, lo que lo expone a ataques de tipo Cross-Site Scripting."
)
bullet(
    "El sistema no contempla la anulacion de recibos ya emitidos. La interfaz de "
    "historial muestra filtros de 'Pendientes' y 'Anulados' que siempre retornan "
    "conjuntos vacios."
)
bullet(
    "La cobertura de pruebas automatizadas es minima (vease el capitulo 20)."
)

# ======================================================= 8. MARCO TEORICO ===
h1("6. MARCO TEORICO")

h2("6.1 Sistemas de informacion")
p(
    "Un sistema de informacion es un conjunto organizado de componentes que "
    "recolectan, procesan, almacenan y distribuyen datos para apoyar la toma de "
    "decisiones y el control dentro de una organizacion. AquaPay corresponde a un "
    "sistema de procesamiento de transacciones, dado que su funcion central es "
    "registrar operaciones economicas discretas (los cobros) y producir "
    "comprobantes verificables de las mismas."
)

h2("6.2 Aplicaciones web y arquitectura cliente-servidor")
p(
    "Una aplicacion web es un programa cuya interfaz se ejecuta en un navegador y "
    "cuya logica de negocio reside en un servidor remoto. AquaPay adopta el patron "
    "cliente-servidor con separacion estricta: el cliente Next.js no accede "
    "directamente a la base de datos, sino que consume una API HTTP sobre el "
    "prefijo '/api'. Esta separacion permite desplegar ambos componentes de forma "
    "independiente."
)

h2("6.3 Renderizado en el cliente y el App Router de Next.js")
p(
    "Next.js es un entorno de trabajo construido sobre React que incorpora "
    "enrutamiento basado en el sistema de archivos. En su version 15 utiliza el "
    "App Router, donde cada carpeta bajo 'src/app' representa un segmento de la "
    "ruta URL. AquaPay emplea grupos de rutas, identificados por parentesis, que "
    "organizan el codigo sin afectar la URL resultante: el grupo '(auth)' agrupa "
    "las pantallas publicas y el grupo '(app)' las pantallas protegidas, "
    "compartiendo estas ultimas un mismo layout con verificacion de sesion."
)

h2("6.4 Interfaces de programacion de aplicaciones de estilo REST")
p(
    "Una API REST expone recursos identificados por URL y manipulados mediante los "
    "metodos del protocolo HTTP. AquaPay expone cuatro conjuntos de recursos "
    "('/api/auth', '/api/usuarios', '/api/facturacion' y '/api/reportes') y utiliza "
    "los metodos GET, POST, PATCH, PUT y DELETE. Las respuestas siguen una "
    "envoltura uniforme con la forma '{ success, data }' en caso de exito y "
    "'{ success, message, code }' en caso de error."
)

h2("6.5 Bases de datos relacionales y mapeo objeto-relacional")
p(
    "Una base de datos relacional organiza la informacion en tablas vinculadas "
    "mediante llaves foraneas, garantizando la integridad referencial. Un mapeador "
    "objeto-relacional (ORM) traduce las tablas a clases del lenguaje de "
    "programacion. AquaPay utiliza PostgreSQL como motor y TypeORM como ORM, "
    "declarando cada tabla como una clase decorada con '@Entity'. El origen de "
    "datos se configura con 'synchronize: false', lo que significa que el esquema "
    "no se modifica automaticamente y debe administrarse mediante scripts SQL "
    "explicitos."
)

h2("6.6 Transacciones y propiedades ACID")
p(
    "Una transaccion es una unidad de trabajo que se ejecuta en su totalidad o no "
    "se ejecuta en absoluto (atomicidad). En AquaPay, la emision de un recibo "
    "implica insertar registros en varias tablas de forma coordinada; por ello, "
    "ambos metodos de cobro se ejecutan dentro de "
    "'AppDataSource.transaction(...)', garantizando que no queden recibos sin sus "
    "pagos asociados ni pagos sin recibo."
)

h2("6.7 Autenticacion mediante JSON Web Tokens y JWKS")
p(
    "Un JSON Web Token (JWT) es una cadena firmada criptograficamente que transporta "
    "afirmaciones sobre la identidad de un usuario. La verificacion de la firma "
    "puede realizarse con una clave publica publicada en un conjunto de claves web "
    "JSON (JWKS). AquaPay no emite sus propios tokens: delega la emision en Supabase "
    "Auth y verifica cada peticion con la biblioteca 'jose', contrastando la firma "
    "contra el JWKS remoto y validando el emisor y la audiencia."
)

h2("6.8 Control de acceso basado en roles")
p(
    "El control de acceso basado en roles (RBAC) asigna permisos a roles y roles a "
    "usuarios, en lugar de asignar permisos directamente a cada usuario. AquaPay "
    "implementa RBAC en dos capas: una capa de presentacion que oculta las opciones "
    "no autorizadas, y una capa de servidor que rechaza la peticion con codigo 403 "
    "aunque el cliente intente invocarla directamente. La capa de servidor "
    "constituye el control efectivo; la capa de presentacion es unicamente una "
    "mejora de la experiencia de usuario."
)

h2("6.9 Validacion de datos de entrada")
p(
    "La validacion de entradas consiste en verificar que los datos recibidos "
    "cumplan el formato y las restricciones esperadas antes de procesarlos. AquaPay "
    "utiliza 'class-validator' junto con objetos de transferencia de datos (DTO). "
    "La validacion se configura con las opciones 'whitelist' y "
    "'forbidNonWhitelisted', de modo que cualquier propiedad no declarada en el DTO "
    "provoca el rechazo de la peticion; este comportamiento mitiga los ataques de "
    "asignacion masiva."
)

h2("6.10 Generacion programatica de documentos PDF")
p(
    "El formato de documento portatil (PDF) preserva la composicion visual "
    "independientemente del dispositivo. AquaPay genera sus comprobantes mediante "
    "la biblioteca 'pdf-lib', que permite construir el documento posicionando texto "
    "y figuras por coordenadas, sin depender de un navegador ni de un motor de "
    "impresion externo."
)

h2("6.11 Computo en la nube y modelo de plataforma como servicio")
p(
    "El modelo de plataforma como servicio (PaaS) provee un entorno gestionado de "
    "ejecucion, liberando al desarrollador de administrar la infraestructura. "
    "AquaPay se apoya en Supabase, que ofrece PostgreSQL, autenticacion y "
    "almacenamiento de objetos como servicio, y en Vercel y Render como plataformas "
    "de despliegue del cliente y del servidor respectivamente."
)

h2("6.12 Integracion continua")
p(
    "La integracion continua consiste en verificar automaticamente cada cambio "
    "incorporado al repositorio. El proyecto define un flujo de trabajo de GitHub "
    "Actions en '.github/workflows/ci.yml' que, en cada 'push' a las ramas 'main' o "
    "'master' y en cada solicitud de incorporacion de cambios, ejecuta el analisis "
    "estatico y la compilacion del cliente, y la verificacion de tipos del servidor."
)

h2("6.13 Pruebas de software")
p(
    "Las pruebas unitarias verifican el comportamiento de una unidad de codigo de "
    "forma aislada. AquaPay utiliza Vitest como entorno de pruebas. El estado real "
    "de la cobertura se documenta en el capitulo 20."
)

# ========================================================= 9. ANTECEDENTES ===
h1("7. ANTECEDENTES Y ESTADO DEL ARTE")
missing(
    "No se localizo dentro del repositorio ningun documento de antecedentes, "
    "revision bibliografica, analisis de sistemas similares ni referencia a "
    "trabajos previos. Esta seccion debe elaborarse mediante investigacion "
    "documental externa."
)
p("Se recomienda que la investigacion documental cubra al menos los siguientes ejes:")
bullet(
    "Sistemas de gestion de servicios comunitarios de agua implementados en "
    "Guatemala o en Centroamerica."
)
bullet(
    "Soluciones comerciales de facturacion para servicios basicos y su viabilidad "
    "en contextos rurales."
)
bullet(
    "Trabajos de graduacion previos de la misma casa de estudios sobre sistemas de "
    "cobro o de administracion comunitaria."
)
bullet(
    "Marco legal guatemalteco aplicable al tratamiento del Documento Personal de "
    "Identificacion como dato personal."
)

# ======================================================== 10. METODOLOGIA ===
h1("8. METODOLOGIA DE DESARROLLO")

note(
    "Advertencia metodologica: el repositorio no contiene ningun documento que "
    "declare explicitamente la metodologia utilizada. Lo expuesto en este capitulo "
    "se divide en evidencia verificable e inferencia razonada, y debe ser validado "
    "por el autor antes de su presentacion.",
    color=MUTED,
)

h2("8.1 Evidencia encontrada en el proyecto")
table(
    ["Elemento", "Evidencia", "Ubicacion"],
    [
        [
            "Integracion continua",
            "Flujo de trabajo con dos tareas paralelas (frontend y backend) que "
            "ejecutan lint, build y verificacion de tipos.",
            ".github/workflows/ci.yml",
        ],
        [
            "Evolucion incremental del esquema",
            "Cuatro migraciones SQL numeradas y aplicadas de forma secuencial, lo "
            "que evidencia refinamiento iterativo del modelo de datos.",
            "backend/src/database/migrations/",
        ],
        [
            "Separacion en capas",
            "Division explicita en rutas, DTO, servicios, entidades, middleware y "
            "utilidades.",
            "backend/src/",
        ],
        [
            "Pruebas automatizadas",
            "Configuracion de Vitest y un archivo de prueba unitaria.",
            "backend/package.json, backend/src/utils/",
        ],
        [
            "Convenciones de codigo",
            "TypeScript en modo estricto y configuracion de ESLint en ambos "
            "proyectos.",
            "tsconfig.json, eslint.config.mjs",
        ],
    ],
    widths=[3.5, 8.0, 4.5],
    caption="Evidencia metodologica verificable en el repositorio",
)

note(
    "Hallazgo relevante: el directorio de trabajo analizado NO contiene un "
    "repositorio Git inicializado. Existen el archivo '.gitignore' y el flujo de "
    "GitHub Actions, lo que indica que el control de versiones fue previsto, pero "
    "no se localizo la carpeta '.git' ni historial de confirmaciones. En "
    "consecuencia, no es posible documentar iteraciones, ramas ni cronologia real "
    "del desarrollo a partir del repositorio."
)

h2("8.2 Metodologia inferida")
p(
    "Los elementos anteriores son compatibles con un proceso de desarrollo "
    "incremental e iterativo, cercano a las practicas agiles, caracterizado por "
    "entregas parciales funcionales y refinamiento continuo del modelo de datos. "
    "Se observa ademas la aplicacion del principio de responsabilidad unica en la "
    "organizacion por capas del servidor.",
    italic=True,
)

h2("8.3 Fases del desarrollo")
p(
    "Las fases descritas a continuacion se presentan como reconstruccion del "
    "proceso a partir de los artefactos existentes. Deben ser confirmadas por el "
    "autor."
)
table(
    ["Fase", "Actividades", "Artefacto resultante en el repositorio"],
    [
        [
            "Planificacion",
            "Definicion del alcance, de los roles del sistema y de las reglas de "
            "cobro.",
            "README.md (seccion de reglas de negocio)",
        ],
        [
            "Analisis",
            "Identificacion de entidades del dominio y de las relaciones entre "
            "beneficiario, vivienda, chorro y recibo.",
            "backend/src/database/schema.sql",
        ],
        [
            "Diseno",
            "Definicion del esquema relacional, del contrato de la API y del "
            "sistema visual.",
            "schema.sql, routes/, globals.css",
        ],
        [
            "Desarrollo",
            "Implementacion de entidades, servicios, rutas, componentes y "
            "pantallas.",
            "backend/src/, frontend/src/",
        ],
        [
            "Pruebas",
            "Prueba unitaria de la conversion de montos a letras y verificacion "
            "automatica de tipos y compilacion en integracion continua.",
            "numero-a-letras.test.ts, ci.yml",
        ],
        [
            "Implantacion",
            "Configuracion de despliegue en Vercel, Render y Supabase.",
            "README.md (seccion de despliegue), .env.example",
        ],
    ],
    widths=[2.8, 7.2, 6.0],
    caption="Fases del desarrollo reconstruidas a partir de los artefactos",
)

missing(
    "No se localizo cronograma, diagrama de Gantt, backlog, registro de sprints ni "
    "documento de planificacion temporal. Si la carrera exige cronograma, debe "
    "elaborarse por separado."
)

# ==================================================== 11. REQUERIMIENTOS ===
h1("9. REQUERIMIENTOS DEL SISTEMA")

h2("9.1 Requerimientos funcionales")
p(
    "Los requerimientos funcionales se derivaron por ingenieria inversa a partir de "
    "los endpoints implementados en el servidor y de las pantallas del cliente. "
    "Cada requerimiento es trazable a un fragmento concreto de codigo."
)

h3("9.1.1 Resumen de requerimientos funcionales")
table(
    ["ID", "Nombre", "Actor", "Endpoint o pantalla asociada"],
    [
        ["RF-01", "Consultar disponibilidad de registro de administrador", "Visitante", "GET /api/auth/registro-opciones"],
        ["RF-02", "Registrar cuenta de sistema", "Visitante", "POST /api/auth/registro"],
        ["RF-03", "Iniciar sesion", "Administrador, Tesorero", "POST /api/auth/login"],
        ["RF-04", "Consultar perfil autenticado", "Administrador, Tesorero", "GET /api/auth/me"],
        ["RF-05", "Cerrar sesion", "Administrador, Tesorero", "POST /api/auth/logout"],
        ["RF-06", "Registrar beneficiario", "Administrador", "POST /api/usuarios"],
        ["RF-07", "Listar y buscar beneficiarios", "Administrador, Tesorero", "GET /api/usuarios"],
        ["RF-08", "Consultar beneficiario por DPI", "Administrador", "GET /api/usuarios/dpi/:dpi"],
        ["RF-09", "Consultar detalle de beneficiario", "Administrador", "GET /api/usuarios/:id"],
        ["RF-10", "Actualizar beneficiario", "Administrador", "PATCH /api/usuarios/:id"],
        ["RF-11", "Activar o desactivar beneficiario", "Administrador", "POST /api/usuarios/:id/activar | /desactivar"],
        ["RF-12", "Registrar vivienda", "Administrador", "POST /api/usuarios/:id/viviendas"],
        ["RF-13", "Actualizar vivienda", "Administrador", "PATCH /api/usuarios/viviendas/:id"],
        ["RF-14", "Registrar chorro", "Administrador", "POST /api/usuarios/viviendas/:id/chorros"],
        ["RF-15", "Actualizar chorro", "Administrador", "PATCH /api/usuarios/chorros/:id"],
        ["RF-16", "Consultar configuracion publica", "Administrador, Tesorero", "GET /api/facturacion/config"],
        ["RF-17", "Actualizar tarifa anual", "Administrador", "PUT /api/facturacion/config/tarifa"],
        ["RF-18", "Consultar anios pendientes de una vivienda", "Tesorero", "GET /api/facturacion/pendientes/:viviendaId"],
        ["RF-19", "Previsualizar siguiente numero de recibo", "Tesorero", "GET /api/facturacion/siguiente-recibo"],
        ["RF-20", "Cobrar tarifa anual", "Tesorero", "POST /api/facturacion/cobrar/tarifa-anual"],
        ["RF-21", "Cobrar compra de chorro", "Tesorero", "POST /api/facturacion/cobrar/compra-chorro"],
        ["RF-22", "Generar y almacenar el recibo en PDF", "Sistema", "facturacion.service.ts -> subirPdf"],
        ["RF-23", "Listar y buscar recibos", "Administrador, Tesorero", "GET /api/facturacion/recibos"],
        ["RF-24", "Consultar un recibo especifico", "Administrador, Tesorero", "GET /api/facturacion/recibos/:id"],
        ["RF-25", "Consultar historial de pagos de un beneficiario", "Administrador", "GET /api/facturacion/historial/:usuarioId"],
        ["RF-26", "Consultar panel de indicadores", "Administrador, Tesorero", "GET /api/facturacion/dashboard"],
        ["RF-27", "Consultar reportes administrativos", "Administrador", "GET /api/reportes/:tipo"],
        ["RF-28", "Exportar reporte a PDF", "Administrador", "GET /api/reportes/:tipo/pdf"],
        ["RF-29", "Restringir el acceso segun el rol", "Sistema", "requireRoles, RoleGate, canAccessPath"],
        ["RF-30", "Conmutar el tema visual claro u oscuro", "Administrador, Tesorero", "ThemeToggle"],
    ],
    widths=[1.6, 5.4, 3.4, 5.6],
    caption="Resumen de requerimientos funcionales",
)

h3("9.1.2 Especificacion detallada de los requerimientos criticos")
p(
    "Por razones de extension se detallan los requerimientos correspondientes al "
    "nucleo del negocio y a la seguridad. El resto sigue la misma estructura y "
    "puede ampliarse en anexos."
)

rf_card(
    "RF-02",
    "Registrar cuenta de sistema",
    "Permite crear una cuenta de acceso con rol administrador o tesorero. El rol "
    "administrador solo se concede si no existe ningun administrador activo "
    "(arranque inicial del sistema).",
    "Visitante no autenticado",
    "El DPI no debe estar previamente registrado en la tabla 'perfiles'. Para "
    "solicitar el rol administrador, el conteo de administradores activos debe ser "
    "cero.",
    "1) El visitante accede a /registro. 2) El cliente consulta "
    "GET /api/auth/registro-opciones para determinar si se ofrece el rol "
    "administrador. 3) El visitante ingresa nombre, DPI, rol y contrasena. "
    "4) Se envia POST /api/auth/registro. 5) El servidor normaliza el DPI, verifica "
    "duplicidad, valida la regla de arranque, crea el usuario en Supabase Auth con "
    "el correo sintetico '{dpi}@sibana.aquapay.gt' y persiste el perfil.",
    "Codigo HTTP 201 y creacion del perfil. Si ya existe un administrador activo y "
    "se solicita ese rol, se retorna 403 con el mensaje correspondiente.",
)

rf_card(
    "RF-03",
    "Iniciar sesion",
    "Autentica a un usuario del sistema mediante su DPI y contrasena, y devuelve un "
    "token de acceso.",
    "Administrador, Tesorero",
    "El perfil debe existir y tener el campo 'activo' en verdadero.",
    "1) El usuario ingresa DPI y contrasena en /login. 2) El cliente valida que el "
    "DPI tenga 13 digitos y la contrasena al menos 8 caracteres. 3) Se envia "
    "POST /api/auth/login. 4) El servidor normaliza el DPI, localiza el perfil "
    "activo y delega la verificacion de la contrasena en "
    "'supabaseAdmin.auth.signInWithPassword'. 5) Se devuelve el token de acceso, el "
    "token de refresco y los datos del usuario.",
    "Codigo HTTP 200 con 'accessToken' y 'usuario'. El cliente almacena la sesion y "
    "redirige a /dashboard. Ante credenciales invalidas o perfil inactivo, se "
    "retorna 401 con el mensaje generico 'DPI o contrasena incorrectos'.",
)

rf_card(
    "RF-18",
    "Consultar anios pendientes de una vivienda",
    "Calcula automaticamente los anios de tarifa anual que la vivienda adeuda, el "
    "total de chorros activos, el monto por anio y los chorros cuya compra aun no "
    "ha sido cobrada.",
    "Tesorero",
    "La vivienda debe existir. Debe existir al menos un chorro activo para que se "
    "generen anios pendientes.",
    "1) Se recibe el identificador de la vivienda. 2) Se cargan la vivienda, su "
    "usuario y sus chorros. 3) Se construye el rango de anios desde "
    "'anio_inicio_cobro' hasta el anio actual. 4) Se consultan los registros de "
    "'pagos_anuales' de los chorros activos. 5) Un anio se considera pendiente si "
    "no todos los chorros activos poseen pago registrado para ese anio. 6) Se "
    "calcula el monto por anio como tarifa vigente multiplicada por la suma de "
    "cantidades de los chorros activos.",
    "Codigo HTTP 200 con el arreglo de anios pendientes, el detalle de montos, el "
    "total de chorros y la lista de chorros con compra pendiente.",
)

rf_card(
    "RF-20",
    "Cobrar tarifa anual",
    "Emite un recibo que cancela uno o varios anios de tarifa anual para todos los "
    "chorros activos de una vivienda.",
    "Tesorero",
    "Todos los anios enviados deben figurar como pendientes. La vivienda debe tener "
    "al menos un chorro activo.",
    "1) Se validan los anios contra el calculo de pendientes; si alguno no esta "
    "pendiente se rechaza la operacion. 2) Se calcula el total como tarifa x total "
    "de chorros x cantidad de anios. 3) Se obtiene el siguiente correlativo del "
    "anio en curso. 4) Dentro de una transaccion se crea el recibo, se inserta un "
    "registro en 'pagos_anuales' por cada combinacion de chorro y anio, se genera "
    "el PDF y se carga al almacenamiento.",
    "Codigo HTTP 201 con el recibo creado y los metadatos del PDF, incluyendo su "
    "representacion en base64 para descarga inmediata. Si algun anio no esta "
    "pendiente, se retorna 400.",
)

rf_card(
    "RF-21",
    "Cobrar compra de chorro",
    "Emite un recibo por el pago unico correspondiente a la adquisicion de un "
    "chorro.",
    "Tesorero",
    "El chorro debe pertenecer a la vivienda indicada, no debe tener un pago de "
    "compra previo y su 'precio_compra' debe ser mayor que cero.",
    "1) Se verifica la existencia de la vivienda y la pertenencia del chorro. "
    "2) Se comprueba que no exista un registro previo en 'pagos_compra_chorro'. "
    "3) Se valida que el precio de compra sea mayor que cero. 4) Se obtiene el "
    "correlativo. 5) Dentro de una transaccion se crea el recibo, se registra el "
    "pago de compra, se genera el PDF y se almacena.",
    "Codigo HTTP 201 con el recibo y el PDF. Si la compra ya fue cobrada, se retorna "
    "409; si el precio es cero, 400.",
)

rf_card(
    "RF-29",
    "Restringir el acceso segun el rol",
    "Impide que un usuario acceda a funcionalidades ajenas a su rol, tanto en la "
    "interfaz como en el servidor.",
    "Sistema",
    "El usuario debe estar autenticado con un token valido y su perfil debe estar "
    "activo.",
    "1) El middleware 'requireAuth' verifica la firma del token contra el JWKS de "
    "Supabase, valida emisor y audiencia, y carga el perfil comprobando que este "
    "activo. 2) El middleware 'requireRoles' compara el rol del perfil con los "
    "roles permitidos para la ruta. 3) En el cliente, 'RoleGate' evalua "
    "'canAccessPath' y redirige al panel principal cuando la ruta no corresponde al "
    "rol.",
    "Peticiones sin token o con token invalido reciben 401; peticiones autenticadas "
    "con rol insuficiente reciben 403. En la interfaz, la navegacion solo muestra "
    "los enlaces permitidos para el rol activo.",
)

h2("9.2 Requerimientos no funcionales")
table(
    ["ID", "Categoria", "Requerimiento", "Evidencia en el proyecto"],
    [
        [
            "RNF-01",
            "Seguridad",
            "Toda peticion a recursos protegidos debe presentar un token JWT valido "
            "verificado criptograficamente.",
            "requireAuth con 'jose' y 'createRemoteJWKSet'; validacion de issuer y "
            "audience.",
        ],
        [
            "RNF-02",
            "Seguridad",
            "Las contrasenas no deben almacenarse en la base de datos del sistema.",
            "La tabla 'perfiles' no contiene columna de contrasena; la credencial "
            "reside en Supabase Auth.",
        ],
        [
            "RNF-03",
            "Seguridad",
            "El servidor debe rechazar propiedades no declaradas en los objetos de "
            "transferencia de datos.",
            "validateBody con 'whitelist: true' y 'forbidNonWhitelisted: true'.",
        ],
        [
            "RNF-04",
            "Seguridad",
            "El servidor debe establecer cabeceras HTTP de proteccion y restringir "
            "el origen de las peticiones.",
            "helmet() y cors({ origin: env.frontendUrl, credentials: true }).",
        ],
        [
            "RNF-05",
            "Seguridad",
            "Las credenciales y claves no deben incluirse en el codigo fuente.",
            "Modulo 'config/env.ts' con dotenv; '.env' listado en '.gitignore'.",
        ],
        [
            "RNF-06",
            "Integridad",
            "El sistema debe impedir el doble cobro de un mismo anio para un mismo "
            "chorro.",
            "Restriccion 'UNIQUE (chorro_id, anio)' en 'pagos_anuales'.",
        ],
        [
            "RNF-07",
            "Integridad",
            "La emision de un recibo debe ser atomica.",
            "Uso de 'AppDataSource.transaction' en ambos metodos de cobro.",
        ],
        [
            "RNF-08",
            "Usabilidad",
            "La interfaz debe adaptarse a dispositivos moviles, tabletas y "
            "computadoras de escritorio.",
            "Clases utilitarias responsivas de Tailwind; navegacion movil mediante "
            "componente 'Sheet'.",
        ],
        [
            "RNF-09",
            "Usabilidad",
            "La interfaz debe ofrecer tema claro y oscuro.",
            "next-themes, variables CSS en ':root' y '.dark', componente "
            "'ThemeToggle'.",
        ],
        [
            "RNF-10",
            "Usabilidad",
            "Los formularios deben validar la entrada antes del envio y mostrar el "
            "error junto al campo.",
            "Estados 'touched' y mensajes por campo en las pantallas de acceso y de "
            "facturacion.",
        ],
        [
            "RNF-11",
            "Mantenibilidad",
            "El codigo debe estar tipado de forma estricta.",
            "'strict: true' en el 'tsconfig.json' de ambos proyectos.",
        ],
        [
            "RNF-12",
            "Mantenibilidad",
            "Cada cambio debe verificarse automaticamente antes de su integracion.",
            "Flujo de GitHub Actions con lint, build y 'tsc --noEmit'.",
        ],
        [
            "RNF-13",
            "Rendimiento",
            "Las consultas frecuentes deben apoyarse en indices.",
            "Siete indices declarados en 'schema.sql' sobre DPI, llaves foraneas y "
            "fecha de pago.",
        ],
        [
            "RNF-14",
            "Rendimiento",
            "El listado de recibos debe limitarse para evitar respuestas "
            "excesivamente grandes.",
            "'listarRecibos' acota el parametro 'limit' al rango de 1 a 200, con "
            "valor por omision de 50.",
        ],
        [
            "RNF-15",
            "Compatibilidad",
            "El sistema debe ejecutarse en navegadores modernos sin instalacion "
            "adicional.",
            "Aplicacion web construida con Next.js 15 y React 19.",
        ],
        [
            "RNF-16",
            "Disponibilidad",
            "El servidor debe exponer un punto de verificacion de estado.",
            "Endpoint 'GET /health'.",
        ],
    ],
    widths=[1.4, 2.4, 6.0, 6.2],
    caption="Requerimientos no funcionales y su evidencia",
)

missing(
    "No se localizaron metricas cuantitativas comprometidas (por ejemplo, tiempo "
    "maximo de respuesta, numero de usuarios concurrentes soportados o porcentaje "
    "de disponibilidad). Si el tribunal exige valores objetivo, deben definirse y "
    "medirse."
)

# ================================================= 12. ANALISIS DEL SISTEMA ===
h1("10. ANALISIS DEL SISTEMA")

h2("10.1 Actores")
table(
    ["Actor", "Tipo", "Descripcion"],
    [
        [
            "Administrador",
            "Primario",
            "Gestiona el padron de beneficiarios, viviendas y chorros; define la "
            "tarifa anual; consulta pagos y reportes. No emite recibos.",
        ],
        [
            "Tesorero",
            "Primario",
            "Recibe los pagos y emite los recibos de tarifa anual y de compra de "
            "chorro. No modifica el padron.",
        ],
        [
            "Beneficiario",
            "Externo, no usuario",
            "Vecino que recibe el servicio. No accede al sistema; es sujeto de "
            "registro y receptor del comprobante.",
        ],
        [
            "Supabase",
            "Sistema externo",
            "Provee autenticacion, base de datos PostgreSQL y almacenamiento de "
            "objetos.",
        ],
    ],
    widths=[3.2, 3.0, 9.8],
    caption="Actores del sistema",
)

h2("10.2 Modulos del sistema")
table(
    ["Modulo", "Responsabilidad", "Componentes principales"],
    [
        [
            "Autenticacion",
            "Registro, inicio de sesion, consulta de perfil y cierre de sesion.",
            "auth.routes.ts, auth.service.ts, login/page.tsx, registro/page.tsx",
        ],
        [
            "Padron",
            "Gestion de beneficiarios, viviendas y chorros.",
            "usuarios.routes.ts, usuarios.service.ts, (app)/usuarios/*",
        ],
        [
            "Facturacion",
            "Calculo de deuda, emision de recibos y generacion de PDF.",
            "facturacion.routes.ts, facturacion.service.ts, pdf.service.ts, "
            "emitir-factura-form.tsx",
        ],
        [
            "Configuracion",
            "Administracion de la tarifa anual y del lugar de pago.",
            "config.service.ts, (app)/configuracion/page.tsx",
        ],
        [
            "Reportes",
            "Consulta y exportacion de informacion agregada.",
            "reportes.routes.ts, reportes.service.ts, (app)/reportes/page.tsx",
        ],
        [
            "Indicadores",
            "Panel principal con metricas de recaudacion.",
            "facturacion.service.ts (dashboard), admin-dashboard.tsx",
        ],
        [
            "Seguridad y acceso",
            "Verificacion de token, autorizacion por rol y proteccion de rutas.",
            "middleware/auth.ts, role-gate.tsx, navigation.ts",
        ],
    ],
    widths=[3.0, 6.0, 7.0],
    caption="Modulos del sistema y sus componentes",
)

h2("10.3 Casos de uso")
p(
    "El siguiente diagrama resume la relacion entre actores y casos de uso "
    "principales. La imagen se genero a partir de la notacion Mermaid; el codigo "
    "fuente se incluye para permitir su regeneracion en https://mermaid.live."
)
fig("01_casos_uso.png", "Diagrama de casos de uso del sistema AquaPay")
code(
    """flowchart LR
  ADMIN([Administrador])
  TESO([Tesorero])

  subgraph SIS[Sistema AquaPay]
    UC01(Iniciar sesion)
    UC02(Registrar beneficiario)
    UC03(Registrar vivienda)
    UC04(Registrar chorro)
    UC05(Activar / desactivar beneficiario)
    UC06(Actualizar tarifa anual)
    UC07(Consultar historial de pagos)
    UC08(Generar reportes)
    UC09(Consultar anios pendientes)
    UC10(Cobrar tarifa anual)
    UC11(Cobrar compra de chorro)
    UC12(Descargar recibo en PDF)
    UC13(Consultar panel de indicadores)
  end

  ADMIN --> UC01
  ADMIN --> UC02
  ADMIN --> UC03
  ADMIN --> UC04
  ADMIN --> UC05
  ADMIN --> UC06
  ADMIN --> UC07
  ADMIN --> UC08
  ADMIN --> UC13

  TESO --> UC01
  TESO --> UC09
  TESO --> UC10
  TESO --> UC11
  TESO --> UC12
  TESO --> UC13

  UC10 -.incluye.-> UC09
  UC10 -.incluye.-> UC12
  UC11 -.incluye.-> UC12""",
    caption="Codigo Mermaid del diagrama de casos de uso",
)

h2("10.4 Flujo principal: emision de un recibo de tarifa anual")
p(
    "El diagrama de secuencia describe el intercambio entre tesorero, cliente, "
    "API, base de datos y almacenamiento durante la emision de un recibo."
)
fig("03_secuencia.png", "Diagrama de secuencia — emision de recibo de tarifa anual")
code(
    """sequenceDiagram
  actor T as Tesorero
  participant UI as Cliente Next.js
  participant API as API Express
  participant DB as PostgreSQL
  participant ST as Supabase Storage

  T->>UI: Selecciona beneficiario
  UI->>API: GET /api/usuarios
  UI->>API: GET /api/facturacion/pendientes/{viviendaId}
  API->>DB: Consulta vivienda, chorros y pagos_anuales
  DB-->>API: Anios pendientes y montos
  API-->>UI: Detalle de deuda
  UI->>API: GET /api/facturacion/siguiente-recibo
  API-->>UI: Correlativo previsto
  T->>UI: Elige tipo de cobro, anio y fecha
  UI->>API: POST /api/facturacion/cobrar/tarifa-anual
  API->>DB: BEGIN
  API->>DB: INSERT recibos
  API->>DB: INSERT pagos_anuales (por chorro y anio)
  API->>ST: Carga del PDF generado
  ST-->>API: URL firmada (1 hora)
  API->>DB: INSERT recibos_pdf
  API->>DB: COMMIT
  API-->>UI: 201 con recibo y PDF en base64
  UI-->>T: Descarga del comprobante""",
    caption="Codigo Mermaid del diagrama de secuencia de cobro",
)

p(
    "Complementariamente, el diagrama de flujo resume las decisiones del tesorero "
    "durante el proceso de facturacion."
)
fig("04_flujo.png", "Diagrama de flujo — proceso de facturacion", 12.5)
code(
    """flowchart TD
  INICIO([Inicio]) --> BUSCAR[Buscar y seleccionar beneficiario]
  BUSCAR --> AUTO[Autocompletar datos y cargar anios pendientes]
  AUTO --> DEUDA{Hay deuda o compra pendiente?}
  DEUDA -->|No| INFO[Informar: sin pendiente]
  INFO --> FIN1([Fin])
  DEUDA -->|Si| TIPO[Elegir tipo: tarifa anual o compra de chorro]
  TIPO --> DATOS[Ingresar anio/fecha - total automatico]
  DATOS --> VAL{Validacion OK?}
  VAL -->|No| TIPO
  VAL -->|Si| EMITIR[Emitir recibo - PDF - correlativo]
  EMITIR --> FIN2([Fin])""",
    caption="Codigo Mermaid del diagrama de flujo de facturacion",
)

h2("10.5 Regla de negocio del calculo de la deuda")
p(
    "La determinacion de los anios pendientes constituye la regla central del "
    "sistema. Se describe formalmente a continuacion."
)
code(
    """Sea V una vivienda con anio de inicio de cobro Ai
Sea C = { chorros de V con activo = verdadero }
Sea Y = { Ai, Ai+1, ..., Aactual }

Un anio y en Y esta PENDIENTE si y solo si:
    existe al menos un chorro c en C tal que
    no existe registro en pagos_anuales con (chorro_id = c, anio = y)

Monto por anio pendiente = tarifa_anual x SUMA(cantidad de cada c en C)
Total del recibo         = Monto por anio x cantidad de anios seleccionados""",
    caption="Formalizacion del calculo de anios pendientes",
)
note(
    "Observacion de diseno: el criterio de pendiente es 'al menos un chorro sin "
    "pago'. En consecuencia, si una vivienda incorpora un chorro nuevo, los anios "
    "previamente saldados vuelven a considerarse pendientes para el conjunto "
    "completo de chorros. Esta conducta debe validarse con el comite para confirmar "
    "que corresponde a la regla real de la comunidad.",
    color=MUTED,
)

# ================================================== 13. DISENO DEL SISTEMA ===
h1("11. DISENO DEL SISTEMA")

h2("11.1 Arquitectura general")
p(
    "El sistema adopta una arquitectura de tres capas distribuidas con servicios "
    "gestionados. El cliente y el servidor se despliegan de forma independiente y "
    "se comunican exclusivamente mediante HTTP sobre el prefijo '/api'."
)
fig("02_arquitectura.png", "Diagrama de arquitectura del sistema AquaPay")
code(
    """flowchart TD
  U[Usuario en navegador] --> FE

  subgraph FE[Cliente - Next.js 15 / React 19]
    PAGES[App Router: rutas auth y app]
    CTX[AuthContext - token en Web Storage]
    APICLI[lib/api.ts - cliente HTTP]
    GATE[RoleGate + AppShell]
  end

  APICLI -->|HTTPS + Bearer JWT| BE

  subgraph BE[Servidor - Express 4 / TypeORM]
    MW[helmet, cors, json, morgan]
    AUTHMW[requireAuth - verifica JWT con JWKS]
    ROLES[requireRoles - control por rol]
    VAL[validateBody - class-validator]
    RT[Rutas: auth, usuarios, facturacion, reportes]
    SVC[Servicios de negocio]
    PDF[pdf.service - pdf-lib]
    EH[errorHandler]
  end

  SVC --> DB[(PostgreSQL - Supabase)]
  BE --> AUTHSB[Supabase Auth]
  PDF --> STORE[(Supabase Storage - bucket recibos)]
  AUTHMW -.consulta JWKS.-> AUTHSB""",
    caption="Codigo Mermaid del diagrama de arquitectura",
)

h2("11.2 Componentes del servidor y su responsabilidad")
table(
    ["Capa", "Directorio", "Responsabilidad"],
    [
        ["Entrada", "src/server.ts", "Inicializa el origen de datos y levanta el servidor HTTP."],
        ["Aplicacion", "src/app.ts", "Registra middlewares globales, monta las rutas y el manejador de errores."],
        ["Rutas", "src/routes/", "Define los endpoints, aplica autenticacion, autorizacion y validacion."],
        ["Transferencia", "src/dto/", "Declara la forma y las restricciones de los datos de entrada."],
        ["Negocio", "src/services/", "Concentra las reglas de negocio y el acceso a datos."],
        ["Persistencia", "src/entities/", "Define el mapeo objeto-relacional de las nueve tablas."],
        ["Transversal", "src/middleware/", "Autenticacion, validacion y manejo centralizado de errores."],
        ["Utilidades", "src/utils/", "Errores tipados, normalizacion de DPI y conversion de montos a letras."],
        ["Infraestructura", "src/lib/, src/config/", "Cliente de Supabase y carga de variables de entorno."],
    ],
    widths=[2.6, 3.4, 10.0],
    caption="Capas del servidor y su responsabilidad",
)

h2("11.3 Flujo de informacion de una peticion protegida")
code(
    """Peticion HTTP
   -> helmet            (cabeceras de seguridad)
   -> cors              (verificacion del origen permitido)
   -> express.json      (analisis del cuerpo, limite 2 MB)
   -> morgan            (registro de la peticion)
   -> requireAuth       (verificacion del JWT contra el JWKS de Supabase
                         y carga del perfil, exigiendo activo = verdadero)
   -> requireRoles(...) (autorizacion por rol)
   -> validateBody(DTO) (validacion y saneamiento del cuerpo)
   -> controlador       (invocacion del servicio correspondiente)
   -> servicio          (regla de negocio y acceso a la base de datos)
   -> respuesta { success: true, data }
   -> errorHandler      (en caso de excepcion)""",
    caption="Cadena de procesamiento de una peticion autenticada",
)

h2("11.4 Contrato de respuesta de la interfaz de programacion")
p(
    "Todas las respuestas satisfactorias se envuelven en un objeto con la propiedad "
    "'success' en verdadero y la carga util en 'data'. El cliente desempaqueta "
    "automaticamente este contenedor en 'lib/api.ts' mediante la expresion "
    "'json.data ?? json'."
)
code(
    """// Respuesta satisfactoria
{ "success": true, "data": { ... } }

// Error controlado (AppError)
{ "success": false, "message": "Descripcion del error", "code": "NOT_FOUND" }

// Error no controlado
{ "success": false, "message": "Error interno del servidor" }""",
    caption="Formato uniforme de las respuestas de la API",
)

h2("11.5 Integraciones externas")
table(
    ["Servicio", "Funcion", "Punto de integracion"],
    [
        [
            "Supabase Auth",
            "Creacion de usuarios, verificacion de contrasenas y emision de tokens.",
            "auth.service.ts mediante 'supabaseAdmin.auth.admin.createUser' y "
            "'signInWithPassword'.",
        ],
        [
            "Supabase PostgreSQL",
            "Persistencia de las nueve tablas del dominio.",
            "data-source.ts con la variable 'DATABASE_URL' y SSL habilitado.",
        ],
        [
            "Supabase Storage",
            "Almacenamiento de los comprobantes en PDF.",
            "facturacion.service.ts, bucket definido por 'SUPABASE_STORAGE_BUCKET'.",
        ],
        [
            "JWKS de Supabase",
            "Provision de la clave publica para verificar la firma de los tokens.",
            "middleware/auth.ts con 'createRemoteJWKSet'.",
        ],
    ],
    widths=[3.4, 6.0, 6.6],
    caption="Integraciones con servicios externos",
)

h2("11.6 Diseno de la interfaz de usuario")
p(
    "El sistema visual se define mediante variables CSS declaradas en "
    "'globals.css'. Se implementan dos temas completos, claro y oscuro, con una "
    "paleta acromatica (blanco y negro) y radios de borde uniformes. La navegacion "
    "se adapta al rol: el administrador utiliza una barra lateral fija en pantallas "
    "medianas y grandes, mientras que el tesorero utiliza una barra superior "
    "horizontal."
)
table(
    ["Aspecto", "Implementacion"],
    [
        ["Tipografia", "Inter para texto general y JetBrains Mono para datos numericos y DPI."],
        ["Tema", "next-themes con atributo de clase; tema claro por omision y deteccion del tema del sistema."],
        ["Componentes base", "shadcn sobre @base-ui/react (boton, entrada, tabla, dialogo, hoja lateral, entre otros)."],
        ["Iconografia", "lucide-react."],
        ["Notificaciones", "sonner, posicionadas en la esquina superior derecha."],
        ["Graficos", "recharts, con colores tomados de las variables del tema."],
        ["Accesibilidad", "Etiquetas asociadas a los campos, atributos ARIA en grupos de opciones y anillo de foco visible."],
    ],
    widths=[3.4, 12.6],
    caption="Decisiones de diseno de la interfaz",
)

# ============================================= 14. DISENO DE BASE DE DATOS ===
h1("12. DISENO DE LA BASE DE DATOS")

h2("12.1 Motor y estrategia de administracion del esquema")
p(
    "El motor es PostgreSQL, provisto por Supabase. La conexion se establece "
    "mediante la cadena 'DATABASE_URL' con SSL habilitado. El origen de datos de "
    "TypeORM se configura con 'synchronize: false', de modo que el esquema no se "
    "altera automaticamente a partir de las entidades; su evolucion se administra "
    "con el script inicial 'schema.sql' y cuatro migraciones SQL numeradas."
)

h2("12.2 Diagrama entidad-relacion")
p(
    "El diagrama entidad-relacion refleja las nueve tablas del esquema PostgreSQL "
    "definido en schema.sql. Se incluye la imagen y el codigo Mermaid de origen."
)
fig("05_er.png", "Diagrama entidad-relacion de AquaPay")
fig("05_er_detalle.png", "Diagrama entidad-relacion (vista detallada)")
code(
    """erDiagram
  PERFILES ||--o{ RECIBOS : "emite (creado_por)"
  PERFILES ||--o{ CONFIGURACION : "actualiza"
  USUARIOS_COMUNIDAD ||--o{ VIVIENDAS : "posee"
  VIVIENDAS ||--o{ CHORROS : "tiene"
  VIVIENDAS ||--o{ RECIBOS : "recibe"
  RECIBOS ||--o{ PAGOS_ANUALES : "detalla"
  RECIBOS ||--o{ PAGOS_COMPRA_CHORRO : "detalla"
  RECIBOS ||--|| RECIBOS_PDF : "genera"
  CHORROS ||--o{ PAGOS_ANUALES : "es cobrado en"
  CHORROS ||--o{ PAGOS_COMPRA_CHORRO : "es adquirido en"

  PERFILES {
    uuid id PK
    varchar nombre
    varchar dpi UK
    enum rol
    text mfa_secreto
    boolean mfa_habilitado
    boolean activo
    timestamptz fecha_creacion
  }
  USUARIOS_COMUNIDAD {
    uuid id PK
    varchar nombre_completo
    varchar dpi UK
    varchar telefono
    boolean activo
    timestamptz fecha_registro
  }
  VIVIENDAS {
    uuid id PK
    uuid usuario_id FK
    varchar direccion
    boolean activa
    integer anio_inicio_cobro
    timestamptz fecha_registro
  }
  CHORROS {
    uuid id PK
    uuid vivienda_id FK
    numeric precio_compra
    integer cantidad
    boolean activo
    date fecha_instalacion
    timestamptz fecha_registro
  }
  RECIBOS {
    uuid id PK
    varchar numero_recibo UK
    integer anio_recibo
    integer secuencia
    uuid vivienda_id FK
    varchar tipo_cobro
    numeric total_pagado
    text cantidad_en_letras
    text descripcion_pago
    varchar lugar_pago
    date fecha_pago
    uuid creado_por FK
    timestamptz fecha_creacion
  }
  PAGOS_ANUALES {
    uuid id PK
    uuid recibo_id FK
    uuid chorro_id FK
    integer anio
    numeric monto_pagado
  }
  PAGOS_COMPRA_CHORRO {
    uuid id PK
    uuid recibo_id FK
    uuid chorro_id FK
    numeric monto_pagado
    date fecha_pago
  }
  RECIBOS_PDF {
    uuid id PK
    uuid recibo_id FK-UK
    varchar nombre_archivo
    text ruta_storage
    text url_publica
    integer tamano_bytes
    varchar tipo_mime
    timestamptz fecha_subida
  }
  CONFIGURACION {
    serial id PK
    varchar clave UK
    text valor
    timestamptz actualizado_en
    uuid actualizado_por FK
  }""",
    caption="Codigo Mermaid del diagrama entidad-relacion",
)

h2("12.3 Diccionario de datos")

h3("12.3.1 Tabla 'perfiles'")
p("Almacena las cuentas de acceso al sistema. La llave primaria referencia al identificador del usuario en Supabase Auth.")
table(
    ["Campo", "Tipo", "Restricciones", "Descripcion"],
    [
        ["id", "UUID", "PK, FK -> auth.users(id) ON DELETE CASCADE", "Identificador del usuario en Supabase Auth."],
        ["nombre", "VARCHAR(150)", "NOT NULL", "Nombre completo del usuario del sistema."],
        ["dpi", "VARCHAR(20)", "NOT NULL, UNIQUE", "Documento Personal de Identificacion, usado como credencial."],
        ["rol", "rol_sistema", "NOT NULL", "Valor enumerado: 'administrador' o 'tesorero'."],
        ["mfa_secreto", "TEXT", "NULL", "Reservado para el secreto TOTP. Sin uso en la implementacion actual."],
        ["mfa_habilitado", "BOOLEAN", "NOT NULL DEFAULT FALSE", "Reservado. Siempre falso en la implementacion actual."],
        ["activo", "BOOLEAN", "NOT NULL DEFAULT TRUE", "Habilitacion de la cuenta; si es falso se rechaza el acceso."],
        ["fecha_creacion", "TIMESTAMPTZ", "NOT NULL DEFAULT NOW()", "Fecha de creacion de la cuenta."],
    ],
    widths=[3.0, 2.6, 5.2, 5.2],
)

h3("12.3.2 Tabla 'usuarios_comunidad'")
p("Registra a los beneficiarios del servicio. No son usuarios del sistema.")
table(
    ["Campo", "Tipo", "Restricciones", "Descripcion"],
    [
        ["id", "UUID", "PK DEFAULT gen_random_uuid()", "Identificador del beneficiario."],
        ["nombre_completo", "VARCHAR(200)", "NOT NULL", "Nombre del vecino beneficiario."],
        ["dpi", "VARCHAR(20)", "NOT NULL, UNIQUE", "Documento de identificacion del beneficiario."],
        ["telefono", "VARCHAR(30)", "NULL", "Numero de contacto."],
        ["activo", "BOOLEAN", "NOT NULL DEFAULT TRUE", "Permite la baja logica sin eliminar el historial."],
        ["fecha_registro", "TIMESTAMPTZ", "NOT NULL DEFAULT NOW()", "Fecha de incorporacion al padron."],
    ],
    widths=[3.0, 2.6, 5.2, 5.2],
)

h3("12.3.3 Tabla 'viviendas'")
table(
    ["Campo", "Tipo", "Restricciones", "Descripcion"],
    [
        ["id", "UUID", "PK DEFAULT gen_random_uuid()", "Identificador de la vivienda."],
        ["usuario_id", "UUID", "NOT NULL, FK -> usuarios_comunidad(id) ON DELETE RESTRICT", "Propietario de la vivienda."],
        ["direccion", "VARCHAR(300)", "NOT NULL", "Ubicacion de la vivienda dentro de la aldea."],
        ["activa", "BOOLEAN", "NOT NULL DEFAULT TRUE", "Estado de la vivienda."],
        ["anio_inicio_cobro", "INTEGER", "NOT NULL DEFAULT anio actual", "Anio a partir del cual se genera deuda anual."],
        ["fecha_registro", "TIMESTAMPTZ", "NOT NULL DEFAULT NOW()", "Fecha de registro."],
    ],
    widths=[3.0, 2.6, 5.2, 5.2],
)

h3("12.3.4 Tabla 'chorros'")
table(
    ["Campo", "Tipo", "Restricciones", "Descripcion"],
    [
        ["id", "UUID", "PK DEFAULT gen_random_uuid()", "Identificador del punto de agua."],
        ["vivienda_id", "UUID", "NOT NULL, FK -> viviendas(id) ON DELETE RESTRICT", "Vivienda a la que pertenece."],
        ["precio_compra", "NUMERIC(12,2)", "NOT NULL DEFAULT 0", "Costo unico de adquisicion del chorro."],
        ["cantidad", "INTEGER", "NOT NULL DEFAULT 1, CHECK (cantidad > 0)", "Numero de unidades que representa el registro."],
        ["activo", "BOOLEAN", "NOT NULL DEFAULT TRUE", "Solo los chorros activos generan deuda anual."],
        ["fecha_instalacion", "DATE", "NOT NULL DEFAULT CURRENT_DATE", "Fecha de instalacion fisica."],
        ["fecha_registro", "TIMESTAMPTZ", "NOT NULL DEFAULT NOW()", "Fecha de registro en el sistema."],
    ],
    widths=[3.0, 2.6, 5.2, 5.2],
)

h3("12.3.5 Tabla 'recibos'")
table(
    ["Campo", "Tipo", "Restricciones", "Descripcion"],
    [
        ["id", "UUID", "PK DEFAULT gen_random_uuid()", "Identificador del recibo."],
        ["numero_recibo", "VARCHAR(20)", "NOT NULL, UNIQUE", "Correlativo con relleno de tres digitos."],
        ["anio_recibo", "INTEGER", "NOT NULL", "Anio del talonario; el correlativo se reinicia con el."],
        ["secuencia", "INTEGER", "NOT NULL, UNIQUE junto con anio_recibo", "Numero secuencial dentro del anio."],
        ["vivienda_id", "UUID", "NOT NULL, FK -> viviendas(id) ON DELETE RESTRICT", "Vivienda a la que se emite el recibo."],
        ["tipo_cobro", "VARCHAR(30)", "NOT NULL, CHECK IN ('tarifa_anual','compra_chorro')", "Concepto del cobro."],
        ["total_pagado", "NUMERIC(12,2)", "NOT NULL, CHECK (>= 0)", "Importe total del recibo."],
        ["cantidad_en_letras", "TEXT", "NOT NULL", "Importe expresado en palabras."],
        ["descripcion_pago", "TEXT", "NOT NULL", "Detalle textual del concepto cobrado."],
        ["lugar_pago", "VARCHAR(200)", "NOT NULL", "Lugar donde se efectuo el pago."],
        ["fecha_pago", "DATE", "NOT NULL DEFAULT CURRENT_DATE", "Fecha del pago, seleccionable por el tesorero."],
        ["creado_por", "UUID", "NOT NULL, FK -> perfiles(id)", "Tesorero que emitio el recibo."],
        ["fecha_creacion", "TIMESTAMPTZ", "NOT NULL DEFAULT NOW()", "Marca temporal de creacion del registro."],
    ],
    widths=[3.0, 2.6, 5.2, 5.2],
)

h3("12.3.6 Tablas de detalle de pago")
table(
    ["Tabla", "Campo", "Tipo", "Restricciones"],
    [
        ["pagos_anuales", "id", "UUID", "PK"],
        ["pagos_anuales", "recibo_id", "UUID", "NOT NULL, FK -> recibos(id) ON DELETE CASCADE"],
        ["pagos_anuales", "chorro_id", "UUID", "NOT NULL, FK -> chorros(id) ON DELETE RESTRICT"],
        ["pagos_anuales", "anio", "INTEGER", "NOT NULL"],
        ["pagos_anuales", "monto_pagado", "NUMERIC(12,2)", "NOT NULL"],
        ["pagos_anuales", "(chorro_id, anio)", "-", "UNIQUE: impide el doble cobro del mismo anio"],
        ["pagos_compra_chorro", "id", "UUID", "PK"],
        ["pagos_compra_chorro", "recibo_id", "UUID", "NOT NULL, FK -> recibos(id) ON DELETE CASCADE"],
        ["pagos_compra_chorro", "chorro_id", "UUID", "NOT NULL, FK -> chorros(id) ON DELETE RESTRICT"],
        ["pagos_compra_chorro", "monto_pagado", "NUMERIC(12,2)", "NOT NULL"],
        ["pagos_compra_chorro", "fecha_pago", "DATE", "NOT NULL DEFAULT CURRENT_DATE"],
    ],
    widths=[4.2, 3.6, 3.2, 5.0],
)
note(
    "Hallazgo: la tabla 'pagos_compra_chorro' NO declara una restriccion UNIQUE "
    "sobre 'chorro_id'. La proteccion contra el doble cobro de una compra se "
    "realiza unicamente en la capa de aplicacion, mediante una consulta previa. "
    "Ante peticiones concurrentes existe riesgo de duplicidad. Se recomienda "
    "agregar la restriccion en la base de datos."
)

h3("12.3.7 Tablas 'recibos_pdf' y 'configuracion'")
table(
    ["Tabla", "Campo", "Tipo", "Restricciones / Descripcion"],
    [
        ["recibos_pdf", "id", "UUID", "PK"],
        ["recibos_pdf", "recibo_id", "UUID", "NOT NULL, UNIQUE, FK -> recibos(id) ON DELETE CASCADE"],
        ["recibos_pdf", "nombre_archivo", "VARCHAR(255)", "Nombre del archivo generado."],
        ["recibos_pdf", "ruta_storage", "TEXT", "Ruta dentro del bucket, con la forma '{anio}/{archivo}'."],
        ["recibos_pdf", "url_publica", "TEXT", "URL firmada temporal, con vigencia de una hora."],
        ["recibos_pdf", "tamano_bytes", "INTEGER", "DEFAULT 0."],
        ["recibos_pdf", "tipo_mime", "VARCHAR(80)", "DEFAULT 'application/pdf'."],
        ["recibos_pdf", "fecha_subida", "TIMESTAMPTZ", "DEFAULT NOW()."],
        ["configuracion", "id", "SERIAL", "PK"],
        ["configuracion", "clave", "VARCHAR(80)", "NOT NULL, UNIQUE. Claves usadas: 'tarifa_anual' y 'lugar_pago'."],
        ["configuracion", "valor", "TEXT", "NOT NULL. Valor almacenado como texto."],
        ["configuracion", "actualizado_en", "TIMESTAMPTZ", "DEFAULT NOW()."],
        ["configuracion", "actualizado_por", "UUID", "FK -> perfiles(id)."],
    ],
    widths=[3.4, 3.4, 3.0, 6.2],
)

h2("12.4 Indices")
table(
    ["Indice", "Tabla", "Columna", "Proposito"],
    [
        ["idx_usuarios_dpi", "usuarios_comunidad", "dpi", "Busqueda de beneficiarios por documento."],
        ["idx_viviendas_usuario", "viviendas", "usuario_id", "Recuperacion de viviendas por propietario."],
        ["idx_chorros_vivienda", "chorros", "vivienda_id", "Recuperacion de chorros por vivienda."],
        ["idx_recibos_vivienda", "recibos", "vivienda_id", "Historial de recibos por vivienda."],
        ["idx_recibos_fecha", "recibos", "fecha_pago", "Agregacion de ingresos por periodo."],
        ["idx_pagos_anuales_anio", "pagos_anuales", "anio", "Determinacion de anios pendientes."],
        ["idx_perfiles_dpi", "perfiles", "dpi", "Busqueda del perfil durante el inicio de sesion."],
    ],
    widths=[4.2, 4.0, 3.0, 4.8],
    caption="Indices declarados en el esquema",
)

h2("12.5 Migraciones aplicadas")
table(
    ["Archivo", "Cambio aplicado"],
    [
        ["001_add_mfa_columns.sql", "Agrega 'mfa_secreto' y 'mfa_habilitado' a la tabla 'perfiles'."],
        ["002_add_perfil_activo.sql", "Agrega 'activo' a la tabla 'perfiles'."],
        [
            "003_sync_schema_entities.sql",
            "Sincroniza el esquema con las entidades: agrega 'activo' a "
            "'usuarios_comunidad', 'anio_inicio_cobro' a 'viviendas' con relleno "
            "retroactivo, 'fecha_registro' a 'chorros', y 'anio_recibo', "
            "'secuencia' y 'tipo_cobro' a 'recibos'; inserta la configuracion "
            "inicial.",
        ],
        [
            "004_drop_chorros_cuota_mensual.sql",
            "Elimina la columna 'cuota_mensual' de 'chorros', vestigio del esquema "
            "de cobro mensual descartado.",
        ],
    ],
    widths=[5.0, 11.0],
    caption="Migraciones del esquema de base de datos",
)

h2("12.6 Politicas de seguridad de la base de datos")
missing(
    "No se localizaron sentencias de seguridad a nivel de fila (Row Level Security) "
    "ni politicas 'CREATE POLICY' en el script de esquema ni en las migraciones. El "
    "servidor accede a la base de datos con la cadena de conexion directa, por lo "
    "que el control de acceso reside integramente en la capa de aplicacion. Si el "
    "tribunal exige defensa en profundidad a nivel de base de datos, esta ausencia "
    "debe justificarse o subsanarse."
)

# =============================================== 15. TECNOLOGIAS UTILIZADAS ===
h1("13. TECNOLOGIAS UTILIZADAS")
p(
    "Las versiones corresponden a las declaradas en los archivos 'package.json' de "
    "cada proyecto. Se incluyen unicamente las tecnologias efectivamente empleadas."
)

h2("13.1 Cliente")
table(
    ["Tecnologia", "Version", "Uso dentro del proyecto"],
    [
        ["TypeScript", "^5", "Lenguaje de desarrollo, con verificacion estricta de tipos."],
        ["Next.js", "15.5.23", "Entorno de trabajo React con App Router y compilacion mediante Turbopack."],
        ["React", "19.1.0", "Biblioteca de construccion de interfaces."],
        ["React DOM", "19.1.0", "Renderizado de React en el navegador."],
        ["Tailwind CSS", "^4", "Sistema de estilos por clases utilitarias."],
        ["@tailwindcss/postcss", "^4", "Integracion de Tailwind con PostCSS."],
        ["shadcn", "^4.16.2", "Generador de componentes de interfaz reutilizables."],
        ["@base-ui/react", "^1.7.0", "Primitivos accesibles sobre los que se construyen los componentes."],
        ["lucide-react", "^1.31.0", "Biblioteca de iconografia."],
        ["next-themes", "^0.4.6", "Gestion del tema claro y oscuro."],
        ["recharts", "^3.10.1", "Graficos de barras de ingresos por mes."],
        ["sonner", "^2.0.8", "Notificaciones emergentes."],
        ["class-variance-authority", "^0.7.1", "Definicion de variantes de estilo de los componentes."],
        ["clsx", "^2.1.1", "Composicion condicional de clases CSS."],
        ["tailwind-merge", "^3.6.0", "Resolucion de conflictos entre clases de Tailwind."],
        ["tw-animate-css", "^1.4.0", "Animaciones utilitarias."],
        ["date-fns", "^4.4.0", "Manipulacion de fechas."],
        ["ESLint", "^9", "Analisis estatico con la configuracion 'next/core-web-vitals'."],
    ],
    widths=[4.4, 2.6, 9.0],
    caption="Tecnologias del cliente",
)
note(
    "Observacion: la dependencia '@supabase/supabase-js' (^2.112.2) esta declarada "
    "en el cliente y existen variables de entorno asociadas, pero no se localizo "
    "ninguna importacion de Supabase en 'frontend/src'. El cliente se comunica "
    "unicamente con la API propia. Se recomienda retirar la dependencia o "
    "documentar su proposito.",
    color=MUTED,
)

h2("13.2 Servidor")
table(
    ["Tecnologia", "Version", "Uso dentro del proyecto"],
    [
        ["Node.js", "22 (en integracion continua)", "Entorno de ejecucion del servidor."],
        ["TypeScript", "^5.7.3", "Lenguaje de desarrollo con decoradores habilitados."],
        ["Express", "^4.21.2", "Entorno de trabajo HTTP y enrutamiento."],
        ["TypeORM", "^0.7.20 (declarado ^0.3.20)", "Mapeo objeto-relacional y gestion de transacciones."],
        ["pg", "^8.13.3", "Controlador de PostgreSQL."],
        ["class-validator", "^0.14.1", "Validacion declarativa de los objetos de transferencia de datos."],
        ["class-transformer", "^0.5.1", "Conversion del cuerpo de la peticion a instancias de DTO."],
        ["jose", "^5.9.6", "Verificacion de JWT contra el conjunto de claves remoto."],
        ["@supabase/supabase-js", "^2.49.1", "Cliente administrativo de Supabase Auth y Storage."],
        ["helmet", "^8.0.0", "Cabeceras HTTP de seguridad."],
        ["cors", "^2.8.5", "Control del origen de las peticiones."],
        ["morgan", "^1.10.0", "Registro de peticiones HTTP."],
        ["dotenv", "^16.4.7", "Carga de variables de entorno."],
        ["pdf-lib", "^1.17.1", "Generacion de los recibos y reportes en PDF."],
        ["node-signpdf", "^3.0.0", "Firma digital opcional del PDF mediante certificado P12."],
        ["reflect-metadata", "^0.2.2", "Metadatos requeridos por los decoradores de TypeORM."],
        ["Vitest", "^3.0.5", "Entorno de pruebas unitarias."],
        ["tsx", "^4.19.2", "Ejecucion directa de TypeScript en desarrollo."],
    ],
    widths=[4.4, 3.4, 8.2],
    caption="Tecnologias del servidor",
)
note(
    "Observacion: las dependencias 'bcryptjs', 'otplib', 'qrcode' y 'uuid' figuran "
    "declaradas en 'backend/package.json' pero no se localizo ninguna importacion "
    "de ellas en 'backend/src'. Corresponden a funcionalidades previstas "
    "(autenticacion multifactor y cifrado local de contrasenas) que no fueron "
    "implementadas, dado que la gestion de credenciales se delego en Supabase Auth.",
    color=MUTED,
)

h2("13.3 Infraestructura y servicios")
table(
    ["Servicio", "Funcion", "Evidencia"],
    [
        ["Supabase PostgreSQL", "Base de datos relacional gestionada.", "DATABASE_URL en '.env.example'."],
        ["Supabase Auth", "Emision y verificacion de credenciales.", "auth.service.ts y SUPABASE_JWKS_URL."],
        ["Supabase Storage", "Almacenamiento de los recibos en PDF.", "Bucket 'recibos' definido en 'config/env.ts'."],
        ["Vercel", "Alojamiento del cliente.", "Tabla de despliegue del archivo README.md."],
        ["Render", "Alojamiento del servidor.", "Tabla de despliegue del archivo README.md."],
        ["GitHub Actions", "Integracion continua.", "Archivo '.github/workflows/ci.yml'."],
    ],
    widths=[3.6, 5.4, 7.0],
    caption="Infraestructura y servicios de terceros",
)

h2("13.4 Control de versiones")
note(
    "El directorio analizado no contiene un repositorio Git inicializado: no se "
    "localizo la carpeta '.git'. Existen el archivo '.gitignore' y un flujo de "
    "GitHub Actions que asume las ramas 'main' o 'master', lo que indica que el "
    "control de versiones estaba previsto. Antes de la entrega debe inicializarse "
    "el repositorio y publicarse en un servicio remoto, ya que el historial de "
    "versiones suele ser requisito de evaluacion."
)

# ============================================ 16. ESTRUCTURA DEL PROYECTO ===
h1("14. ESTRUCTURA DEL PROYECTO")

h2("14.1 Arbol de directorios")
code(
    """aquapay/
|-- .github/
|   `-- workflows/
|       `-- ci.yml                  Integracion continua (lint, build, tsc)
|-- .vscode/
|   `-- settings.json               Preferencias del editor
|-- .gitignore
|-- README.md                       Guia breve de instalacion y despliegue
|
|-- backend/                        API REST (Express + TypeORM)
|   |-- .env.example                Plantilla de variables de entorno
|   |-- package.json
|   |-- tsconfig.json
|   `-- src/
|       |-- app.ts                  Creacion de la aplicacion Express
|       |-- server.ts               Punto de entrada; inicializa el origen de datos
|       |-- config/
|       |   `-- env.ts              Carga y validacion de variables de entorno
|       |-- database/
|       |   |-- data-source.ts      Configuracion del origen de datos de TypeORM
|       |   |-- schema.sql          Script de creacion del esquema
|       |   `-- migrations/         Cuatro migraciones SQL numeradas
|       |-- dto/                    Objetos de transferencia de datos
|       |   |-- auth.dto.ts
|       |   |-- usuario.dto.ts
|       |   |-- vivienda.dto.ts
|       |   `-- facturacion.dto.ts
|       |-- entities/               Nueve entidades TypeORM
|       |   |-- Perfil.ts
|       |   |-- Configuracion.ts
|       |   |-- UsuarioComunidad.ts
|       |   |-- Vivienda.ts
|       |   |-- Chorro.ts
|       |   |-- Recibo.ts
|       |   |-- PagoAnual.ts
|       |   |-- PagoCompraChorro.ts
|       |   |-- ReciboPdf.ts
|       |   `-- index.ts
|       |-- lib/
|       |   `-- supabase.ts         Cliente administrativo de Supabase
|       |-- middleware/
|       |   |-- auth.ts             requireAuth y requireRoles
|       |   |-- validate.ts         validateBody
|       |   `-- error-handler.ts    Manejo centralizado de errores
|       |-- routes/                 Definicion de los endpoints
|       |   |-- auth.routes.ts
|       |   |-- usuarios.routes.ts
|       |   |-- facturacion.routes.ts
|       |   `-- reportes.routes.ts
|       |-- services/               Reglas de negocio
|       |   |-- auth.service.ts
|       |   |-- usuarios.service.ts
|       |   |-- facturacion.service.ts
|       |   |-- config.service.ts
|       |   |-- pdf.service.ts
|       |   `-- reportes.service.ts
|       `-- utils/
|           |-- errors.ts           Errores tipados con codigo HTTP
|           |-- dpi.ts              Normalizacion del documento de identificacion
|           |-- numero-a-letras.ts  Conversion de montos a texto
|           `-- numero-a-letras.test.ts
|
`-- frontend/                       Cliente web (Next.js 15)
    |-- .env.example
    |-- components.json             Configuracion de shadcn
    |-- next.config.ts
    |-- eslint.config.mjs
    |-- postcss.config.mjs
    |-- package.json
    |-- tsconfig.json
    `-- src/
        |-- app/
        |   |-- layout.tsx          Layout raiz: fuentes, tema, sesion
        |   |-- globals.css         Variables de tema y utilidades
        |   |-- page.tsx            Redireccion segun estado de sesion
        |   |-- (auth)/             Rutas publicas
        |   |   |-- login/page.tsx
        |   |   |-- registro/page.tsx
        |   |   `-- mfa/            Rutas reservadas (solo redirigen)
        |   `-- (app)/              Rutas protegidas
        |       |-- layout.tsx      AppShell + RoleGate
        |       |-- dashboard/page.tsx
        |       |-- usuarios/       Listado, alta y detalle
        |       |-- facturacion/    Emision de recibos
        |       |-- pagos/page.tsx
        |       |-- reportes/page.tsx
        |       `-- configuracion/page.tsx
        |-- components/
        |   |-- auth/               Shell de acceso y utilidades de formulario
        |   |-- layout/             Barra lateral, navegacion movil y superior
        |   |-- admin/              Panel del administrador
        |   |-- facturacion/        Formulario de emision de factura
        |   |-- usuarios/
        |   |-- ui/                 Primitivos de interfaz (shadcn)
        |   |-- theme-provider.tsx
        |   `-- theme-toggle.tsx
        `-- lib/
            |-- api.ts              Cliente HTTP y manejo de errores
            |-- auth-context.tsx    Contexto de sesion
            |-- navigation.ts       Enlaces y control de acceso por rol
            |-- types.ts            Tipos compartidos
            |-- numero-a-letras.ts  Vista previa del monto en letras
            `-- utils.ts""",
    caption="Estructura de directorios del proyecto",
)

h2("14.2 Funcion de los directorios principales")
table(
    ["Directorio", "Funcion"],
    [
        ["backend/src/routes", "Define la superficie HTTP: metodo, ruta, middlewares y delegacion al servicio."],
        ["backend/src/services", "Concentra las reglas de negocio. Es la unica capa que accede a los repositorios."],
        ["backend/src/entities", "Declara el modelo de datos y su correspondencia con las tablas."],
        ["backend/src/dto", "Especifica el contrato de entrada y sus restricciones de validacion."],
        ["backend/src/middleware", "Implementa preocupaciones transversales: autenticacion, validacion y errores."],
        ["backend/src/database", "Contiene el origen de datos, el esquema inicial y las migraciones."],
        ["frontend/src/app", "Define las rutas mediante el sistema de archivos del App Router."],
        ["frontend/src/components", "Componentes reutilizables, organizados por dominio funcional."],
        ["frontend/src/lib", "Cliente HTTP, contexto de sesion, navegacion por rol y tipos compartidos."],
    ],
    widths=[4.6, 11.4],
    caption="Funcion de los directorios principales",
)

# ==================================================== 17. IMPLEMENTACION ===
h1("15. IMPLEMENTACION")

h2("15.1 Modulo de autenticacion")
table(
    ["Aspecto", "Detalle"],
    [
        ["Proposito", "Gestionar el acceso de los usuarios del sistema mediante DPI y contrasena."],
        ["Componentes", "auth.routes.ts, auth.service.ts, middleware/auth.ts, login/page.tsx, registro/page.tsx, auth-context.tsx"],
        ["Endpoints", "GET /registro-opciones, POST /registro, POST /login, GET /me, POST /logout"],
        ["Tablas", "perfiles (y la tabla auth.users administrada por Supabase)"],
        ["Validaciones", "DPI de 13 a 20 digitos mediante expresion regular; contrasena de 8 a 72 caracteres; rol restringido al conjunto enumerado."],
        ["Manejo de errores", "409 si el DPI ya existe; 403 si se solicita el rol administrador sin cumplir la condicion de arranque; 401 ante credenciales invalidas o perfil inactivo."],
        ["Seguridad", "Las contrasenas nunca se almacenan ni se procesan localmente; se delegan a Supabase Auth. El mensaje de error de inicio de sesion es generico para no revelar si el DPI existe."],
    ],
    widths=[3.4, 12.6],
)
p(
    "El sistema no utiliza el correo electronico como identificador de negocio. "
    "Dado que Supabase Auth requiere un correo, el servicio construye una direccion "
    "sintetica a partir del DPI:"
)
code(
    """function emailFromDpi(dpi: string): string {
  return `${dpi}@sibana.aquapay.gt`;
}""",
    caption="Generacion del identificador sintetico de Supabase Auth (auth.service.ts)",
)
p(
    "La regla de arranque impide que cualquier visitante se registre como "
    "administrador una vez que ya existe uno activo:"
)
code(
    """async puedeRegistrarAdministrador() {
  const admins = await this.perfiles().count({
    where: { rol: "administrador", activo: true },
  });
  return admins === 0;
}""",
    caption="Regla de arranque para la creacion del primer administrador",
)
note(
    "Estado incompleto verificado: el metodo 'logout' recibe el token pero retorna "
    "'{ ok: true }' sin invalidarlo en Supabase. El cierre de sesion es efectivo "
    "unicamente en el cliente, que borra el almacenamiento local. Un token "
    "previamente copiado continua siendo valido hasta su expiracion."
)

h2("15.2 Modulo de padron de beneficiarios")
table(
    ["Aspecto", "Detalle"],
    [
        ["Proposito", "Mantener el registro de beneficiarios, sus viviendas y sus chorros."],
        ["Componentes", "usuarios.routes.ts, usuarios.service.ts, (app)/usuarios/page.tsx, usuarios/nuevo/page.tsx, usuarios/[id]/page.tsx"],
        ["Endpoints", "Doce endpoints de creacion, consulta, actualizacion y cambio de estado."],
        ["Tablas", "usuarios_comunidad, viviendas, chorros"],
        ["Validaciones", "Nombre de 3 a 200 caracteres; DPI de 13 a 20 digitos y unico; anio de inicio de cobro entre 2000 y 2100; cantidad de chorros mayor o igual a uno."],
        ["Manejo de errores", "409 ante DPI duplicado; 404 si el recurso no existe; 403 si el rol no es administrador."],
        ["Seguridad", "Todas las operaciones de escritura estan restringidas al rol administrador. La baja es logica: el campo 'activo' se establece en falso y se preserva el historial."],
    ],
    widths=[3.4, 12.6],
)
p(
    "El alta de un beneficiario se realiza mediante un asistente de tres pasos que "
    "encadena tres endpoints: creacion del beneficiario, creacion de su vivienda y "
    "registro de los chorros. En el tercer paso, el cliente calcula el precio de "
    "compra multiplicando la cantidad por la constante local 'PRECIO_CHORRO_UNITARIO'."
)
note(
    "Hallazgo: la constante 'PRECIO_CHORRO_UNITARIO = 1500' reside unicamente en "
    "'frontend/src/lib/navigation.ts'. El servidor valida solamente que "
    "'precioCompra' sea un numero mayor o igual a cero, por lo que una peticion "
    "construida manualmente podria registrar un precio distinto. La regla de "
    "negocio deberia trasladarse al servidor o a la tabla 'configuracion'."
)

h2("15.3 Modulo de facturacion")
table(
    ["Aspecto", "Detalle"],
    [
        ["Proposito", "Calcular la deuda, emitir los recibos y producir el comprobante en PDF."],
        ["Componentes", "facturacion.routes.ts, facturacion.service.ts, pdf.service.ts, emitir-factura-form.tsx"],
        ["Endpoints", "GET /pendientes/:viviendaId, GET /siguiente-recibo, POST /cobrar/tarifa-anual, POST /cobrar/compra-chorro, GET /recibos, GET /recibos/:id, GET /historial/:usuarioId"],
        ["Tablas", "recibos, pagos_anuales, pagos_compra_chorro, recibos_pdf, chorros, viviendas, configuracion"],
        ["Validaciones", "Identificadores en formato UUID; arreglo de anios con al menos un elemento, cada uno entre 2000 y 2100; verificacion de que cada anio figure como pendiente."],
        ["Manejo de errores", "400 si un anio no esta pendiente o si el chorro carece de precio; 409 si la compra ya fue cobrada; 404 si la vivienda o el chorro no existen."],
        ["Seguridad", "Todas las operaciones de cobro estan restringidas al rol tesorero. El importe se calcula integramente en el servidor; el cliente no lo envia."],
    ],
    widths=[3.4, 12.6],
)
p("El correlativo del recibo se obtiene consultando la mayor secuencia del anio en curso:")
code(
    """private async siguienteNumero(anio: number) {
  const ultimo = await this.recibos().findOne({
    where: { anioRecibo: anio },
    order: { secuencia: "DESC" },
  });
  const secuencia = (ultimo?.secuencia ?? 0) + 1;
  const numeroRecibo = String(secuencia).padStart(3, "0");
  return { secuencia, numeroRecibo, anioRecibo: anio };
}""",
    caption="Calculo del correlativo de recibos (facturacion.service.ts)",
)
p(
    "La emision se ejecuta dentro de una transaccion, de modo que el recibo, sus "
    "detalles de pago y el registro del PDF se persisten como una unidad indivisible:"
)
code(
    """return AppDataSource.transaction(async (manager) => {
  const recibo = manager.create(Recibo, { ... });
  const saved = await manager.save(recibo);

  for (const anio of dto.anios) {
    for (const chorro of chorrosActivos) {
      await manager.save(manager.create(PagoAnual, {
        reciboId: saved.id,
        chorroId: chorro.id,
        anio,
        montoPagado: (tarifa * chorro.cantidad).toFixed(2),
      }));
    }
  }

  const pdfBytes = await pdfService.generarRecibo({ ... });
  const pdfMeta = await this.subirPdf(saved, pdfBytes, manager);
  return { recibo: saved, pdf: pdfMeta };
});""",
    caption="Emision transaccional del recibo de tarifa anual",
)

h2("15.4 Modulo de generacion de documentos PDF")
p(
    "El servicio 'pdf.service.ts' construye una pagina tamano carta (612 x 792 "
    "puntos) posicionando los elementos por coordenadas absolutas. El documento "
    "incluye el encabezado del comite, los datos del beneficiario y de la vivienda, "
    "el tipo de cobro, la fecha, el lugar de pago, el nombre del tesorero, el "
    "detalle por anio, el total en cifras y en letras, y un espacio delimitado para "
    "la firma manuscrita."
)
p(
    "Una vez generado, el documento se carga al almacenamiento y se registra su "
    "metadato. El servicio devuelve ademas el contenido codificado en base64 para "
    "permitir la descarga inmediata sin depender de la disponibilidad de la URL "
    "firmada."
)
note(
    "Estado parcial verificado: el metodo 'intentarFirmar' aplica firma digital "
    "solo si la variable 'PDF_SIGN_P12_PATH' apunta a un certificado existente. En "
    "ausencia de certificado, o ante cualquier excepcion durante la firma, se "
    "retorna el documento sin firmar de forma silenciosa. En la configuracion de "
    "referencia, dicha variable esta vacia."
)

h2("15.5 Modulo de reportes e indicadores")
table(
    ["Aspecto", "Detalle"],
    [
        ["Proposito", "Proveer informacion agregada para la supervision administrativa."],
        ["Componentes", "reportes.routes.ts, reportes.service.ts, facturacion.service.ts (dashboard), admin-dashboard.tsx, reportes/page.tsx"],
        ["Tipos de reporte", "usuarios, viviendas, pagos e ingresos."],
        ["Indicadores del panel", "Total de beneficiarios, viviendas y chorros activos; recibos e ingresos del mes; serie de ingresos por mes del anio; tarifa vigente."],
        ["Exportacion", "GET /api/reportes/:tipo/pdf genera un documento tabular con paginacion automatica."],
        ["Seguridad", "El enrutador completo esta restringido al rol administrador."],
    ],
    widths=[3.6, 12.4],
)
note(
    "Hallazgo: el tipo de reporte se valida dentro del servicio mediante una "
    "sentencia 'switch' cuyo caso por omision lanza un 'Error' generico. Al no ser "
    "una instancia de 'AppError', el manejador global responde con codigo 500 en "
    "lugar del 400 que correspondera a una entrada invalida. La clase "
    "'TipoReporteDto' existe pero no se aplica en la ruta.",
    color=MUTED,
)

h2("15.6 Manejo de errores")
p(
    "El sistema define una jerarquia de errores tipados en 'utils/errors.ts'. Cada "
    "funcion auxiliar produce una instancia de 'AppError' con su codigo HTTP y un "
    "codigo simbolico."
)
table(
    ["Funcion", "Codigo HTTP", "Codigo simbolico", "Uso tipico"],
    [
        ["badRequest", "400", "(sin codigo)", "Datos invalidos o regla de negocio incumplida."],
        ["unauthorized", "401", "UNAUTHORIZED", "Token ausente, invalido o perfil inactivo."],
        ["forbidden", "403", "FORBIDDEN", "Rol insuficiente para la operacion."],
        ["notFound", "404", "NOT_FOUND", "Recurso inexistente."],
        ["conflict", "409", "CONFLICT", "Duplicidad de DPI o compra ya cobrada."],
    ],
    widths=[3.2, 2.4, 3.6, 6.8],
    caption="Errores tipados del sistema",
)
p(
    "El manejador global distingue entre errores controlados y no controlados. En "
    "entorno distinto de produccion expone el mensaje original para facilitar la "
    "depuracion; en produccion lo sustituye por un mensaje generico, evitando la "
    "divulgacion de detalles internos."
)

# ======================================================= 18. API / BACKEND ===
h1("16. INTERFAZ DE PROGRAMACION DE APLICACIONES")

h2("16.1 Informacion general")
table(
    ["Aspecto", "Valor"],
    [
        ["Protocolo", "HTTP/HTTPS"],
        ["Formato de intercambio", "JSON (application/json), excepto los reportes en PDF"],
        ["URL base en desarrollo", "http://localhost:4000"],
        ["Prefijos", "/api/auth, /api/usuarios, /api/facturacion, /api/reportes"],
        ["Autenticacion", "Cabecera 'Authorization: Bearer <token JWT de Supabase>'"],
        ["Limite del cuerpo", "2 MB"],
        ["Verificacion de estado", "GET /health"],
    ],
    widths=[4.6, 11.4],
)

h2("16.2 Endpoints de autenticacion")
table(
    ["Metodo", "Ruta", "Autenticacion", "Cuerpo de la peticion", "Respuesta", "Codigo"],
    [
        ["GET", "/api/auth/registro-opciones", "Publico", "-", "{ permitirAdministrador: boolean }", "200"],
        ["POST", "/api/auth/registro", "Publico", "{ nombre, dpi, password, rol }", "{ id, nombre, dpi, rol }", "201"],
        ["POST", "/api/auth/login", "Publico", "{ dpi, password }", "{ accessToken, refreshToken, expiresIn, usuario }", "200"],
        ["GET", "/api/auth/me", "Requerida", "-", "{ id, nombre, dpi, rol }", "200"],
        ["POST", "/api/auth/logout", "Requerida", "-", "{ ok: true }", "200"],
    ],
    widths=[1.8, 4.4, 2.2, 3.6, 3.4, 1.2],
    font_size=8,
    caption="Endpoints del modulo de autenticacion",
)

h2("16.3 Endpoints del padron")
table(
    ["Metodo", "Ruta", "Rol requerido", "Descripcion", "Codigo"],
    [
        ["GET", "/api/usuarios", "Autenticado", "Lista beneficiarios; admite el parametro de consulta 'q'.", "200"],
        ["GET", "/api/usuarios/dpi/:dpi", "Autenticado", "Busca un beneficiario por documento.", "200"],
        ["GET", "/api/usuarios/:id", "Autenticado", "Devuelve el detalle con viviendas y chorros.", "200"],
        ["POST", "/api/usuarios", "administrador", "Crea un beneficiario.", "201"],
        ["PATCH", "/api/usuarios/:id", "administrador", "Actualiza nombre, telefono o estado.", "200"],
        ["DELETE", "/api/usuarios/:id", "administrador", "Desactiva logicamente al beneficiario.", "200"],
        ["POST", "/api/usuarios/:id/activar", "administrador", "Reactiva al beneficiario.", "200"],
        ["POST", "/api/usuarios/:id/desactivar", "administrador", "Desactiva al beneficiario.", "200"],
        ["POST", "/api/usuarios/:id/viviendas", "administrador", "Registra una vivienda del beneficiario.", "201"],
        ["PATCH", "/api/usuarios/viviendas/:id", "administrador", "Actualiza una vivienda.", "200"],
        ["POST", "/api/usuarios/viviendas/:id/chorros", "administrador", "Registra chorros en una vivienda.", "201"],
        ["PATCH", "/api/usuarios/chorros/:id", "administrador", "Actualiza un chorro.", "200"],
    ],
    widths=[1.8, 5.2, 2.6, 5.2, 1.2],
    font_size=8,
    caption="Endpoints del modulo de padron",
)

h2("16.4 Endpoints de facturacion")
table(
    ["Metodo", "Ruta", "Rol requerido", "Descripcion", "Codigo"],
    [
        ["GET", "/api/facturacion/dashboard", "Autenticado", "Indicadores agregados de recaudacion.", "200"],
        ["GET", "/api/facturacion/config", "Autenticado", "Tarifa anual y lugar de pago vigentes.", "200"],
        ["PUT", "/api/facturacion/config/tarifa", "administrador", "Actualiza la tarifa anual.", "200"],
        ["GET", "/api/facturacion/siguiente-recibo", "tesorero", "Previsualiza el proximo correlativo.", "200"],
        ["GET", "/api/facturacion/pendientes/:viviendaId", "tesorero", "Anios adeudados y chorros por cobrar.", "200"],
        ["POST", "/api/facturacion/cobrar/tarifa-anual", "tesorero", "Emite el recibo de tarifa anual.", "201"],
        ["POST", "/api/facturacion/cobrar/compra-chorro", "tesorero", "Emite el recibo de compra de chorro.", "201"],
        ["GET", "/api/facturacion/recibos", "tesorero, administrador", "Lista recibos; admite 'q' y 'limit'.", "200"],
        ["GET", "/api/facturacion/recibos/:id", "Autenticado", "Detalle de un recibo con URL firmada del PDF.", "200"],
        ["GET", "/api/facturacion/historial/:usuarioId", "Autenticado", "Historial de recibos; admite 'anio'.", "200"],
    ],
    widths=[1.8, 6.0, 3.0, 4.0, 1.2],
    font_size=8,
    caption="Endpoints del modulo de facturacion",
)

h2("16.5 Endpoints de reportes")
table(
    ["Metodo", "Ruta", "Rol requerido", "Descripcion", "Codigo"],
    [
        ["GET", "/api/reportes/:tipo", "administrador", "Devuelve titulo, columnas y filas del reporte.", "200"],
        ["GET", "/api/reportes/:tipo/pdf", "administrador", "Devuelve el reporte como documento PDF.", "200"],
    ],
    widths=[1.8, 4.6, 2.8, 5.6, 1.2],
    font_size=8,
    caption="Endpoints del modulo de reportes",
)
p("Valores admitidos para el parametro 'tipo': 'usuarios', 'viviendas', 'pagos' e 'ingresos'.")

h2("16.6 Ejemplo de peticion y respuesta")
code(
    """POST /api/facturacion/cobrar/tarifa-anual HTTP/1.1
Host: localhost:4000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "viviendaId": "6f1c2e40-9b7a-4d31-8f0e-2c9a5b7d1e34",
  "anios": [2024, 2025],
  "fechaPago": "2026-08-20",
  "descripcionPago": "Pago tarifa anual 2024 a 2025 - 2 chorro(s)"
}

HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "recibo": {
      "numeroRecibo": "001",
      "anioRecibo": 2026,
      "totalPagado": "480.00",
      "cantidadEnLetras": "CUATROCIENTOS OCHENTA QUETZALES EXACTOS",
      "fechaPago": "2026-08-20"
    },
    "pdf": {
      "nombreArchivo": "recibo-2026-001.pdf",
      "urlPublica": "https://<proyecto>.supabase.co/storage/v1/object/sign/...",
      "downloadBase64": "JVBERi0xLjcK..."
    }
  }
}""",
    caption="Ejemplo de emision de recibo de tarifa anual",
)

h2("16.7 Codigos de estado utilizados")
table(
    ["Codigo", "Significado", "Situacion en el sistema"],
    [
        ["200", "OK", "Consulta o actualizacion satisfactoria."],
        ["201", "Created", "Creacion de perfil, beneficiario, vivienda, chorro o recibo."],
        ["400", "Bad Request", "Fallo de validacion del DTO o anio no pendiente."],
        ["401", "Unauthorized", "Token ausente, invalido, expirado o perfil inactivo."],
        ["403", "Forbidden", "Rol insuficiente o registro de administrador cerrado."],
        ["404", "Not Found", "Vivienda, chorro, beneficiario o recibo inexistente."],
        ["409", "Conflict", "DPI duplicado o compra de chorro ya cobrada."],
        ["500", "Internal Server Error", "Excepcion no controlada; incluye el tipo de reporte invalido."],
    ],
    widths=[2.0, 3.8, 10.2],
    caption="Codigos de estado HTTP empleados",
)

# ============================================ 19. AUTENTICACION Y SEGURIDAD ===
h1("17. AUTENTICACION Y SEGURIDAD")

h2("17.1 Modelo de autenticacion")
p(
    "El sistema delega integramente la gestion de credenciales en Supabase Auth. "
    "Esta decision implica que la base de datos de la aplicacion no almacena "
    "contrasenas ni sus resumenes criptograficos: la tabla 'perfiles' no contiene "
    "ninguna columna destinada a tal fin."
)
fig("08_auth.png", "Diagrama de secuencia — flujo de autenticacion")
code(
    """sequenceDiagram
  actor U as Usuario
  participant UI as Cliente Next.js
  participant API as API Express
  participant SB as Supabase Auth
  participant DB as PostgreSQL

  U->>UI: DPI + contrasena
  UI->>API: POST /api/auth/login
  API->>DB: SELECT perfil WHERE dpi = ? AND activo = true
  DB-->>API: Perfil
  API->>SB: signInWithPassword(dpi@sibana.aquapay.gt, contrasena)
  SB-->>API: access_token (JWT) + refresh_token
  API-->>UI: 200 { accessToken, usuario }
  UI->>UI: Almacena la sesion segun la opcion Recordarme

  Note over UI,API: En cada peticion posterior
  UI->>API: Authorization: Bearer <JWT>
  API->>SB: Obtiene el JWKS (clave publica)
  API->>API: jwtVerify(token, jwks, issuer, audience)
  API->>DB: Carga el perfil y verifica activo = true
  API-->>UI: Recurso solicitado""",
    caption="Codigo Mermaid del flujo de autenticacion",
)

h2("17.2 Medidas de seguridad implementadas")
table(
    ["Medida", "Implementacion verificada"],
    [
        [
            "Verificacion criptografica del token",
            "'jwtVerify' de la biblioteca 'jose' contra el JWKS remoto, validando "
            "emisor ('{SUPABASE_URL}/auth/v1') y audiencia ('authenticated').",
        ],
        [
            "Revalidacion del perfil en cada peticion",
            "El middleware consulta la tabla 'perfiles' y rechaza la peticion si el "
            "campo 'activo' es falso, incluso con un token valido.",
        ],
        [
            "Autorizacion por rol en el servidor",
            "'requireRoles' se aplica a nivel de ruta o de enrutador completo.",
        ],
        [
            "Saneamiento de la entrada",
            "'class-validator' con 'whitelist' y 'forbidNonWhitelisted', lo que "
            "rechaza propiedades no declaradas y previene la asignacion masiva.",
        ],
        [
            "Prevencion de inyeccion SQL",
            "Acceso exclusivo mediante los repositorios y el constructor de "
            "consultas de TypeORM, con parametros enlazados.",
        ],
        [
            "Cabeceras HTTP de proteccion",
            "'helmet()' aplicado de forma global.",
        ],
        [
            "Restriccion de origen",
            "'cors' configurado con el origen unico definido en 'FRONTEND_URL'.",
        ],
        [
            "Limitacion del tamano del cuerpo",
            "'express.json({ limit: \"2mb\" })'.",
        ],
        [
            "Gestion de secretos",
            "Variables de entorno cargadas con 'dotenv'; el modulo 'config/env.ts' "
            "interrumpe el arranque si falta una variable obligatoria; '.env' esta "
            "excluido del control de versiones.",
        ],
        [
            "Mensajes de error genericos en autenticacion",
            "El inicio de sesion responde 'DPI o contrasena incorrectos' sin "
            "distinguir cual de los dos es erroneo.",
        ],
        [
            "Enmascaramiento de errores en produccion",
            "El manejador global sustituye el detalle tecnico por un mensaje "
            "generico cuando 'NODE_ENV' es 'production'.",
        ],
        [
            "Acceso temporal a los comprobantes",
            "Las URL de los PDF son firmadas y expiran en una hora; el bucket es "
            "privado.",
        ],
        [
            "Integridad transaccional",
            "Los cobros se ejecutan dentro de transacciones de base de datos.",
        ],
    ],
    widths=[4.6, 11.4],
    caption="Medidas de seguridad verificadas en el codigo",
)

h2("17.3 Gestion de la sesion en el cliente")
p(
    "El token se conserva en el almacenamiento web del navegador. La opcion "
    "'Recordarme' determina el medio: 'localStorage' cuando esta activa y "
    "'sessionStorage' cuando no lo esta. Las claves empleadas son 'aquapay_token', "
    "'aquapay_user' y 'aquapay_remember'."
)

h2("17.4 Debilidades identificadas")
note(
    "Las siguientes observaciones corresponden a hallazgos verificados en el "
    "codigo. Se documentan por transparencia academica y se retoman como "
    "recomendaciones en el capitulo 26."
)
table(
    ["ID", "Debilidad", "Evidencia", "Riesgo"],
    [
        [
            "S-01",
            "El cierre de sesion no invalida el token.",
            "'auth.service.ts': el metodo 'logout' retorna '{ ok: true }' sin "
            "invocar a Supabase.",
            "Medio",
        ],
        [
            "S-02",
            "El token se almacena en el almacenamiento web.",
            "'auth-context.tsx' emplea 'localStorage' y 'sessionStorage'.",
            "Medio",
        ],
        [
            "S-03",
            "Ausencia de restriccion de unicidad en la compra de chorro.",
            "La tabla 'pagos_compra_chorro' carece de UNIQUE sobre 'chorro_id'.",
            "Medio",
        ],
        [
            "S-04",
            "Regla de precio del chorro solo en el cliente.",
            "'PRECIO_CHORRO_UNITARIO' reside en 'frontend/src/lib/navigation.ts'.",
            "Medio",
        ],
        [
            "S-05",
            "La funcion 'canAccessPath' permite las rutas no declaradas.",
            "'navigation.ts': retorna 'true' cuando no encuentra coincidencia.",
            "Bajo",
        ],
        [
            "S-06",
            "Autenticacion multifactor anunciada pero no implementada.",
            "Ausencia de endpoints y de uso de 'otplib'; el README afirma que es "
            "obligatoria.",
            "Alto (documental)",
        ],
        [
            "S-07",
            "Ausencia de limitacion de intentos de inicio de sesion.",
            "No se localizo ningun middleware de limitacion de tasa.",
            "Medio",
        ],
        [
            "S-08",
            "Ausencia de seguridad a nivel de fila en la base de datos.",
            "No se localizaron politicas RLS en el esquema.",
            "Bajo",
        ],
    ],
    widths=[1.2, 5.0, 7.0, 2.8],
    font_size=8,
    caption="Debilidades de seguridad identificadas",
)

h2("17.5 Variables de entorno")
table(
    ["Variable", "Ambito", "Obligatoria", "Valor por omision"],
    [
        ["DATABASE_URL", "Servidor", "Si", "-"],
        ["SUPABASE_URL", "Servidor", "Si", "-"],
        ["SUPABASE_SECRET_KEY", "Servidor", "Si", "-"],
        ["SUPABASE_JWKS_URL", "Servidor", "Si", "-"],
        ["PORT", "Servidor", "No", "4000"],
        ["NODE_ENV", "Servidor", "No", "development"],
        ["FRONTEND_URL", "Servidor", "No", "http://localhost:3000"],
        ["SUPABASE_STORAGE_BUCKET", "Servidor", "No", "recibos"],
        ["PDF_SIGN_P12_PATH", "Servidor", "No", "(vacio)"],
        ["PDF_SIGN_P12_PASSWORD", "Servidor", "No", "(vacio)"],
        ["NEXT_PUBLIC_API_URL", "Cliente", "No", "http://localhost:4000"],
        ["NEXT_PUBLIC_SUPABASE_URL", "Cliente", "Declarada", "-"],
        ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "Cliente", "Declarada", "-"],
    ],
    widths=[6.0, 2.6, 2.6, 4.8],
    caption="Variables de entorno del sistema",
)
note(
    "Advertencia de seguridad: el archivo 'backend/.env' con credenciales reales "
    "se encuentra presente en el directorio de trabajo. Aunque esta excluido por "
    "'.gitignore', debe verificarse que nunca se publique. Si las claves fueron "
    "compartidas en algun medio, deben rotarse en Supabase antes de la entrega."
)

# ============================================================ 20. PRUEBAS ===
h1("18. PRUEBAS")

h2("18.1 Entorno de pruebas")
table(
    ["Aspecto", "Valor"],
    [
        ["Entorno de pruebas", "Vitest 3.2.7 (declarado como ^3.0.5 en package.json)"],
        ["Comando de ejecucion", "npm test (equivale a 'vitest run') en el directorio 'backend'"],
        ["Archivos de prueba en el servidor", "1 (src/utils/numero-a-letras.test.ts)"],
        ["Archivos de prueba en el cliente", "0"],
        ["Cobertura configurada", "No configurada"],
    ],
    widths=[6.0, 10.0],
)

h2("18.2 Pruebas unitarias existentes")
p(
    "Se ejecuto la suite de pruebas durante la elaboracion de este documento. El "
    "resultado registrado es el siguiente:"
)
code(
    """> aquapay-backend@1.0.0 test
> vitest run

 RUN  v3.2.7 C:/Users/Usuario/Desktop/aquapay/backend

 v src/utils/numero-a-letras.test.ts (1 test) 15ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Duration  7.06s""",
    caption="Salida real de la ejecucion de la suite de pruebas",
)
table(
    ["ID", "Caso de prueba", "Entrada", "Resultado esperado", "Resultado obtenido", "Estado"],
    [
        [
            "CP-01",
            "Conversion de un monto unitario a letras",
            "numeroALetras(1)",
            "La cadena contiene 'un quetzal'",
            "La cadena contiene 'un quetzal'",
            "Aprobado",
        ],
        [
            "CP-02",
            "Conversion de un monto de tres cifras a letras",
            "numeroALetras(120)",
            "La cadena contiene 'ciento veinte quetzales'",
            "La cadena contiene 'ciento veinte quetzales'",
            "Aprobado",
        ],
    ],
    widths=[1.2, 4.0, 2.6, 3.4, 3.4, 1.4],
    font_size=8,
    caption="Resultados de las pruebas unitarias automatizadas ejecutadas",
)
p(
    "Nota: ambas aserciones pertenecen a un unico caso de prueba de Vitest "
    "('convierte montos simples'), razon por la cual la herramienta reporta un solo "
    "test aprobado.",
    italic=True,
)

h2("18.3 Verificaciones automatizadas de integracion continua")
p(
    "Aunque no constituyen pruebas funcionales, el flujo de integracion continua "
    "ejecuta verificaciones automaticas en cada cambio:"
)
table(
    ["Tarea", "Verificacion", "Comando"],
    [
        ["frontend", "Analisis estatico de codigo", "npm run lint"],
        ["frontend", "Compilacion de produccion", "npm run build"],
        ["backend", "Verificacion de tipos sin emision", "npx tsc --noEmit"],
    ],
    widths=[3.0, 7.0, 6.0],
    caption="Verificaciones del flujo de integracion continua",
)
note(
    "Observacion: el flujo de integracion continua NO ejecuta 'npm test'. La unica "
    "prueba unitaria existente no se valida automaticamente en cada cambio.",
    color=MUTED,
)

h2("18.4 Estado de la cobertura de pruebas")
note(
    "[COBERTURA DE PRUEBAS AUTOMATIZADAS INSUFICIENTE] Se localizo un unico archivo "
    "de prueba, correspondiente a una funcion utilitaria. NO existen pruebas "
    "automatizadas para: los servicios de negocio (calculo de anios pendientes, "
    "correlativo de recibos, cobros), los middlewares de autenticacion y "
    "autorizacion, los endpoints de la API, los DTO ni ningun componente del "
    "cliente."
)

h2("18.5 Casos de prueba propuestos")
p(
    "Los siguientes casos se proponen para alcanzar una cobertura defendible ante "
    "el tribunal. Las columnas de resultado obtenido y estado se dejan sin llenar "
    "deliberadamente: deben completarse tras su ejecucion real."
)
table(
    ["ID", "Caso de prueba", "Entrada", "Resultado esperado", "Resultado obtenido", "Estado"],
    [
        ["CP-03", "Inicio de sesion con credenciales validas", "DPI registrado y contrasena correcta", "Codigo 200 y token de acceso", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-04", "Inicio de sesion con contrasena incorrecta", "DPI registrado y contrasena erronea", "Codigo 401 y mensaje generico", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-05", "Inicio de sesion con perfil desactivado", "DPI de un perfil con activo = falso", "Codigo 401", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-06", "Registro con DPI duplicado", "DPI ya existente en 'perfiles'", "Codigo 409", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-07", "Registro de administrador con administrador existente", "rol = administrador", "Codigo 403", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-08", "Acceso del tesorero al padron", "GET /api/usuarios con token de tesorero sobre POST", "Codigo 403 en operaciones de escritura", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-09", "Acceso del administrador al cobro", "POST /cobrar/tarifa-anual con token de administrador", "Codigo 403", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-10", "Peticion sin token", "Cualquier ruta protegida", "Codigo 401", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-11", "Calculo de anios pendientes", "Vivienda con anio de inicio 2023 y sin pagos", "Se devuelven 2023, 2024, 2025 y 2026", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-12", "Calculo del total de tarifa anual", "Tarifa 120, dos chorros y dos anios", "Total igual a 480.00", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-13", "Cobro de un anio ya pagado", "Anio no incluido en los pendientes", "Codigo 400", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-14", "Doble cobro de compra de chorro", "Chorro con pago de compra existente", "Codigo 409", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-15", "Correlativo de recibos", "Emision de tres recibos consecutivos", "Numeros 001, 002 y 003", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-16", "Reinicio anual del correlativo", "Primer recibo de un nuevo anio", "Numero 001 con anio actualizado", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-17", "Validacion de DPI invalido", "DPI de 10 digitos", "Codigo 400", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-18", "Rechazo de propiedades no declaradas", "Cuerpo con una propiedad adicional", "Codigo 400", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-19", "Generacion del comprobante en PDF", "Cobro satisfactorio", "Se crea el registro en 'recibos_pdf' y el archivo en el bucket", "[POR EJECUTAR]", "[POR DEFINIR]"],
        ["CP-20", "Atomicidad del cobro", "Fallo inducido durante la transaccion", "No se persiste ningun registro parcial", "[POR EJECUTAR]", "[POR DEFINIR]"],
    ],
    widths=[1.2, 4.2, 3.4, 4.0, 2.0, 1.2],
    font_size=7.5,
    caption="Casos de prueba propuestos pendientes de ejecucion",
)

# ========================================================== 21. DESPLIEGUE ===
h1("19. DESPLIEGUE")

h2("19.1 Arquitectura de despliegue")
p(
    "Los componentes de AquaPay se distribuyen en tres plataformas en la nube. "
    "El siguiente diagrama resume la vista de despliegue."
)
fig("06_despliegue.png", "Diagrama de despliegue de AquaPay")
fig("07_contexto.png", "Diagrama de contexto del sistema")
table(
    ["Componente", "Plataforma", "Configuracion"],
    [
        ["Cliente", "Vercel", "Directorio raiz 'frontend'; compilacion con 'next build'."],
        ["Servidor", "Render", "Directorio raiz 'backend'; compilacion 'npm run build'; arranque 'npm start'."],
        ["Base de datos", "Supabase", "PostgreSQL gestionado; conexion por cadena URI con SSL."],
        ["Autenticacion", "Supabase Auth", "Proveedor de correo electronico habilitado."],
        ["Almacenamiento", "Supabase Storage", "Bucket privado denominado 'recibos'."],
    ],
    widths=[3.0, 3.4, 9.6],
    caption="Distribucion de los componentes en produccion",
)

h2("19.2 Requisitos previos")
bullet("Node.js version 22 o superior, conforme a la version utilizada en integracion continua.")
bullet("Gestor de paquetes npm.")
bullet("Cuenta activa en Supabase con un proyecto creado.")
bullet("Cuentas en Vercel y Render para el despliegue en produccion.")

h2("19.3 Procedimiento de despliegue")
h3("19.3.1 Preparacion de Supabase")
numbered("Crear un proyecto en Supabase y anotar su URL.")
numbered("Abrir el editor SQL y ejecutar el contenido de 'backend/src/database/schema.sql'.")
numbered("Ejecutar de forma secuencial las cuatro migraciones del directorio 'backend/src/database/migrations'.")
numbered("Habilitar el proveedor de autenticacion por correo electronico en la seccion Auth.")
numbered("Crear un bucket privado denominado 'recibos' en la seccion Storage.")
numbered("Obtener la cadena de conexion de la base de datos, la clave secreta de servicio y la URL del JWKS.")

h3("19.3.2 Despliegue del servidor")
code(
    """cd backend
cp .env.example .env        # completar con los valores reales del proyecto
npm install
npm run build               # compila TypeScript al directorio dist/
npm start                   # ejecuta node dist/server.js""",
    caption="Compilacion y ejecucion del servidor",
)
p("En Render debe configurarse: directorio raiz 'backend', comando de compilacion 'npm run build', comando de arranque 'npm start' y las variables de entorno obligatorias del capitulo 17.5.")

h3("19.3.3 Despliegue del cliente")
code(
    """cd frontend
cp .env.example .env.local  # definir NEXT_PUBLIC_API_URL con la URL publica del servidor
npm install
npm run build
npm start""",
    caption="Compilacion y ejecucion del cliente",
)
p("En Vercel debe configurarse el directorio raiz 'frontend' y la variable 'NEXT_PUBLIC_API_URL' apuntando a la URL publica del servidor desplegado en Render.")

h3("19.3.4 Verificacion posterior al despliegue")
numbered("Consultar 'GET /health' del servidor y confirmar la respuesta '{ ok: true, service: \"aquapay-api\" }'.")
numbered("Acceder a la ruta '/registro' del cliente y crear la cuenta del primer administrador.")
numbered("Iniciar sesion y verificar que la barra lateral muestre los modulos correspondientes al rol.")
numbered("Registrar un beneficiario de prueba con vivienda y chorro.")
numbered("Iniciar sesion con una cuenta de tesorero y emitir un recibo de prueba, confirmando la descarga del PDF.")

note(
    "Advertencia operativa: la variable 'FRONTEND_URL' del servidor debe coincidir "
    "exactamente con el dominio publico del cliente. Un valor incorrecto provoca "
    "que la politica de intercambio de recursos de origen cruzado bloquee todas las "
    "peticiones."
)

# ====================================================== 22. MANUAL TECNICO ===
h1("20. MANUAL TECNICO")

h2("20.1 Requisitos del entorno de desarrollo")
table(
    ["Requisito", "Version", "Observacion"],
    [
        ["Node.js", "22 o superior", "Version empleada en integracion continua."],
        ["npm", "Incluido con Node.js", "Gestor de paquetes utilizado."],
        ["Editor", "Visual Studio Code (sugerido)", "El repositorio incluye '.vscode/settings.json'."],
        ["Acceso a Supabase", "Proyecto activo", "Requerido incluso en desarrollo local."],
    ],
    widths=[4.0, 4.0, 8.0],
)

h2("20.2 Instalacion")
code(
    """# 1. Situarse en la carpeta del proyecto
cd aquapay

# 2. Instalar las dependencias del servidor
cd backend
npm install

# 3. Instalar las dependencias del cliente
cd ../frontend
npm install""",
    caption="Instalacion de dependencias",
)

h2("20.3 Configuracion de variables de entorno")
code(
    """# backend/.env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:<contrasena>@db.<proyecto>.supabase.co:5432/postgres
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_SECRET_KEY=<clave secreta de servicio>
SUPABASE_JWKS_URL=https://<proyecto>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_STORAGE_BUCKET=recibos
PDF_SIGN_P12_PATH=
PDF_SIGN_P12_PASSWORD=

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000""",
    caption="Plantilla de variables de entorno para desarrollo",
)

h2("20.4 Preparacion de la base de datos")
numbered("Ejecutar 'backend/src/database/schema.sql' en el editor SQL de Supabase.")
numbered("Ejecutar en orden las migraciones 001, 002, 003 y 004 del directorio de migraciones.")
numbered("Verificar la existencia de las nueve tablas y de los dos registros iniciales de la tabla 'configuracion'.")
note(
    "Hallazgo: el archivo 'package.json' del servidor declara el script "
    "'migration:run' apuntando a 'src/database/run-migrations.ts', archivo que NO "
    "existe en el repositorio. Las migraciones deben aplicarse manualmente. Se "
    "recomienda implementar dicho ejecutor o retirar el script."
)

h2("20.5 Ejecucion en entorno local")
code(
    """# Terminal 1 - Servidor (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 - Cliente (http://localhost:3000)
cd frontend
npm run dev""",
    caption="Ejecucion simultanea de ambos proyectos",
)
p("El servidor confirma su arranque con los mensajes 'Base de datos conectada' y 'AquaPay API en http://localhost:4000'.")

h2("20.6 Ejecucion de las pruebas")
code(
    """cd backend
npm test        # ejecuta vitest run""",
    caption="Ejecucion de la suite de pruebas",
)

h2("20.7 Compilacion para produccion")
table(
    ["Proyecto", "Comando", "Resultado"],
    [
        ["backend", "npm run build", "Compilacion de TypeScript al directorio 'dist/'."],
        ["backend", "npm start", "Ejecucion de 'node dist/server.js'."],
        ["frontend", "npm run build", "Compilacion optimizada de Next.js con Turbopack."],
        ["frontend", "npm start", "Servidor de produccion de Next.js."],
    ],
    widths=[3.0, 4.0, 9.0],
)

h2("20.8 Solucion de problemas frecuentes")
table(
    ["Sintoma", "Causa probable", "Solucion"],
    [
        [
            "El servidor no arranca y muestra 'Variable de entorno faltante'",
            "Falta una de las cuatro variables obligatorias.",
            "Completar 'DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SECRET_KEY' y "
            "'SUPABASE_JWKS_URL' en 'backend/.env'.",
        ],
        [
            "El navegador reporta un error de politica de origen cruzado",
            "'FRONTEND_URL' no coincide con el origen del cliente.",
            "Igualar el valor de 'FRONTEND_URL' al dominio exacto del cliente y "
            "reiniciar el servidor.",
        ],
        [
            "Todas las peticiones responden 401",
            "Token expirado, 'SUPABASE_JWKS_URL' incorrecta o perfil desactivado.",
            "Volver a iniciar sesion; verificar la URL del JWKS; comprobar el campo "
            "'activo' del perfil.",
        ],
        [
            "El recibo se genera pero el PDF no se descarga",
            "El bucket 'recibos' no existe o la clave de servicio carece de "
            "permisos.",
            "Crear el bucket privado 'recibos'; el sistema conserva el recibo y "
            "entrega el PDF en base64 aunque falle la carga.",
        ],
        [
            "El cobro responde 400 indicando que el anio no esta pendiente",
            "El periodo ya fue cancelado previamente.",
            "Consultar 'GET /api/facturacion/pendientes/:viviendaId' para verificar "
            "los anios realmente adeudados.",
        ],
        [
            "El registro de chorro falla con codigo 500",
            "El esquema conserva la columna 'cuota_mensual' con restriccion NOT "
            "NULL.",
            "Aplicar la migracion '004_drop_chorros_cuota_mensual.sql'.",
        ],
        [
            "El tesorero no visualiza el modulo de beneficiarios",
            "Comportamiento esperado por diseno.",
            "El rol tesorero solo accede al panel de indicadores y al modulo de "
            "facturas.",
        ],
    ],
    widths=[4.4, 4.4, 7.2],
    font_size=8,
    caption="Guia de solucion de problemas frecuentes",
)

# ==================================================== 23. MANUAL DE USUARIO ===
h1("21. MANUAL DE USUARIO")

h2("21.1 Acceso al sistema")
p(
    "El sistema se utiliza desde cualquier navegador web moderno. No requiere "
    "instalacion en el equipo del usuario."
)
placeholder("CAPTURA DE PANTALLA: pantalla de inicio de sesion, con los campos DPI y contrasena")

h2("21.2 Creacion de la primera cuenta")
numbered("Ingresar a la direccion del sistema y seleccionar el enlace 'Crear cuenta'.")
numbered("Completar el nombre completo, el DPI de trece digitos y una contrasena de al menos ocho caracteres.")
numbered("Seleccionar el rol. La opcion 'Administrador' unicamente aparece si el sistema aun no posee un administrador registrado.")
numbered("Aceptar los terminos de uso y presionar 'Registrarse'.")
placeholder("CAPTURA DE PANTALLA: formulario de registro con el selector de rol y el indicador de fuerza de la contrasena")
note(
    "El sistema exige que la contrasena alcance un nivel de seguridad medio o "
    "superior. Se recomienda combinar mayusculas, minusculas, digitos y simbolos.",
    color=MUTED,
)

h2("21.3 Inicio de sesion")
numbered("Ingresar el DPI. El campo acepta unicamente digitos y los agrupa automaticamente para facilitar la lectura.")
numbered("Ingresar la contrasena. El icono del ojo permite mostrarla u ocultarla.")
numbered("Activar 'Recordarme' para mantener la sesion tras cerrar el navegador.")
numbered("Presionar 'Iniciar sesion'.")

h2("21.4 Navegacion segun el rol")
p(
    "La interfaz se adapta automaticamente al rol de la cuenta. El administrador "
    "visualiza una barra lateral y el tesorero una barra superior."
)
table(
    ["Rol", "Modulos visibles"],
    [
        ["Administrador", "Dashboard, Beneficiarios, Pagos, Reportes y Configuracion."],
        ["Tesorero", "Dashboard y Facturas."],
    ],
    widths=[4.0, 12.0],
)
placeholder("CAPTURA DE PANTALLA: panel del administrador con la barra lateral y los indicadores")
placeholder("CAPTURA DE PANTALLA: panel del tesorero con la barra superior")

h2("21.5 Guia del administrador")

h3("21.5.1 Registrar un beneficiario")
numbered("Ingresar al modulo 'Beneficiarios' y presionar 'Nuevo beneficiario'.")
numbered("Paso 1: registrar el nombre completo, el DPI y, opcionalmente, el telefono.")
numbered("Paso 2: registrar la direccion de la vivienda y el anio a partir del cual se genera el cobro.")
numbered("Paso 3: indicar la cantidad de chorros y la fecha de instalacion. El sistema calcula el precio de compra.")
numbered("Confirmar para finalizar el registro.")
placeholder("CAPTURA DE PANTALLA: asistente de tres pasos para el registro de beneficiarios")
note(
    "El campo 'anio de inicio de cobro' es determinante: a partir de el, el sistema "
    "genera la deuda anual. Un valor incorrecto produce una deuda erronea.",
    color=MUTED,
)

h3("21.5.2 Consultar y desactivar beneficiarios")
numbered("Utilizar el campo de busqueda para localizar por nombre o por DPI.")
numbered("Seleccionar el nombre para ver el detalle con sus viviendas y chorros.")
numbered("Utilizar el conmutador de estado para activar o desactivar al beneficiario.")
p("La desactivacion es logica: el beneficiario deja de aparecer como disponible para cobro, pero se conserva todo su historial.")
placeholder("CAPTURA DE PANTALLA: listado de beneficiarios con el conmutador de estado")

h3("21.5.3 Actualizar la tarifa anual")
numbered("Ingresar al modulo 'Configuracion'.")
numbered("Modificar el valor de la tarifa anual por chorro.")
numbered("Guardar los cambios.")
p("La nueva tarifa se aplica a los cobros posteriores. Los recibos ya emitidos conservan el importe con el que fueron generados.")
placeholder("CAPTURA DE PANTALLA: pantalla de configuracion de la tarifa anual")

h3("21.5.4 Consultar pagos y generar reportes")
numbered("En el modulo 'Pagos', ingresar el DPI del beneficiario y el anio para consultar su historial.")
numbered("En el modulo 'Reportes', seleccionar el tipo de reporte: ingresos, pagos, usuarios o viviendas.")
numbered("Utilizar el boton de exportacion para descargar el reporte en formato PDF.")
placeholder("CAPTURA DE PANTALLA: modulo de reportes con la tabla y el grafico de ingresos")

h2("21.6 Guia del tesorero")

h3("21.6.1 Emitir una factura")
numbered("Ingresar al modulo 'Facturas'.")
numbered("Buscar al beneficiario por nombre o por DPI y seleccionarlo de la lista.")
numbered("Verificar que el sistema complete automaticamente el nombre, el DPI, la direccion y la cantidad de chorros.")
numbered("Seleccionar el tipo de pago: 'Pagar mensualidad / anual' o 'Pagar compra de chorro'.")
numbered("Para la tarifa anual, escribir el anio hasta el cual se cancela. El sistema cobra desde el anio mas antiguo adeudado hasta el indicado.")
numbered("Seleccionar la fecha del pago.")
numbered("Verificar el total calculado y su expresion en letras.")
numbered("Presionar 'Generar factura'. El comprobante en PDF se descarga automaticamente.")
placeholder("CAPTURA DE PANTALLA: formulario de emision de factura con los campos autocompletados")
placeholder("CAPTURA DE PANTALLA: recibo generado en formato PDF")

h3("21.6.2 Consideraciones importantes para el tesorero")
bullet("El numero de recibo se asigna automaticamente y no puede modificarse.")
bullet("El total se calcula en el servidor y no admite edicion manual.")
bullet("Si el beneficiario no presenta deuda, el sistema lo indica y no permite emitir el recibo.")
bullet("Un anio ya cancelado no puede volver a cobrarse; el sistema lo rechaza.")
bullet("La compra de un chorro se cobra una unica vez por chorro.")
bullet("El recibo impreso requiere la firma manuscrita del tesorero en el espacio destinado para ello.")

h2("21.7 Conmutacion del tema visual")
p(
    "Todas las pantallas incluyen un control que permite alternar entre el tema "
    "claro y el oscuro. La preferencia se conserva en el navegador del usuario."
)

h2("21.8 Cierre de sesion")
p(
    "El boton 'Cerrar sesion' se ubica en la parte inferior de la barra lateral en "
    "el caso del administrador, y en la barra superior en el caso del tesorero."
)
note(
    "Recomendacion de seguridad: dado que el cierre de sesion no invalida el token "
    "en el servidor, se recomienda no utilizar la opcion 'Recordarme' en equipos "
    "compartidos."
)

# ========================================================== 24. RESULTADOS ===
h1("22. RESULTADOS")

h2("22.1 Resultados por objetivo especifico")
table(
    ["Objetivo especifico", "Resultado obtenido", "Estado"],
    [
        [
            "1. Autenticacion por DPI y control de acceso por rol",
            "Se implementaron cinco endpoints de autenticacion, verificacion de JWT "
            "contra el JWKS de Supabase y autorizacion por rol en dos capas "
            "(servidor e interfaz).",
            "Alcanzado",
        ],
        [
            "2. Gestion del padron de beneficiarios",
            "Se implementaron doce endpoints que cubren el ciclo completo de "
            "beneficiarios, viviendas y chorros, con baja logica.",
            "Alcanzado",
        ],
        [
            "3. Calculo automatico de anios pendientes",
            "El metodo 'aniosPendientes' determina la deuda considerando el anio de "
            "inicio de cobro, los chorros activos y los pagos previos.",
            "Alcanzado",
        ],
        [
            "4. Emision de recibos por ambos conceptos",
            "Se implementaron los dos flujos de cobro dentro de transacciones, con "
            "calculo del total en el servidor y conversion del importe a letras.",
            "Alcanzado",
        ],
        [
            "5. Generacion y almacenamiento del comprobante",
            "Cada cobro produce un PDF que se almacena en Supabase Storage, se "
            "registra en 'recibos_pdf' y se entrega mediante URL firmada y base64.",
            "Alcanzado",
        ],
        [
            "6. Panel de indicadores y reportes",
            "Se implemento el panel con seis indicadores y grafico mensual, y cuatro "
            "tipos de reporte con exportacion a PDF.",
            "Alcanzado",
        ],
        [
            "7. Integridad de los datos",
            "Se declararon restricciones de unicidad, verificacion y llaves foraneas, "
            "y validacion mediante DTO. No obstante, la unicidad de la compra de "
            "chorro se controla solo en la aplicacion.",
            "Alcanzado parcialmente",
        ],
    ],
    widths=[4.6, 8.8, 2.6],
    caption="Cumplimiento de los objetivos especificos",
)

h2("22.2 Resultados cuantitativos del producto")
table(
    ["Metrica", "Valor verificado"],
    [
        ["Tablas del modelo de datos", "9"],
        ["Entidades TypeORM", "9"],
        ["Migraciones SQL", "4"],
        ["Indices declarados", "7"],
        ["Endpoints de la API", "29 (mas el punto de verificacion de estado)"],
        ["Objetos de transferencia de datos", "11"],
        ["Servicios de negocio", "6"],
        ["Rutas de la interfaz de usuario", "14 (dos de ellas de redireccion)"],
        ["Archivos fuente del servidor", "41"],
        ["Archivos fuente del cliente", "56"],
        ["Roles del sistema", "2"],
        ["Pruebas unitarias automatizadas", "1 archivo, 1 caso, 2 aserciones"],
    ],
    widths=[6.4, 9.6],
    caption="Metricas del producto de software",
)

h2("22.3 Resultados no medidos")
missing(
    "No se localizo evidencia de pruebas con usuarios reales, medicion de tiempos "
    "de atencion, encuestas de satisfaccion, datos de recaudacion antes y despues "
    "de la implantacion, ni bitacora de uso en produccion. Si el tribunal exige "
    "resultados de impacto, estos deben obtenerse mediante trabajo de campo con el "
    "Comite de Agua Potable de Aldea Sibana."
)

# ========================================================= 25. CONCLUSIONES ===
h1("23. CONCLUSIONES")

p(
    "1. Se desarrollo un sistema de informacion web funcional que automatiza el "
    "registro de beneficiarios y el cobro del servicio de agua potable de Aldea "
    "Sibana, cumpliendo el objetivo general planteado. El sistema comprende un "
    "cliente web, una interfaz de programacion de aplicaciones con veintinueve "
    "endpoints y un modelo de datos relacional de nueve tablas."
)
p(
    "2. La automatizacion del calculo de la deuda constituye el aporte central del "
    "sistema. El algoritmo implementado determina los anios pendientes de una "
    "vivienda considerando simultaneamente su anio de inicio de cobro, la totalidad "
    "de sus chorros activos y los pagos previamente registrados, eliminando el "
    "calculo manual que constituia la principal fuente de error."
)
p(
    "3. La integridad de la informacion economica se garantiza mediante mecanismos "
    "de base de datos y no unicamente por logica de aplicacion. Las restricciones "
    "'UNIQUE (chorro_id, anio)' sobre la tabla de pagos anuales y "
    "'UNIQUE (anio_recibo, secuencia)' sobre la tabla de recibos impiden, "
    "respectivamente, el doble cobro de un periodo y la duplicidad del correlativo. "
    "El uso de transacciones asegura que un recibo nunca quede registrado sin sus "
    "detalles de pago."
)
p(
    "4. La segregacion de funciones entre el administrador y el tesorero se "
    "implemento de forma efectiva en dos capas. El control determinante reside en "
    "el servidor, mediante el middleware de autorizacion, mientras que la capa de "
    "interfaz cumple una funcion complementaria de experiencia de usuario. Esta "
    "separacion reproduce en el sistema el principio contable de que quien "
    "administra el padron no debe ser quien recibe el dinero."
)
p(
    "5. La delegacion de la gestion de credenciales en Supabase Auth permitio que "
    "la base de datos del sistema no almacene contrasenas ni sus resumenes "
    "criptograficos, reduciendo la superficie de riesgo. La verificacion de los "
    "tokens se realiza criptograficamente contra un conjunto de claves publicas "
    "remoto, validando emisor y audiencia en cada peticion."
)
p(
    "6. El sistema alcanzo un estado funcional completo respecto de su flujo "
    "principal de negocio, si bien persisten componentes parcialmente "
    "implementados. Especificamente, la autenticacion multifactor quedo reservada a "
    "nivel de esquema sin implementacion funcional, el cierre de sesion no invalida "
    "el token en el proveedor de identidad y la firma digital del comprobante "
    "depende de un certificado no provisto. Estas limitaciones se documentan de "
    "forma explicita y se traducen en las recomendaciones del capitulo siguiente."
)
p(
    "7. La cobertura de pruebas automatizadas resulta insuficiente para un sistema "
    "que administra informacion economica. Se verifico la existencia de un unico "
    "caso de prueba, correspondiente a una funcion utilitaria de conversion de "
    "montos a letras, el cual se ejecuto satisfactoriamente. Las reglas criticas "
    "del negocio carecen de verificacion automatizada, lo que constituye la "
    "principal deuda tecnica del proyecto."
)

# ======================================================= 26. RECOMENDACIONES ===
h1("24. RECOMENDACIONES")

h2("24.1 Recomendaciones criticas previas a la puesta en produccion")
table(
    ["ID", "Recomendacion", "Justificacion"],
    [
        [
            "R-01",
            "Inicializar el repositorio de control de versiones y publicarlo en un "
            "servicio remoto.",
            "El directorio no contiene un repositorio Git, pese a existir "
            "configuracion de integracion continua que lo presupone.",
        ],
        [
            "R-02",
            "Agregar la restriccion 'UNIQUE (chorro_id)' a la tabla "
            "'pagos_compra_chorro'.",
            "Elimina la condicion de carrera que permitiria cobrar dos veces la "
            "compra de un mismo chorro.",
        ],
        [
            "R-03",
            "Trasladar el precio unitario del chorro al servidor o a la tabla "
            "'configuracion'.",
            "La regla reside unicamente en el cliente, por lo que puede eludirse "
            "mediante una peticion directa a la API.",
        ],
        [
            "R-04",
            "Implementar la invalidacion del token en el cierre de sesion.",
            "El metodo actual no revoca la sesion en el proveedor de identidad.",
        ],
        [
            "R-05",
            "Actualizar el archivo README.md.",
            "Afirma que la autenticacion multifactor es obligatoria y que el "
            "registro es abierto; ninguna de las dos afirmaciones corresponde al "
            "estado actual del codigo.",
        ],
        [
            "R-06",
            "Rotar las credenciales de Supabase antes de la entrega.",
            "El archivo '.env' con valores reales se encuentra en el directorio de "
            "trabajo.",
        ],
    ],
    widths=[1.2, 6.4, 8.4],
    caption="Recomendaciones criticas",
)

h2("24.2 Recomendaciones de calidad y mantenibilidad")
bullet(
    "Implementar pruebas automatizadas para los servicios de facturacion, "
    "priorizando el calculo de anios pendientes, la generacion del correlativo y la "
    "atomicidad de las transacciones."
)
bullet(
    "Incorporar la ejecucion de 'npm test' al flujo de integracion continua, que "
    "actualmente solo verifica el analisis estatico, la compilacion y los tipos."
)
bullet(
    "Aplicar la clase 'TipoReporteDto' en las rutas de reportes para que un tipo "
    "invalido responda con codigo 400 en lugar de 500."
)
bullet(
    "Modificar la funcion 'canAccessPath' para que deniegue por omision las rutas "
    "no declaradas, adoptando un modelo de lista de inclusion."
)
bullet(
    "Implementar el ejecutor de migraciones referenciado por el script "
    "'migration:run', o bien retirarlo del archivo 'package.json'."
)
bullet(
    "Retirar las dependencias no utilizadas: 'bcryptjs', 'otplib', 'qrcode' y "
    "'uuid' en el servidor, y '@supabase/supabase-js' en el cliente si no se "
    "prevee su uso."
)
bullet(
    "Eliminar el componente 'usuarios-repo-list.tsx', que no es referenciado desde "
    "ningun punto del proyecto."
)

h2("24.3 Recomendaciones de seguridad")
bullet(
    "Implementar la autenticacion multifactor mediante contrasenas de un solo uso "
    "basadas en tiempo, aprovechando las columnas ya existentes en la tabla "
    "'perfiles' y la dependencia 'otplib' ya declarada."
)
bullet(
    "Incorporar limitacion de tasa en los endpoints de autenticacion para mitigar "
    "ataques de fuerza bruta."
)
bullet(
    "Evaluar la migracion del token desde el almacenamiento web hacia una cookie "
    "con los atributos HttpOnly, Secure y SameSite."
)
bullet(
    "Implementar una bitacora de auditoria que registre quien emitio, modifico o "
    "consulto cada recibo."
)
bullet(
    "Habilitar politicas de seguridad a nivel de fila en Supabase como medida de "
    "defensa en profundidad."
)

h2("24.4 Mejoras funcionales propuestas")
p(
    "Las siguientes propuestas constituyen trabajo futuro y no forman parte del "
    "alcance implementado."
)
bullet("Anulacion de recibos con justificacion y trazabilidad, incluyendo el estado correspondiente en la tabla 'recibos'.")
bullet("Consulta de estado de cuenta para el beneficiario mediante su DPI, sin necesidad de credenciales.")
bullet("Notificacion de morosidad por mensajeria o correo electronico.")
bullet("Reportes comparativos entre periodos y proyeccion de ingresos.")
bullet("Modo de operacion sin conexion con sincronizacion diferida, considerando la conectividad limitada del entorno rural.")
bullet("Respaldo automatico programado de la base de datos.")
bullet("Adopcion de la firma digital del comprobante mediante la incorporacion del certificado P12 previsto.")

# ========================================================= 27. BIBLIOGRAFIA ===
h1("25. BIBLIOGRAFIA")
missing(
    "El repositorio no contiene referencias bibliograficas, citas ni un archivo de "
    "fuentes consultadas. La bibliografia debe elaborarse en su totalidad conforme "
    "a las normas APA en su septima edicion."
)
p(
    "Se propone la siguiente estructura minima de fuentes, congruente con las "
    "tecnologias y conceptos efectivamente utilizados en el proyecto. Las entradas "
    "deben completarse con la fecha de consulta y verificarse antes de la entrega."
)

h2("25.1 Documentacion tecnica oficial sugerida")
bullet("Vercel Inc. (s. f.). Next.js Documentation: App Router. https://nextjs.org/docs")
bullet("Meta Open Source. (s. f.). React Documentation. https://react.dev")
bullet("OpenJS Foundation. (s. f.). Express 4.x API Reference. https://expressjs.com")
bullet("TypeORM. (s. f.). TypeORM Documentation. https://typeorm.io")
bullet("The PostgreSQL Global Development Group. (s. f.). PostgreSQL Documentation. https://www.postgresql.org/docs/")
bullet("Supabase Inc. (s. f.). Supabase Documentation: Auth, Database and Storage. https://supabase.com/docs")
bullet("Microsoft Corporation. (s. f.). TypeScript Handbook. https://www.typescriptlang.org/docs/")
bullet("Tailwind Labs. (s. f.). Tailwind CSS Documentation. https://tailwindcss.com/docs")

h2("25.2 Estandares y normas sugeridas")
bullet("Jones, M., Bradley, J., & Sakimura, N. (2015). JSON Web Token (JWT) (RFC 7519). Internet Engineering Task Force. https://datatracker.ietf.org/doc/html/rfc7519")
bullet("Fielding, R., & Reschke, J. (2014). Hypertext Transfer Protocol (HTTP/1.1): Semantics and Content (RFC 7231). Internet Engineering Task Force.")
bullet("OWASP Foundation. (s. f.). OWASP Top Ten. https://owasp.org/www-project-top-ten/")
bullet("Institute of Electrical and Electronics Engineers. (1998). IEEE Recommended Practice for Software Requirements Specifications (IEEE Std 830-1998).")
bullet("International Organization for Standardization. (2011). ISO/IEC 25010: Systems and software Quality Requirements and Evaluation (SQuaRE).")

h2("25.3 Fuentes academicas por incorporar")
missing(
    "Deben incorporarse fuentes academicas revisadas por pares sobre ingenieria de "
    "software, sistemas de informacion y gestion comunitaria del agua, asi como la "
    "legislacion guatemalteca aplicable al tratamiento de datos personales y al "
    "uso del Documento Personal de Identificacion."
)

# ============================================================== 28. ANEXOS ===
h1("26. ANEXOS")

h2("Anexo A. Diagramas del sistema")
p(
    "Los diagramas del sistema se incorporaron en los capitulos correspondientes, "
    "junto con el codigo Mermaid de origen para permitir su regeneracion en "
    "https://mermaid.live:"
)
bullet("Diagrama de casos de uso (capitulo 10.3).")
bullet("Diagrama de secuencia de emision de recibo (capitulo 10.4).")
bullet("Diagrama de arquitectura (capitulo 11.1).")
bullet("Diagrama entidad-relacion (capitulo 12.2).")
bullet("Diagrama de flujo de autenticacion (capitulo 17.1).")
bullet("Diagrama de despliegue y de contexto (capitulo 19.1).")
bullet("Diagrama de flujo de facturacion (capitulo 10.4 / figura adicional).")
p(
    "Las imagenes se almacenan en docs/mermaid_diagramas/ y se insertan "
    "automaticamente al regenerar este documento.",
    italic=True,
)

h2("Anexo B. Capturas de pantalla del sistema")
p("Se recomienda incorporar, como minimo, las siguientes capturas:")
table(
    ["No.", "Pantalla", "Modulo"],
    [
        ["B-01", "Inicio de sesion", "Autenticacion"],
        ["B-02", "Registro de cuenta con selector de rol", "Autenticacion"],
        ["B-03", "Panel de indicadores del administrador", "Indicadores"],
        ["B-04", "Panel de indicadores del tesorero", "Indicadores"],
        ["B-05", "Listado de beneficiarios", "Padron"],
        ["B-06", "Asistente de registro, paso 1", "Padron"],
        ["B-07", "Asistente de registro, paso 2", "Padron"],
        ["B-08", "Asistente de registro, paso 3", "Padron"],
        ["B-09", "Detalle del beneficiario", "Padron"],
        ["B-10", "Formulario de emision de factura", "Facturacion"],
        ["B-11", "Recibo generado en PDF", "Facturacion"],
        ["B-12", "Consulta de pagos por DPI", "Pagos"],
        ["B-13", "Reporte de ingresos con grafico", "Reportes"],
        ["B-14", "Configuracion de la tarifa anual", "Configuracion"],
        ["B-15", "Interfaz en tema oscuro", "Transversal"],
        ["B-16", "Interfaz en dispositivo movil", "Transversal"],
    ],
    widths=[1.6, 8.4, 6.0],
    caption="Capturas de pantalla recomendadas",
)

h2("Anexo C. Script del esquema de base de datos")
p("Debe adjuntarse el contenido integro de 'backend/src/database/schema.sql' y de las cuatro migraciones del directorio 'backend/src/database/migrations'.")

h2("Anexo D. Catalogo completo de endpoints")
p("Los capitulos 16.2 a 16.5 contienen el catalogo completo. Se recomienda adjuntar adicionalmente una coleccion de peticiones ejecutables (por ejemplo, de Postman o Insomnia) que permita al tribunal verificar el comportamiento del sistema.")
missing("No se localizo ninguna coleccion de peticiones ni especificacion OpenAPI en el repositorio.")

h2("Anexo E. Codigo fuente relevante")
bullet("Algoritmo de calculo de anios pendientes ('facturacion.service.ts').")
bullet("Emision transaccional del recibo ('facturacion.service.ts').")
bullet("Middleware de autenticacion y autorizacion ('middleware/auth.ts').")
bullet("Generacion del comprobante en PDF ('pdf.service.ts').")
bullet("Conversion de montos a letras ('utils/numero-a-letras.ts').")

h2("Anexo F. Evidencias de prueba")
bullet("Salida de la ejecucion de la suite de pruebas (capitulo 18.2).")
bullet("Captura de la ejecucion satisfactoria del flujo de integracion continua.")
bullet("Registro de los casos de prueba propuestos, una vez ejecutados.")

h2("Anexo G. Documentacion administrativa")
missing(
    "Deben incorporarse, si la normativa de la carrera lo exige: carta de "
    "autorizacion del Comite de Agua Potable de Aldea Sibana, constancia de "
    "implementacion, actas de reunion, instrumentos de recoleccion de datos "
    "(entrevistas o encuestas) y cronograma de actividades."
)

# ============================================ AUDITORIA DE DOCUMENTACION ===
h1("AUDITORIA DE DOCUMENTACION")
p(
    "Esta seccion no forma parte del cuerpo academico del documento. Su proposito "
    "es delimitar con precision que informacion fue verificada directamente en el "
    "codigo fuente, que informacion debe ser aportada por el autor y que "
    "afirmaciones requieren validacion antes de la presentacion.",
    italic=True,
)

h2("A. Informacion encontrada y verificada")
table(
    ["Ambito", "Elementos comprobados directamente en el proyecto"],
    [
        ["Estructura", "Dos aplicaciones independientes; 41 archivos fuente en el servidor y 56 en el cliente."],
        ["Modelo de datos", "9 entidades TypeORM, 9 tablas, 7 indices, restricciones de unicidad y verificacion, 4 migraciones SQL."],
        ["Interfaz de programacion", "29 endpoints con su metodo, ruta, middlewares, rol requerido y codigo de respuesta."],
        ["Validacion", "11 objetos de transferencia de datos con todos sus decoradores de validacion."],
        ["Autenticacion", "Verificacion de JWT con 'jose' contra el JWKS de Supabase, validando emisor y audiencia; revalidacion del perfil en cada peticion."],
        ["Autorizacion", "Middleware 'requireRoles' en el servidor; 'RoleGate' y 'canAccessPath' en el cliente."],
        ["Reglas de negocio", "Algoritmo de anios pendientes, calculo del total, correlativo anual y emision transaccional."],
        ["Interfaz de usuario", "14 rutas, layouts diferenciados por rol, sistema de temas y componentes."],
        ["Pruebas", "1 archivo con 1 caso de prueba, ejecutado durante la elaboracion de este documento con resultado aprobado."],
        ["Integracion continua", "Flujo de GitHub Actions con lint, build y verificacion de tipos."],
        ["Configuracion", "13 variables de entorno, con identificacion de cuales son obligatorias."],
        ["Despliegue", "Plataformas de destino declaradas en el archivo README.md."],
    ],
    widths=[3.6, 12.4],
    caption="Informacion verificada en el codigo fuente",
)

h2("B. Informacion faltante que debe aportar el autor")
table(
    ["No.", "Informacion requerida", "Capitulo afectado"],
    [
        ["1", "Datos institucionales: universidad, facultad, carrera, estudiante, carne, asesor, lugar y fecha.", "1. Portada"],
        ["2", "Diagnostico de la situacion actual del comite antes de la implementacion.", "2.1"],
        ["3", "Comparacion cuantitativa con el proceso manual anterior.", "3.4"],
        ["4", "Antecedentes y estado del arte: sistemas similares y trabajos previos.", "7"],
        ["5", "Confirmacion de la metodologia de desarrollo realmente aplicada.", "8.2"],
        ["6", "Cronograma de actividades o planificacion temporal del proyecto.", "8.3"],
        ["7", "Metricas objetivo de rendimiento, disponibilidad y concurrencia.", "9.2"],
        ["8", "Resultados de impacto medidos en campo.", "22.3"],
        ["9", "Bibliografia completa en formato APA 7.", "25"],
        ["10", "Capturas de pantalla del sistema en funcionamiento.", "Anexo B"],
        ["11", "Diagramas renderizados a partir del codigo Mermaid proporcionado.", "Anexo A"],
        ["12", "Documentacion administrativa: cartas, actas e instrumentos de recoleccion.", "Anexo G"],
        ["13", "Historial de control de versiones del proyecto.", "13.4"],
    ],
    widths=[1.2, 10.4, 4.4],
    caption="Informacion faltante por aportar",
)

h2("C. Elementos inferidos que requieren validacion")
table(
    ["No.", "Elemento inferido", "Base de la inferencia", "Accion sugerida"],
    [
        [
            "1",
            "Metodologia incremental e iterativa.",
            "Migraciones secuenciales, separacion en capas y flujo de integracion "
            "continua.",
            "Confirmar la metodologia realmente empleada.",
        ],
        [
            "2",
            "Fases del desarrollo descritas en el capitulo 8.3.",
            "Artefactos existentes en el repositorio.",
            "Ajustar a la cronologia real del proyecto.",
        ],
        [
            "3",
            "Objetivos general y especificos.",
            "Derivados de las funcionalidades implementadas.",
            "Contrastar con los objetivos aprobados en el anteproyecto.",
        ],
        [
            "4",
            "Requerimientos funcionales RF-01 a RF-30.",
            "Obtenidos por ingenieria inversa desde los endpoints y las pantallas.",
            "Validar que correspondan a los requerimientos originalmente "
            "solicitados por el comite.",
        ],
        [
            "5",
            "Causas y consecuencias del problema.",
            "Inferidas de las reglas de negocio implementadas.",
            "Sustentar con informacion obtenida en campo.",
        ],
        [
            "6",
            "Regla de recalculo de anios al agregar un chorro nuevo.",
            "Comportamiento derivado del criterio 'al menos un chorro sin pago'.",
            "Validar con el comite que corresponda a la practica real.",
        ],
        [
            "7",
            "Version de TypeORM indicada en la tabla de tecnologias.",
            "El archivo declara '^0.3.20'.",
            "Verificar la version efectivamente instalada mediante 'npm list "
            "typeorm'.",
        ],
    ],
    widths=[1.2, 4.4, 5.6, 4.8],
    font_size=8,
    caption="Elementos inferidos que requieren validacion del autor",
)

h2("D. Recomendaciones antes de entregar la tesis")
p("Se sugiere el siguiente orden de trabajo, de mayor a menor prioridad.")

h3("D.1 Prioridad alta")
numbered("Completar todos los datos institucionales de la portada.")
numbered("Corregir el archivo README.md, que actualmente afirma que la autenticacion multifactor es obligatoria y que el registro es abierto; ninguna de las dos afirmaciones corresponde al codigo. Una contradiccion entre la documentacion y el sistema es facilmente detectable por el tribunal.")
numbered("Inicializar el repositorio de control de versiones y publicarlo, dado que la ausencia de historial suele ser objeto de observacion.")
numbered("Rotar las credenciales de Supabase y verificar que el archivo '.env' no se incluya en la entrega.")
numbered("Elaborar los capitulos 2.1, 7 y 25, que no pueden derivarse del codigo fuente.")
numbered("Renderizar los cinco diagramas Mermaid e incorporarlos como imagenes en los capitulos correspondientes.")

h3("D.2 Prioridad media")
numbered("Tomar las capturas de pantalla enumeradas en el anexo B y colocarlas en los espacios senalados del manual de usuario.")
numbered("Ejecutar los casos de prueba CP-03 a CP-20 y completar las columnas de resultado obtenido y estado. Un capitulo de pruebas con un unico caso automatizado es la observacion mas probable del tribunal.")
numbered("Validar los requerimientos funcionales contra el documento de anteproyecto aprobado.")
numbered("Confirmar o corregir la metodologia declarada en el capitulo 8.")
numbered("Obtener la carta de autorizacion o la constancia de implementacion del comite.")

h3("D.3 Prioridad baja pero recomendable")
numbered("Implementar las recomendaciones criticas R-02 y R-03, cuya correccion es sencilla y fortalece la defensa del trabajo.")
numbered("Agregar pruebas automatizadas para el servicio de facturacion, aunque sean pocas, e incorporarlas al flujo de integracion continua.")
numbered("Retirar las dependencias y el componente no utilizados identificados en el capitulo 24.2.")
numbered("Elaborar una coleccion de peticiones que permita al tribunal verificar la interfaz de programacion en vivo.")

h3("D.4 Advertencia final sobre coherencia documental")
note(
    "La inconsistencia mas relevante detectada es la siguiente: el archivo "
    "README.md del proyecto declara que el sistema utiliza autenticacion "
    "multifactor obligatoria mediante TOTP. El analisis del codigo demuestra que "
    "dicha funcionalidad NO esta implementada: no existen endpoints, no se importa "
    "la biblioteca 'otplib' y las rutas '/mfa/setup' y '/mfa/verificar' unicamente "
    "redirigen. Presentar ante el tribunal una funcionalidad inexistente "
    "compromete la credibilidad del trabajo completo. Se recomienda implementarla o "
    "declararla expresamente como trabajo futuro, tal como se documenta en el "
    "capitulo 5.1.3 de este documento."
)

# ----------------------------------------------------------------- cierre ---
add_page_numbers()
doc.save(OUT_FILE)
print("Documento generado correctamente en:")
print(OUT_FILE)

# -*- coding: utf-8 -*-
"""Capítulo 5 de la tesis AquaPay: diagramas y documento Word."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor, Emu

BASE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(BASE, "cap5_diagramas")
OUT = os.path.join(BASE, "Capitulo_5_Diseno_de_la_Aplicacion_AquaPay.docx")
os.makedirs(IMG, exist_ok=True)

WHITE = (255, 255, 255)
INK = (23, 32, 42)
MUTED = (80, 90, 100)
NAVY = (20, 52, 89)
BLUE = (29, 78, 137)
TEAL = (14, 116, 144)
LINE = (35, 48, 64)
FILL = (241, 246, 251)
FILL2 = (232, 240, 248)
ACTOR = (255, 255, 255)
GOLD = (254, 249, 231)
GREEN = (236, 253, 245)
AMBER = (255, 247, 237)
ROSE = (255, 241, 242)


def font(size, bold=False):
    path = r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf"
    if not os.path.exists(path):
        path = r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"
    return ImageFont.truetype(path, size)


def tw(draw, text, fnt):
    b = draw.textbbox((0, 0), text, font=fnt)
    return b[2] - b[0], b[3] - b[1]


def wrap(draw, text, fnt, max_w):
    lines, cur = [], ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if tw(draw, trial, fnt)[0] <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines or [""]


class C:
    def __init__(self, w, h):
        self.img = Image.new("RGB", (w, h), WHITE)
        self.d = ImageDraw.Draw(self.img)
        self.w, self.h = w, h

    def save(self, name):
        path = os.path.join(IMG, name)
        self.img.save(path, "PNG")
        return path

    def rrect(self, box, fill, outline=LINE, r=14, width=2):
        self.d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)

    def ctext(self, box, text, fnt, fill=INK, max_w=None):
        x1, y1, x2, y2 = box
        width = (x2 - x1 - 16) if max_w is None else max_w
        lines = []
        for raw in text.split("\n"):
            lines.extend(wrap(self.d, raw, fnt, width))
        heights = [tw(self.d, ln, fnt)[1] for ln in lines]
        total = sum(heights) + 4 * (len(lines) - 1)
        y = y1 + (y2 - y1 - total) / 2
        for ln, h in zip(lines, heights):
            lw = tw(self.d, ln, fnt)[0]
            self.d.text(((x1 + x2 - lw) / 2, y), ln, font=fnt, fill=fill)
            y += h + 4

    def label(self, xy, text, fnt, fill=INK):
        self.d.text(xy, text, font=fnt, fill=fill)

    def arrow(self, a, b, fill=LINE, width=2):
        self.d.line([a, b], fill=fill, width=width)
        x1, y1 = a
        x2, y2 = b
        import math
        ang = math.atan2(y2 - y1, x2 - x1)
        L = 11
        pts = []
        for dlt in (2.6, -2.6):
            pts.append((x2 - L * math.cos(ang - dlt / 4), y2 - L * math.sin(ang - dlt / 4)))
        self.d.polygon([(x2, y2), pts[0], pts[1]], fill=fill)

    def dashed(self, a, b, fill=MUTED, width=2):
        import math
        x1, y1 = a
        x2, y2 = b
        dist = math.hypot(x2 - x1, y2 - y1) or 1
        step = 10
        n = int(dist / step)
        for i in range(0, n, 2):
            t1, t2 = i / n, min((i + 1) / n, 1)
            self.d.line(
                [(x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1),
                 (x1 + (x2 - x1) * t2, y1 + (y2 - y1) * t2)],
                fill=fill, width=width,
            )

    def actor(self, x, y, name):
        d = self.d
        d.ellipse((x - 16, y, x + 16, y + 32), outline=NAVY, width=3)
        d.line((x, y + 32, x, y + 78), fill=NAVY, width=3)
        d.line((x - 28, y + 50, x + 28, y + 50), fill=NAVY, width=3)
        d.line((x, y + 78, x - 22, y + 112), fill=NAVY, width=3)
        d.line((x, y + 78, x + 22, y + 112), fill=NAVY, width=3)
        f = font(15, True)
        w = tw(d, name, f)[0]
        d.text((x - w / 2, y + 122), name, font=f, fill=NAVY)

    def ellipse(self, box, text, fill=FILL):
        self.d.ellipse(box, fill=fill, outline=NAVY, width=2)
        self.ctext(box, text, font(14))

    def diamond(self, cx, cy, rw, rh, text, fill=AMBER):
        pts = [(cx, cy - rh), (cx + rw, cy), (cx, cy + rh), (cx - rw, cy)]
        self.d.polygon(pts, fill=fill, outline=LINE)
        self.d.line(pts + [pts[0]], fill=LINE, width=2)
        self.ctext((cx - rw + 8, cy - rh + 8, cx + rw - 8, cy + rh - 8), text, font(13, True))

    def node(self, box, text, fill=FILL, title=None):
        self.rrect(box, fill)
        if title:
            x1, y1, x2, y2 = box
            self.d.rectangle((x1 + 2, y1 + 2, x2 - 2, y1 + 28), fill=NAVY)
            self.ctext((x1, y1, x2, y1 + 28), title, font(13, True), WHITE)
            self.ctext((x1, y1 + 28, x2, y2), text, font(13))
        else:
            self.ctext(box, text, font(14, True))


def arquitectura():
    c = C(1500, 980)
    c.label((40, 18), "Arquitectura en capas  ·  cliente / servidor", font(20, True), NAVY)
    layers = [
        (70, "Capa de presentación", "Next.js 15  ·  React 19  ·  Tailwind CSS\nPantallas: login, tablero, beneficiarios, emitir,\nhistorial, consultar pago, reportes y tarifa", FILL),
        (250, "Capa de aplicación", "API REST con Express  ·  JWT (jose)  ·  validación class-validator\nRutas: /api/auth  ·  /api/usuarios  ·  /api/facturacion  ·  /api/reportes", FILL2),
        (430, "Capa de dominio", "AuthService   UsuariosService   FacturacionService\nPdfService (pdf-lib)   ReportesService   ConfigService", GREEN),
        (610, "Capa de persistencia", "TypeORM  ·  PostgreSQL (Neon)\nArchivos PDF del recibo en disco del servidor (uploads/recibos)", GOLD),
    ]
    for y, title, body, fill in layers:
        c.rrect((180, y, 1320, y + 150), fill, NAVY, 16, 3)
        c.d.rectangle((180, y, 196, y + 150), fill=NAVY)
        c.label((220, y + 16), title, font(18, True), NAVY)
        c.ctext((210, y + 48, 1300, y + 142), body, font(16), INK)
    c.arrow((750, 220), (750, 250))
    c.arrow((750, 400), (750, 430))
    c.arrow((750, 580), (750, 610))
    c.rrect((40, 800, 470, 940), WHITE, TEAL, 12, 2)
    c.ctext((40, 800, 470, 940), "Cliente\nNavegador en la ventanilla\nHTTP + Bearer JWT", font(15, True), TEAL)
    c.rrect((1030, 800, 1460, 940), WHITE, TEAL, 12, 2)
    c.ctext((1030, 800, 1460, 940), "Seguridad\nHelmet, CORS y contraseña\ncon bcrypt (costo 12)", font(15, True), TEAL)
    c.arrow((250, 800), (400, 760), TEAL)
    c.arrow((1240, 800), (1100, 760), TEAL)
    return c.save("5_1_arquitectura.png")


def casos_uso():
    c = C(1680, 1080)
    c.rrect((250, 30, 1430, 1040), (248, 250, 252), NAVY, 18, 3)
    c.label((270, 42), "Sistema AquaPay", font(18, True), NAVY)
    c.actor(110, 250, "Administrador")
    c.actor(1560, 250, "Tesorero")
    casos = {
        "login": (560, 110, 900, 180, "Iniciar sesión"),
        "reset": (940, 110, 1320, 180, "Restablecer contraseña"),
        "dash": (560, 210, 900, 280, "Consultar tablero"),
        "reg": (340, 330, 700, 400, "Registrar beneficiario"),
        "viv": (340, 430, 700, 500, "Administrar vivienda y chorro"),
        "pago": (340, 530, 700, 600, "Consultar pago"),
        "rep": (340, 630, 700, 700, "Generar reporte"),
        "tar": (340, 730, 700, 800, "Configurar tarifa"),
        "emi": (980, 330, 1340, 400, "Emitir recibo"),
        "his": (980, 450, 1340, 520, "Consultar historial"),
        "pdf": (980, 590, 1340, 660, "Ver, imprimir o descargar PDF"),
        "out": (740, 860, 1080, 930, "Cerrar sesión"),
    }
    for box in casos.values():
        c.ellipse(box[:4], box[4])
    # include
    c.dashed((1160, 400), (1160, 590), BLUE)
    c.label((1172, 480), "«include»", font(12, True), BLUE)
    c.dashed((1160, 520), (1160, 590), BLUE)
    # actor links
    admin = (150, 360)
    tes = (1530, 360)
    for key in ("login", "reset", "dash", "reg", "viv", "pago", "rep", "tar", "out"):
        x1, y1, x2, y2, _ = casos[key]
        c.d.line([admin, ((x1 + x2) / 2, (y1 + y2) / 2)], fill=(180, 190, 200), width=2)
    for key in ("login", "reset", "dash", "emi", "his", "pdf", "out"):
        x1, y1, x2, y2, _ = casos[key]
        c.d.line([tes, ((x1 + x2) / 2, (y1 + y2) / 2)], fill=(180, 190, 200), width=2)
    for box in casos.values():
        c.ellipse(box[:4], box[4])
    return c.save("5_2_casos_uso.png")


def actividades():
    c = C(1280, 1180)
    c.d.ellipse((560, 16, 680, 58), fill=NAVY)
    c.ctext((560, 16, 680, 58), "Inicio", font(14, True), WHITE)

    def rect(y, text, fill):
        c.rrect((300, y, 900, y + 72), fill, NAVY, 14, 2)
        c.ctext((300, y, 900, y + 72), text, font(16, True))

    rect(80, "Seleccionar beneficiario activo", FILL)
    c.diamond(600, 230, 220, 52, "¿Tiene vivienda\ny chorro activo?")
    rect(320, "Elegir tarifa anual\no compra de chorro", FILL)
    c.diamond(600, 470, 220, 52, "¿Hay deuda y\ntotal mayor a Q 0?")
    rect(560, "Registrar recibo y pago\nen una transacción", FILL2)
    rect(660, "Generar el PDF del recibo", GREEN)
    rect(760, "Mostrar vista previa\nImprimir o descargar", GREEN)
    c.d.ellipse((560, 870, 680, 916), fill=NAVY)
    c.ctext((560, 870, 680, 916), "Fin", font(14, True), WHITE)

    downs = [(600, 58, 80), (600, 152, 178), (600, 282, 320), (600, 392, 418),
             (600, 522, 560), (600, 632, 660), (600, 732, 760), (600, 832, 870)]
    for x, y1, y2 in downs:
        c.arrow((x, y1), (x, y2), TEAL)
    c.label((612, 292), "Sí", font(14, True), TEAL)
    c.label((612, 532), "Sí", font(14, True), TEAL)

    c.rrect((980, 190, 1240, 270), ROSE, (160, 50, 50), 12, 2)
    c.ctext((980, 190, 1240, 270), "Avisar y no\npermitir el cobro", font(14, True), (140, 40, 40))
    c.arrow((820, 230), (980, 230), (160, 50, 50))
    c.label((860, 200), "No", font(14, True), (160, 50, 50))

    c.rrect((980, 430, 1240, 510), ROSE, (160, 50, 50), 12, 2)
    c.ctext((980, 430, 1240, 510), "Emitir queda\ndeshabilitado", font(14, True), (140, 40, 40))
    c.arrow((820, 470), (980, 470), (160, 50, 50))
    c.label((860, 440), "No", font(14, True), (160, 50, 50))
    return c.save("5_4_actividades.png")


def secuencias():
    c = C(1600, 820)
    actors = [
        (80, "Tesorero"),
        (380, "Pantalla\nEmitir"),
        (680, "API\n/facturacion"),
        (980, "Facturacion\nService"),
        (1280, "PostgreSQL\ny PdfService"),
    ]
    f = font(14, True)
    for x, name in actors:
        c.rrect((x, 30, x + 220, 100), NAVY, NAVY, 10, 2)
        c.ctext((x, 30, x + 220, 100), name, f, WHITE)
        c.dashed((x + 110, 100), (x + 110, 760), (170, 180, 190), 2)
    msgs = [
        (0, 1, 160, "1. Elige beneficiario y tipo de cobro"),
        (1, 2, 230, "2. GET pendientes / POST cobrar"),
        (2, 3, 300, "3. Valida deuda y abre transacción"),
        (3, 4, 370, "4. INSERT recibo, pago y PDF"),
        (4, 3, 450, "5. Recibo guardado + bytes del PDF"),
        (3, 2, 520, "6. 201  { recibo, pdf }"),
        (2, 1, 590, "7. JSON con el recibo y el PDF"),
        (1, 0, 660, "8. Vista previa, imprimir o descargar"),
    ]
    for a, b, y, text in msgs:
        x1 = actors[a][0] + 110
        x2 = actors[b][0] + 110
        if a < b:
            c.arrow((x1, y), (x2 - 8, y), BLUE)
            c.label((min(x1, x2) + 12, y - 22), text, font(13), INK)
        else:
            c.arrow((x1, y), (x2 + 8, y), TEAL)
            c.label((min(x1, x2) + 12, y + 6), text, font(13), INK)
    return c.save("5_5_secuencias.png")


def componentes():
    c = C(1500, 900)
    c.rrect((40, 40, 700, 860), FILL, NAVY, 16, 3)
    c.label((60, 55), "Frontend  ·  Next.js", font(18, True), NAVY)
    mods = [
        (70, 110, "Auth\nlogin y restablecer"),
        (380, 110, "Tablero\npor rol"),
        (70, 280, "Beneficiarios\nvivienda y chorro"),
        (380, 280, "Emitir recibo\ny visor PDF"),
        (70, 450, "Historial"),
        (380, 450, "Consultar pago"),
        (70, 620, "Reportes"),
        (380, 620, "Tarifa"),
        (70, 760, "api.ts  ·  cliente HTTP con JWT"),
    ]
    for x, y, t in mods[:-1]:
        c.rrect((x, y, x + 270, y + 120), WHITE, BLUE, 12, 2)
        c.ctext((x, y, x + 270, y + 120), t, font(15, True))
    c.rrect((70, 760, 650, 830), NAVY, NAVY, 10, 2)
    c.ctext((70, 760, 650, 830), "api.ts   ·   cliente HTTP con Bearer JWT", font(16, True), WHITE)

    c.rrect((800, 40, 1460, 860), (255, 250, 245), (160, 90, 20), 16, 3)
    c.label((820, 55), "Backend  ·  Express", font(18, True), (140, 70, 10))
    backs = [
        (830, 120, "Rutas auth, usuarios,\nfacturación y reportes"),
        (830, 270, "Middleware\nauth JWT y roles"),
        (830, 420, "Servicios de dominio\ny generación PDF"),
        (830, 570, "TypeORM\nPostgreSQL Neon"),
        (830, 720, "Almacén de PDF\nuploads/recibos"),
    ]
    for x, y, t in backs:
        c.rrect((x, y, x + 590, y + 110), WHITE, (160, 90, 20), 12, 2)
        c.ctext((x, y, x + 590, y + 110), t, font(16, True))
    c.arrow((700, 790), (800, 175), NAVY)
    return c.save("5_6_componentes.png")


def objetos():
    c = C(1500, 780)
    objs = [
        (40, 40, "perfilTesorero : Perfil", "nombre = María López\nrol = tesorero\nactivo = verdadero"),
        (520, 40, "beneficiario : UsuarioComunidad", "nombre = Carmen Elena Vásquez\ndpi = 2487 01000 0104\nactivo = verdadero"),
        (1000, 40, "vivienda : Vivienda", "dirección = Zona alta, Las Flores\nanioInicioCobro = 2026\nactiva = verdadero"),
        (40, 340, "chorro : Chorro", "cantidad = 1\nprecioCompra = Q 1,500.00\nactivo = verdadero"),
        (520, 340, "recibo : Recibo", "número = 2026-002\ntipo = tarifa_anual\ntotal = Q 120.00\nfechaPago = hoy"),
        (1000, 340, "pdf : ReciboPdf", "archivo = recibo-2026-002.pdf\ntipoMime = application/pdf"),
        (520, 600, "pago : PagoAnual", "año = 2026\nmonto = Q 120.00"),
    ]
    for x, y, title, body in objs:
        c.rrect((x, y, x + 450, y + 250 if y < 500 else y + 150), WHITE, NAVY, 12, 2)
        h = 250 if y < 500 else 150
        c.d.rectangle((x + 2, y + 2, x + 448, y + 40), fill=NAVY)
        c.ctext((x, y, x + 450, y + 40), title, font(14, True), WHITE)
        c.ctext((x + 8, y + 44, x + 442, y + h - 8), body, font(15))
    c.arrow((970, 150), (1000, 150), TEAL)
    c.label((978, 118), "1", font(12, True), TEAL)
    c.label((500, 302), "El beneficiario vive en la vivienda. La vivienda tiene el chorro.", font(14, True), TEAL)
    c.arrow((970, 450), (1000, 450), TEAL)
    c.label((978, 418), "1:1", font(12, True), TEAL)
    c.label((760, 568), "El recibo adjunta el PDF y detalla el pago anual.", font(14, True), TEAL)
    return c.save("5_7_objetos.png")


def clases():
    c = C(1700, 1100)
    boxes = {
        "Perfil": (40, 40, "id, nombre, dpi\npasswordHash, rol\nactivo"),
        "UsuarioComunidad": (430, 40, "id, nombreCompleto\ndpi, teléfono\nactivo"),
        "Vivienda": (860, 40, "id, dirección\nanioInicioCobro\nactiva"),
        "Chorro": (1270, 40, "id, cantidad\nprecioCompra\nactivo"),
        "Recibo": (430, 420, "numeroRecibo, secuencia\ntipoCobro, totalPagado\ncantidadEnLetras\nfechaPago"),
        "PagoAnual": (40, 760, "anio\nmontoPagado"),
        "PagoCompra": (430, 760, "montoPagado\nfechaPago"),
        "ReciboPdf": (860, 760, "nombreArchivo\nrutaStorage\ntipoMime"),
        "Configuracion": (1270, 420, "clave, valor\nactualizadoPor"),
    }
    for name, (x, y, body) in boxes.items():
        c.rrect((x, y, x + 360, y + 230), WHITE, NAVY, 10, 2)
        c.d.rectangle((x + 2, y + 2, x + 358, y + 42), fill=NAVY)
        c.ctext((x, y, x + 360, y + 42), name, font(16, True), WHITE)
        c.ctext((x + 10, y + 50, x + 350, y + 220), body, font(15))
    links = [
        ((790, 140), (860, 140), "1 posee *"),
        ((1220, 140), (1270, 140), "1 tiene *"),
        ((1040, 270), (760, 420), "1 vivienda, * recibos"),
        ((500, 650), (250, 760), "pagos del año"),
        ((610, 650), (610, 760), "1 recibo, * pagos"),
        ((750, 650), (1000, 760), "1 a 1 PDF"),
        ((220, 270), (460, 420), "tesorero emite"),
    ]
    for a, b, lab in links:
        c.d.line([a, b], fill=BLUE, width=2)
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        c.label((mx + 6, my - 18), lab, font(12, True), TEAL)
    return c.save("5_8_clases.png")


def estados():
    c = C(1500, 520)
    def st(box, text, fill=FILL):
        c.rrect(box, fill, NAVY, 18, 3)
        c.ctext(box, text, font(16, True))
    c.d.ellipse((30, 210, 70, 250), fill=NAVY)
    st((120, 180, 360, 280), "Anónima")
    st((460, 180, 760, 280), "Autenticada", GREEN)
    st((860, 80, 1160, 180), "Expirada\no inválida", AMBER)
    st((860, 300, 1160, 400), "Cerrada", ROSE)
    st((1240, 180, 1470, 280), "Anónima")
    c.arrow((70, 230), (120, 230))
    c.arrow((360, 230), (460, 230), TEAL)
    c.label((370, 200), "login válido", font(13, True), TEAL)
    c.arrow((760, 210), (860, 140), (180, 110, 20))
    c.label((760, 120), "401", font(13, True), (180, 110, 20))
    c.arrow((760, 250), (860, 350))
    c.label((770, 300), "Salir", font(13, True))
    c.arrow((1160, 130), (1350, 180), (180, 110, 20))
    c.arrow((1160, 350), (1350, 280))
    c.label((1248, 150), "vuelve\nal login", font(12), MUTED)
    return c.save("5_9_estados.png")


def colaboracion():
    c = C(1400, 720)
    nodes = {
        "t": (80, 280, 320, 380, "Tesorero"),
        "ui": (420, 80, 700, 180, ":EmitirFacturaForm"),
        "api": (860, 80, 1160, 180, ":FacturacionRoutes"),
        "srv": (860, 300, 1220, 400, ":FacturacionService"),
        "pdf": (860, 500, 1160, 600, ":PdfService"),
        "db": (420, 500, 720, 600, ":PostgreSQL"),
    }
    for x1, y1, x2, y2, name in nodes.values():
        c.rrect((x1, y1, x2, y2), FILL, NAVY, 12, 2)
        c.ctext((x1, y1, x2, y2), name, font(16, True))
    c.d.line([(200, 280), (560, 180)], fill=LINE, width=2)
    c.d.line([(700, 130), (860, 130)], fill=LINE, width=2)
    c.d.line([(1010, 180), (1010, 300)], fill=LINE, width=2)
    c.d.line([(1010, 400), (1010, 500)], fill=LINE, width=2)
    c.d.line([(860, 550), (720, 550)], fill=LINE, width=2)
    notes = [
        (180, 200, "1. emitir()"),
        (720, 90, "2. POST cobrar"),
        (1030, 230, "3. cobrarTarifa()"),
        (1030, 440, "4. generarRecibo()"),
        (700, 500, "5. guardar recibo"),
        (560, 250, "6. abrir visor PDF"),
    ]
    for x, y, t in notes:
        c.label((x, y), t, font(14, True), BLUE)
    return c.save("5_10_colaboracion.png")


def entidad_relacion():
    c = C(1680, 980)
    tables = [
        (40, 40, "PERFILES", "PK id\ndpi  UK\nrol\npassword_hash"),
        (460, 40, "USUARIOS_COMUNIDAD", "PK id\ndpi  UK\nnombre_completo\nactivo"),
        (880, 40, "VIVIENDAS", "PK id\nFK usuario_id\ndirección\nanio_inicio_cobro"),
        (1300, 40, "CHORROS", "PK id\nFK vivienda_id\ncantidad\nprecio_compra"),
        (40, 380, "CONFIGURACION", "PK id\nclave  UK\nvalor\nFK actualizado_por"),
        (460, 380, "RECIBOS", "PK id\nFK vivienda_id\nFK creado_por\nnumero_recibo  UK\ntipo_cobro, total"),
        (880, 380, "PAGOS_ANUALES", "PK id\nFK recibo_id\nFK chorro_id\nanio único con chorro"),
        (1300, 380, "PAGOS_COMPRA", "PK id\nFK recibo_id\nFK chorro_id\nmonto_pagado"),
        (460, 720, "RECIBOS_PDF", "PK id\nFK recibo_id  UK\nnombre_archivo\nruta_storage"),
    ]
    for x, y, title, body in tables:
        c.rrect((x, y, x + 330, y + 250), WHITE, NAVY, 8, 2)
        c.d.rectangle((x + 2, y + 2, x + 328, y + 42), fill=NAVY)
        c.ctext((x, y, x + 330, y + 42), title, font(15, True), WHITE)
        c.ctext((x + 12, y + 50, x + 318, y + 240), body, font(16))
    edges = [
        ((370, 160), (460, 160), "1 : *"),
        ((790, 160), (880, 160), "1 : *"),
        ((1210, 160), (1300, 160), "1 : *"),
        ((190, 290), (190, 380), "actualiza"),
        ((790, 480), (880, 480), "1 : *"),
        ((1210, 500), (1300, 500), "1 : *"),
        ((625, 630), (625, 720), "1 : 1"),
    ]
    for a, b, lab in edges:
        c.d.line([a, b], fill=TEAL, width=3)
        c.label(((a[0] + b[0]) / 2 + 6, (a[1] + b[1]) / 2 - 18), lab, font(13, True), TEAL)
    return c.save("5_11_er.png")


def infraestructura():
    c = C(1500, 860)
    c.rrect((40, 40, 1460, 820), (248, 250, 252), NAVY, 16, 3)
    c.label((70, 55), "Puesto de ventanilla  ·  Aldea Sibaná", font(18, True), NAVY)
    blocks = [
        (80, 140, 460, 340, "Equipo de la ventanilla", "Computadora o teléfono\nNavegador actual\nRed local o datos móviles"),
        (520, 140, 980, 340, "Servidor de interfaz", "Next.js  ·  puerto 3000\nNode.js\nInterfaz del tesorero y del administrador"),
        (1040, 140, 1420, 340, "Servidor de la API", "Express  ·  puerto 4100\nJWT, validación y PDF\nCarpeta uploads/recibos"),
        (300, 480, 760, 740, "Base de datos", "PostgreSQL en Neon\nConexión cifrada (SSL)\nNueve tablas del cobro"),
        (860, 480, 1320, 740, "Respaldo operativo", "Copias de la base\nCopias de los PDF\nCuenta de administrador inicial"),
    ]
    for x1, y1, x2, y2, title, body in blocks:
        c.rrect((x1, y1, x2, y2), WHITE, BLUE, 14, 3)
        c.d.rectangle((x1 + 3, y1 + 3, x2 - 3, y1 + 46), fill=BLUE)
        c.ctext((x1, y1, x2, y1 + 46), title, font(16, True), WHITE)
        c.ctext((x1 + 10, y1 + 56, x2 - 10, y2 - 8), body, font(16))
    c.arrow((460, 240), (520, 240))
    c.arrow((980, 240), (1040, 240))
    c.arrow((1230, 340), (1100, 480))
    c.arrow((750, 340), (560, 480))
    return c.save("5_12_infraestructura.png")


def build_images():
    return {
        "arq": arquitectura(),
        "cu": casos_uso(),
        "act": actividades(),
        "seq": secuencias(),
        "comp": componentes(),
        "obj": objetos(),
        "cls": clases(),
        "est": estados(),
        "col": colaboracion(),
        "er": entidad_relacion(),
        "inf": infraestructura(),
    }


# ---------------------------------------------------------------- Word ---
NAVY_RGB = RGBColor(0x14, 0x34, 0x59)
INK_RGB = RGBColor(0x1C, 0x28, 0x33)


def shade_cell(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def set_run_font(run, name="Times New Roman", size=12, bold=False, italic=False, color=None):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color is not None:
        run.font.color.rgb = color


def add_page_number(paragraph):
    run = paragraph.add_run()
    set_run_font(run, size=10, color=NAVY_RGB)
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_end)


def paragraph(doc, text, size=12, bold=False, italic=False, align="justify", space_after=8, space_before=0):
    par = doc.add_paragraph()
    par.paragraph_format.space_after = Pt(space_after)
    par.paragraph_format.space_before = Pt(space_before)
    par.paragraph_format.line_spacing = 1.5
    if align == "justify":
        par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    elif align == "center":
        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "left":
        par.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = par.add_run(text)
    set_run_font(run, size=size, bold=bold, italic=italic)
    return par


def heading(doc, text, level):
    par = doc.add_heading(text, level=level)
    for run in par.runs:
        set_run_font(run, "Calibri", 16 if level == 1 else 13, True, color=NAVY_RGB)
    par.paragraph_format.space_before = Pt(16 if level == 1 else 12)
    par.paragraph_format.space_after = Pt(8)
    par.paragraph_format.line_spacing = 1.15
    return par


def figure(doc, path, number, title):
    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.space_before = Pt(10)
    par.paragraph_format.space_after = Pt(2)
    run = par.add_run()
    run.add_picture(path, width=Cm(15.5))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(0)
    cap.paragraph_format.line_spacing = 1.15
    r1 = cap.add_run(f"Figura {number}. ")
    set_run_font(r1, "Calibri", 11, True)
    r2 = cap.add_run(title)
    set_run_font(r2, "Calibri", 11, False)
    src = doc.add_paragraph()
    src.alignment = WD_ALIGN_PARAGRAPH.CENTER
    src.paragraph_format.space_after = Pt(12)
    rs = src.add_run("Fuente: elaboración propia, con base en el sistema AquaPay, 2026.")
    set_run_font(rs, "Calibri", 10, False, True, RGBColor(0x55, 0x55, 0x55))


def table(doc, headers, rows):
    tbl = doc.add_table(rows=1 + len(rows), cols=len(headers))
    tbl.style = "Table Grid"
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers):
        cell = tbl.rows[0].cells[i]
        cell.text = ""
        p = cell.paragraphs[0]
        r = p.add_run(h)
        set_run_font(r, "Calibri", 10, True, color=RGBColor(255, 255, 255))
        shade_cell(cell, "143459")
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            cell = tbl.rows[ri + 1].cells[ci]
            cell.text = ""
            p = cell.paragraphs[0]
            r = p.add_run(val)
            set_run_font(r, "Calibri", 10)
            if ri % 2 == 1:
                shade_cell(cell, "F4F7FB")
    doc.add_paragraph().paragraph_format.space_after = Pt(6)


def ficha(doc, codigo, nombre, filas):
    heading(doc, f"{codigo}  {nombre}", 3)
    table(doc, ["Elemento", "Descripción"], filas)


def build_doc(imgs):
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Cm(2.5)
    sec.bottom_margin = Cm(2.5)
    sec.left_margin = Cm(3.0)
    sec.right_margin = Cm(2.5)
    sec.page_width = Cm(21.59)
    sec.page_height = Cm(27.94)
    normal = doc.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal.font.size = Pt(12)
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")

    header = sec.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    rh = header.add_run("AquaPay  ·  Aldea Sibaná")
    set_run_font(rh, "Calibri", 10, False, color=NAVY_RGB)
    footer = sec.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rf = footer.add_run("Capítulo 5  ·  Diseño de la aplicación    ")
    set_run_font(rf, "Calibri", 10, color=NAVY_RGB)
    add_page_number(footer)

    paragraph(doc, "CAPÍTULO 5", size=14, bold=True, align="center", space_after=4)
    paragraph(doc, "DISEÑO DE LA APLICACIÓN O SOLUCIÓN", size=16, bold=True, align="center", space_after=12)
    paragraph(
        doc,
        "Este capítulo describe el diseño de AquaPay, el sistema de cobro del servicio de agua de la Aldea Sibaná, El Asintal, Retalhuleu. El diseño sigue lo que el sistema ya hace: dos roles de ventanilla, el padrón de beneficiarios, el cobro de la tarifa anual y de la compra del chorro, el recibo en PDF y la consulta de lo pagado. Cada diagrama se presenta como figura, con título y fuente.",
    )

    heading(doc, "5.1 Arquitectura del sistema", 1)
    paragraph(
        doc,
        "AquaPay usa una arquitectura en capas, de tipo cliente-servidor. El navegador no habla con la base de datos. Llama a una API REST y esa API es la única que escribe en PostgreSQL y en los archivos PDF. El patrón separa la interfaz, las reglas del cobro y los datos, de modo que un cambio de pantalla no obliga a cambiar el cálculo del recibo.",
    )
    paragraph(doc, "Las capas y las tecnologías, alineadas con el alcance del sistema, son las siguientes:", space_after=4)
    table(
        doc,
        ["Capa", "Responsabilidad", "Tecnología"],
        [
            ["Presentación", "Pantallas, menú por rol y vista previa del PDF", "Next.js 15, React 19, Tailwind CSS"],
            ["Aplicación", "Rutas HTTP, sesión JWT y validación de datos", "Express, jose, class-validator"],
            ["Dominio", "Cobro, correlativo, letras del monto y reportes", "Servicios TypeScript y pdf-lib"],
            ["Persistencia", "Padrón, recibos, pagos y archivo del PDF", "TypeORM, PostgreSQL (Neon), disco local"],
        ],
    )
    paragraph(
        doc,
        "La sesión se guarda en el navegador y viaja como Bearer JWT. Si el servidor responde 401, la interfaz borra esa sesión y regresa a la pantalla de entrar. La contraseña no se almacena en claro: se guarda con bcrypt y un costo de 12. El administrador y el tesorero comparten el tablero, pero el menú y las rutas restringen el resto de funciones.",
    )
    figure(doc, imgs["arq"], "5.1", "Arquitectura en capas del sistema AquaPay")

    heading(doc, "5.2 Diagramas de casos de uso", 1)
    paragraph(
        doc,
        "Hay dos actores. El administrador cuida el padrón, la tarifa, la consulta de quién ya pagó y los reportes. El tesorero cobra en ventanilla: emite el recibo, revisa el historial y entrega el PDF. Los dos inician sesión, pueden restablecer la contraseña con su DPI y cierran sesión. Emitir un recibo y abrir el historial incluyen ver el PDF, porque el comprobante no se entrega solo como un enlace suelto.",
    )
    figure(doc, imgs["cu"], "5.2", "Casos de uso de AquaPay según el rol de ventanilla")
    table(
        doc,
        ["Caso de uso", "Actor principal", "Objetivo"],
        [
            ["CU-01 Iniciar sesión", "Administrador o tesorero", "Entrar con DPI y contraseña"],
            ["CU-02 Restablecer contraseña", "Administrador o tesorero", "Cambiar la clave con el DPI registrado"],
            ["CU-03 Consultar tablero", "Ambos", "Ver ingresos y recibos del mes"],
            ["CU-04 Registrar beneficiario", "Administrador", "Dar de alta a la persona, su vivienda y su chorro"],
            ["CU-05 Consultar pago", "Administrador", "Ver quién ya pagó y abrir sus recibos"],
            ["CU-06 Generar reporte", "Administrador", "Listar o exportar usuarios, viviendas, pagos o ingresos"],
            ["CU-07 Configurar tarifa", "Administrador", "Actualizar la tarifa anual por chorro"],
            ["CU-08 Emitir recibo", "Tesorero", "Cobrar tarifa anual o compra de chorro"],
            ["CU-09 Consultar historial", "Tesorero", "Buscar facturas por nombre, DPI, número o año"],
            ["CU-10 Ver el PDF", "Tesorero y, al consultar, el administrador", "Previsualizar, imprimir o descargar el recibo"],
            ["CU-11 Cerrar sesión", "Ambos", "Salir y exigir un nuevo ingreso"],
        ],
    )

    heading(doc, "5.3 Especificación de casos de uso", 1)
    paragraph(
        doc,
        "Cada ficha recoge el actor, las condiciones de entrada, el camino normal, los caminos que no completan el cobro y el resultado. Los identificadores coinciden con la figura 5.2.",
    )
    ficha(doc, "CU-01", "Iniciar sesión", [
        ["Actor", "Administrador o tesorero"],
        ["Precondición", "La persona tiene una cuenta activa. El DPI tiene 13 dígitos y la contraseña, al menos 8 caracteres."],
        ["Flujo principal", "1. Abre Entrar. 2. Escribe DPI y contraseña. 3. Puede marcar Recordarme. 4. Pulsa Iniciar sesión. 5. El sistema compara la contraseña y entrega un JWT. 6. Entra al tablero de su rol."],
        ["Flujos alternos", "DPI incompleto o clave corta: el botón no envía el formulario. Credenciales incorrectas: permanece en Entrar y muestra el aviso. Token guardado pero rechazado con 401: se borra la sesión y vuelve a Entrar."],
        ["Postcondición", "Hay una sesión válida y el menú muestra solo las opciones del rol."],
    ])
    ficha(doc, "CU-02", "Restablecer contraseña", [
        ["Actor", "Administrador o tesorero"],
        ["Precondición", "Existe una cuenta activa con ese DPI. No se usa correo."],
        ["Flujo principal", "1. En Entrar elige ¿Olvidó la contraseña? 2. Confirma el DPI. 3. Escribe y confirma la nueva contraseña. 4. El sistema la guarda con bcrypt. 5. Regresa a Entrar para ingresar con la clave nueva."],
        ["Flujos alternos", "El DPI no existe o la cuenta está inactiva: se informa que no hay cuenta activa. Las claves no coinciden: no se guarda el cambio."],
        ["Postcondición", "La contraseña anterior deja de servir. La nueva queda asociada al mismo DPI."],
    ])
    ficha(doc, "CU-03", "Consultar tablero", [
        ["Actor", "Administrador o tesorero"],
        ["Precondición", "Hay una sesión válida. El menú ya filtró las opciones del rol."],
        ["Flujo principal", "1. Al entrar, el sistema abre el tablero. 2. Consulta los ingresos del mes y los recibos recientes. 3. El administrador ve además el acceso a beneficiarios, consulta de pagos, reportes y tarifa. 4. El tesorero ve el acceso a emitir e historial."],
        ["Flujos alternos", "Si la sesión fue rechazada con 401, no se muestra el tablero: se borra el token y se regresa a Entrar. Una ruta de otro rol redirige al tablero."],
        ["Postcondición", "La persona ve el resumen de su rol y puede abrir solo las funciones que le corresponden."],
    ])
    ficha(doc, "CU-04", "Registrar beneficiario", [
        ["Actor", "Administrador"],
        ["Precondición", "Sesión de administrador. El DPI del beneficiario no está repetido."],
        ["Flujo principal", "1. Abre Registrar. 2. Anota nombre, DPI y teléfono. 3. Indica la dirección y el año de inicio de cobro. 4. Indica la cantidad de chorros y el precio de compra. 5. Guarda. 6. La persona queda activa y visible para el tesorero al emitir."],
        ["Flujos alternos", "DPI duplicado: no se crea otro padrón. El tesorero que intente abrir Beneficiarios es devuelto al tablero."],
        ["Postcondición", "Existen el beneficiario, al menos una vivienda y sus chorros."],
    ])
    ficha(doc, "CU-08", "Emitir recibo", [
        ["Actor", "Tesorero"],
        ["Precondición", "Sesión de tesorero. El beneficiario está activo, tiene vivienda activa y al menos un chorro activo."],
        ["Flujo principal", "1. Abre Emitir. 2. Busca a la persona por nombre o DPI. 3. Elige tarifa anual o compra de chorro. 4. En tarifa, el sistema propone los años pendientes desde el año de inicio hasta el año actual. 5. Revisa el total y la cantidad en letras. 6. Pulsa Emitir. 7. El servidor numera el recibo, guarda el pago y genera el PDF. 8. Se abre la vista previa."],
        ["Flujos alternos", "Sin vivienda, sin chorro o sin deuda: Emitir permanece deshabilitado. La compra de un chorro ya cobrada no vuelve a ofrecerse. Si dos cobros coinciden en el mismo número, la transacción no deja un recibo a medias."],
        ["Postcondición", "Queda un recibo con correlativo único, el pago del año o de la compra, y un PDF listo para imprimir o descargar."],
    ])
    ficha(doc, "CU-09", "Consultar historial", [
        ["Actor", "Tesorero"],
        ["Precondición", "Sesión de tesorero."],
        ["Flujo principal", "1. Abre Historial. 2. Ve los totales del listado. 3. Busca por nombre, DPI o número de recibo y, si quiere, por año. 4. Avanza de página de 12 en 12. 5. Pulsa Ver PDF sobre el recibo elegido."],
        ["Flujos alternos", "Sin coincidencias: la pantalla lo indica y no se rompe. Un año sin facturas muestra el vacío de ese filtro."],
        ["Postcondición", "El tesorero localizó el comprobante o confirmó que no está en el filtro."],
    ])
    ficha(doc, "CU-05", "Consultar pago", [
        ["Actor", "Administrador"],
        ["Precondición", "Sesión de administrador. Hay recibos emitidos."],
        ["Flujo principal", "1. Abre Consultar pago. 2. Filtra por año o por nombre y DPI. 3. Ve a las personas que ya pagaron, agrupadas, con su último pago y el total. 4. Despliega los recibos de una persona. 5. Abre el PDF."],
        ["Flujos alternos", "Si nadie ha pagado en el filtro, el listado queda vacío. El tesorero no entra a esta ruta."],
        ["Postcondición", "El administrador sabe quién pagó y puede abrir el comprobante."],
    ])
    ficha(doc, "CU-06", "Generar reporte", [
        ["Actor", "Administrador"],
        ["Precondición", "Sesión de administrador."],
        ["Flujo principal", "1. Abre Reportes. 2. Elige usuarios, viviendas, pagos o ingresos, y el año cuando aplica. 3. Revisa la tabla. 4. Puede descargar el mismo reporte en PDF."],
        ["Flujos alternos", "Un rol distinto recibe prohibición en la API. Si no hay filas, el reporte sale vacío."],
        ["Postcondición", "Queda consultado o descargado el reporte del período."],
    ])
    ficha(doc, "CU-07", "Configurar tarifa", [
        ["Actor", "Administrador"],
        ["Precondición", "Sesión de administrador. La tarifa nueva es mayor que cero."],
        ["Flujo principal", "1. Abre Tarifa. 2. Ve la tarifa anual vigente y el lugar de pago. 3. Escribe el nuevo monto. 4. Guarda. 5. Los cobros siguientes usan ese valor por cada chorro y por cada año pendiente."],
        ["Flujos alternos", "Monto en cero o negativo: el servidor lo rechaza. El lugar de pago de los recibos sigue siendo Aldea Sibaná, El Asintal, Retalhuleu, salvo que se cambie en la configuración."],
        ["Postcondición", "La clave tarifa_anual queda actualizada y queda registrado quién la cambió."],
    ])
    ficha(doc, "CU-10", "Ver, imprimir o descargar el PDF", [
        ["Actor", "Tesorero al emitir o en el historial; administrador al consultar un pago"],
        ["Precondición", "El recibo ya tiene PDF. La sesión sigue siendo válida, porque el archivo no se abre con un enlace público sin token."],
        ["Flujo principal", "1. El sistema pide el PDF con el token. 2. Lo muestra en un cuadro de vista previa. 3. La persona imprime o descarga el archivo."],
        ["Flujos alternos", "Si el PDF no carga, el cuadro informa el fallo y no cierra el resto de la pantalla."],
        ["Postcondición", "El comprobante se vio, se imprimió o se guardó, y el recibo en la base no cambia."],
    ])
    ficha(doc, "CU-11", "Cerrar sesión", [
        ["Actor", "Administrador o tesorero"],
        ["Precondición", "Hay una sesión abierta."],
        ["Flujo principal", "1. Pulsa Salir. 2. El navegador borra el token. 3. Cualquier intento de abrir el tablero regresa a Entrar."],
        ["Flujos alternos", "Si el servidor ya no acepta el token, Salir igual limpia el navegador."],
        ["Postcondición", "No queda sesión local. Hace falta volver a identificarse."],
    ])

    heading(doc, "5.4 Diagrama de actividades", 1)
    paragraph(
        doc,
        "El proceso principal de la ventanilla es emitir el recibo. No basta con capturar un monto: el sistema exige beneficiario, vivienda, chorro activo y una deuda real. La tarifa anual se cobra por los años que faltan, desde el año de inicio de la vivienda hasta el año en curso, a razón de la tarifa vigente por cada chorro. La compra del chorro se cobra una sola vez, por el precio guardado en ese chorro. Si el total no es mayor que cero, el botón Emitir no se habilita.",
    )
    figure(doc, imgs["act"], "5.4", "Actividad de emisión del recibo en ventanilla")

    heading(doc, "5.5 Diagrama de secuencias", 1)
    paragraph(
        doc,
        "En el tiempo, el tesorero no escribe en la base. La pantalla pide los pendientes, luego envía el cobro. La API comprueba el rol tesorero. El servicio de facturación calcula el total, reserva el siguiente número del año y, dentro de una transacción, guarda el recibo, el detalle del pago y el PDF. La respuesta regresa el recibo y el archivo para la vista previa. Así se evita mostrar un número que todavía no está guardado.",
    )
    figure(doc, imgs["seq"], "5.5", "Secuencia del cobro y de la entrega del PDF")

    heading(doc, "5.6 Diagrama de componentes", 1)
    paragraph(
        doc,
        "La interfaz está partida por función, no por un solo archivo enorme. Todas esas pantallas salen por el mismo cliente HTTP, que adjunta el token. Del otro lado, las rutas se agrupan en autenticación, padrón, facturación y reportes. Esas rutas no calculan el recibo: delegan en servicios. Los servicios usan TypeORM para PostgreSQL y, cuando corresponde, pdf-lib más la carpeta de archivos.",
    )
    figure(doc, imgs["comp"], "5.6", "Componentes del frontend y del backend")
    table(
        doc,
        ["Componente", "Depende de", "No debe hacer"],
        [
            ["Pantallas Next.js", "api.ts", "Calcular el correlativo ni firmar el JWT"],
            ["api.ts", "API Express", "Guardar la contraseña"],
            ["Rutas Express", "Middleware de rol y servicios", "Armar el PDF en la ruta"],
            ["FacturacionService", "TypeORM, ConfigService y PdfService", "Decidir qué ve el menú"],
            ["PdfService", "pdf-lib y el disco", "Cobrar de nuevo un año ya pagado"],
        ],
    )

    heading(doc, "5.7 Diagrama de objetos", 1)
    paragraph(
        doc,
        "La figura muestra un instante concreto: el tesorero ya cobró la tarifa 2026 de un chorro. El beneficiario vive en una vivienda, esa vivienda tiene un chorro, el recibo 2026-002 documenta el pago del año y el PDF queda pegado a ese recibo. Los montos de ejemplo usan la tarifa base de Q 120.00 por chorro y el precio de compra de referencia de Q 1,500.00, que en el sistema se guarda en cada chorro y no como un único precio fijo para toda la aldea.",
    )
    figure(doc, imgs["obj"], "5.7", "Objetos de un cobro de tarifa anual ya emitido")

    heading(doc, "5.8 Diagrama de clases", 1)
    paragraph(
        doc,
        "Las clases de dominio siguen las entidades que TypeORM mapea a tablas. No concentran la lógica del cobro: esa vive en los servicios. Aun así, las relaciones están en las clases. Un beneficiario posee viviendas; una vivienda tiene chorros y recibos; un recibo lo emite un perfil tesorero y puede tener varios pagos anuales, un pago de compra y un solo PDF. La configuración guarda la tarifa y el lugar de pago, y recuerda qué perfil la actualizó.",
    )
    figure(doc, imgs["cls"], "5.8", "Clases de dominio y sus relaciones principales")
    paragraph(
        doc,
        "Los servicios que operan sobre esas clases son AuthService (entrar, registrar cuenta de personal y restablecer clave), UsuariosService (padrón, vivienda y chorro), FacturacionService (pendientes, correlativo, cobro y lectura del PDF), PdfService (armar el recibo), ReportesService (tablas y PDF de reportes) y ConfigService (leer y cambiar la tarifa).",
    )

    heading(doc, "5.9 Diagrama de estados", 1)
    paragraph(
        doc,
        "La entidad con el ciclo más visible para quien opera el sistema es la sesión. Nace anónima en la pantalla Entrar. Con un login válido pasa a autenticada y el menú depende del rol. Salir la cierra. Si el token venció, la firma no coincide o el perfil ya no existe, el servidor responde 401: la sesión se considera inválida y el navegador vuelve a anónima, sin dejar el tablero abierto con un error encima. El beneficiario, por su parte, permanece activo hasta que el administrador lo desactiva; el año de tarifa pasa de pendiente a pagado cuando el recibo correspondiente queda guardado, y no regresa a pendiente.",
    )
    figure(doc, imgs["est"], "5.9", "Estados de la sesión de un usuario del sistema")

    heading(doc, "5.10 Diagrama de colaboración", 1)
    paragraph(
        doc,
        "El diagrama de colaboración muestra los mismos participantes del cobro, pero enfatiza quién está ligado a quién y no la línea de tiempo. El tesorero colabora solo con la pantalla. La pantalla colabora con la ruta de facturación. Esa ruta colabora con el servicio, y el servicio colabora a la vez con el generador de PDF y con la base. El número del mensaje indica el orden, igual que en la secuencia: primero se pide el cobro, después se valida, después se dibuja el PDF y al final se confirma el guardado.",
    )
    figure(doc, imgs["col"], "5.10", "Colaboración de objetos durante la emisión del recibo")

    heading(doc, "5.11 Diagrama entidad-relación", 1)
    paragraph(
        doc,
        "El modelo de datos tiene nueve tablas. perfiles guarda a quien opera el sistema. usuarios_comunidad es el padrón, distinto del personal. Una persona puede tener varias viviendas y cada vivienda, varios chorros. El recibo pertenece a una vivienda y a quien lo emitió. El pago anual une un recibo, un chorro y un año, y no permite cobrar dos veces el mismo chorro en el mismo año. La compra del chorro también cuelga del recibo. El PDF es uno por recibo. La configuración es una tabla de claves, no una fila única rígida, para guardar la tarifa anual y el lugar de pago.",
    )
    figure(doc, imgs["er"], "5.11", "Modelo entidad-relación de AquaPay")
    paragraph(doc, "El diccionario siguiente resume los campos que sostienen el cobro. Los identificadores son UUID, salvo el consecutivo de configuración.", space_after=6)
    table(
        doc,
        ["Tabla", "Campo", "Tipo", "Regla"],
        [
            ["perfiles", "dpi", "varchar(20)", "Único. Identifica al personal."],
            ["perfiles", "rol", "rol_sistema", "administrador o tesorero."],
            ["perfiles", "password_hash", "varchar(255)", "bcrypt. No se expone en la API."],
            ["usuarios_comunidad", "dpi", "varchar(20)", "Único. 13 dígitos en la ventanilla."],
            ["usuarios_comunidad", "activo", "boolean", "Si está inactivo, no se le cobra."],
            ["viviendas", "usuario_id", "uuid", "Obligatorio. No se borra la persona si tiene vivienda."],
            ["viviendas", "anio_inicio_cobro", "entero", "Primer año que puede quedar pendiente."],
            ["chorros", "cantidad", "entero", "Mayor que cero. Multiplica la tarifa."],
            ["chorros", "precio_compra", "numeric(12,2)", "Se cobra una vez, si todavía no hay pago de compra."],
            ["recibos", "numero_recibo", "varchar(20)", "Único. Correlativo del año, con ceros a la izquierda."],
            ["recibos", "secuencia", "entero", "Única junto con anio_recibo."],
            ["recibos", "tipo_cobro", "varchar(30)", "tarifa_anual o compra_chorro."],
            ["recibos", "total_pagado", "numeric(12,2)", "Cero o más. En la práctica el cobro exige un total mayor que cero."],
            ["recibos", "cantidad_en_letras", "text", "Monto escrito para el recibo."],
            ["pagos_anuales", "chorro_id + anio", "uuid + entero", "Únicos juntos. Evitan el doble cobro del año."],
            ["recibos_pdf", "recibo_id", "uuid", "Único. Un archivo por recibo."],
            ["configuracion", "clave", "varchar(80)", "Única. tarifa_anual y lugar_pago."],
        ],
    )

    heading(doc, "5.12 Diagramas de infraestructura", 1)
    paragraph(
        doc,
        "En operación, la ventanilla necesita un equipo con navegador. Ese equipo habla con el servidor de la interfaz, en el puerto 3000 durante el desarrollo, y este con la API en el puerto 4100. La API es el único componente que abre la base. PostgreSQL está en Neon, con conexión cifrada, de modo que el padrón no vive solo en la computadora de la ventanilla. Los PDF se escriben además en la carpeta uploads/recibos del servidor de la API. Conviene respaldar las dos cosas: la base y esa carpeta. Si se pierde el disco y no la base, el recibo sigue existiendo pero el archivo hay que regenerarlo; si se pierde la base, el archivo suelto ya no tiene dueño.",
    )
    figure(doc, imgs["inf"], "5.12", "Infraestructura de ventanilla, aplicación, API y base de datos")
    table(
        doc,
        ["Elemento", "Qué aporta", "Requisito mínimo"],
        [
            ["Equipo de ventanilla", "Operar el cobro y ver el PDF", "Navegador actual; también usable en teléfono"],
            ["Servidor Node.js", "Interfaz y API", "Node.js capaz de correr Next.js 15 y Express"],
            ["PostgreSQL", "Padrón, recibos y configuración", "Neon u otro PostgreSQL con SSL"],
            ["Disco del API", "PDF de recibos y de reportes", "Carpeta con permiso de escritura"],
            ["Red", "Unir ventanilla, API y Neon", "Salida a internet si la base está en la nube"],
        ],
    )
    paragraph(
        doc,
        "Con este diseño, el capítulo deja trazada la solución que AquaPay implementa: capas separadas, dos actores de ventanilla, un cobro que no se duplica y un comprobante que se puede ver, imprimir y descargar sin depender de un enlace público.",
    )
    doc.save(OUT)
    return OUT


if __name__ == "__main__":
    images = build_images()
    path = build_doc(images)
    print(path)

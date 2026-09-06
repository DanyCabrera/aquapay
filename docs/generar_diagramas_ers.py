# -*- coding: utf-8 -*-
"""Genera diagramas PNG para la ERS de AquaPay (Pillow)."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

OUT = r"C:\Users\Usuario\Desktop\aquapay\docs\ers_diagramas"
os.makedirs(OUT, exist_ok=True)

BG = (255, 255, 255)
INK = (20, 20, 20)
MUTED = (90, 90, 90)
BOX = (245, 245, 247)
BORDER = (30, 30, 30)
ACCENT = (15, 15, 15)
SOFT = (232, 232, 236)
BLUE = (37, 99, 235)
GREEN = (22, 163, 74)
ORANGE = (234, 88, 12)
PURPLE = (124, 58, 237)


def font(size=14, bold=False):
    candidates = [
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibri.ttf",
    ]
    if bold:
        candidates = [
            r"C:\Windows\Fonts\segoeuib.ttf",
            r"C:\Windows\Fonts\arialbd.ttf",
            r"C:\Windows\Fonts\calibrib.ttf",
        ] + candidates
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


F = font(13)
FB = font(14, True)
FS = font(11)
FT = font(16, True)


def new(w, h):
    img = Image.new("RGB", (w, h), BG)
    return img, ImageDraw.Draw(img)


def text_size(draw, text, fnt):
    b = draw.textbbox((0, 0), text, font=fnt)
    return b[2] - b[0], b[3] - b[1]


def wrap(draw, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if text_size(draw, trial, fnt)[0] <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def box(draw, xy, text, fill=BOX, border=BORDER, fnt=F, radius=8, pad=10, title=None):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=border, width=2)
    cx = (x1 + x2) / 2
    content = text if isinstance(text, list) else wrap(draw, text, fnt, x2 - x1 - 2 * pad)
    total_h = 0
    lines_draw = []
    if title:
        lines_draw.append((title, FB, ACCENT))
        total_h += text_size(draw, title, FB)[1] + 6
    for line in content:
        lines_draw.append((line, fnt, INK))
        total_h += text_size(draw, line, fnt)[1] + 3
    y = y1 + (y2 - y1 - total_h) / 2
    for line, lf, color in lines_draw:
        tw, th = text_size(draw, line, lf)
        draw.text((cx - tw / 2, y), line, fill=color, font=lf)
        y += th + 3


def actor(draw, cx, cy, label):
    r = 14
    draw.ellipse((cx - r, cy - 50, cx + r, cy - 50 + 2 * r), outline=INK, width=2)
    draw.line((cx, cy - 50 + 2 * r, cx, cy + 10), fill=INK, width=2)
    draw.line((cx - 22, cy - 10, cx + 22, cy - 10), fill=INK, width=2)
    draw.line((cx, cy + 10, cx - 16, cy + 40), fill=INK, width=2)
    draw.line((cx, cy + 10, cx + 16, cy + 40), fill=INK, width=2)
    tw, _ = text_size(draw, label, FB)
    draw.text((cx - tw / 2, cy + 48), label, fill=INK, font=FB)


def arrow(draw, a, b, color=INK):
    draw.line((a, b), fill=color, width=2)
    # simple arrow head
    x1, y1 = a
    x2, y2 = b
    import math
    ang = math.atan2(y2 - y1, x2 - x1)
    for da in (2.7, -2.7):
        lx = x2 - 10 * math.cos(ang + da)
        ly = y2 - 10 * math.sin(ang + da)
        draw.line((x2, y2, lx, ly), fill=color, width=2)


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path, "PNG")
    print("OK", path)
    return path


# ---------- 1. Casos de uso ----------
def fig_casos_uso():
    img, d = new(1100, 720)
    d.text((40, 20), "Figura 1. Diagrama de casos de uso — AquaPay", fill=INK, font=FT)
    # system boundary
    d.rounded_rectangle((260, 70, 860, 680), radius=12, outline=BORDER, width=2)
    tw, _ = text_size(d, "Sistema AquaPay", FB)
    d.text((560 - tw / 2, 82), "Sistema AquaPay", fill=ACCENT, font=FB)

    actor(d, 110, 280, "Administrador")
    actor(d, 990, 280, "Tesorero")

    usecases = [
        (360, 130, "Iniciar sesión"),
        (560, 130, "Consultar dashboard"),
        (360, 210, "Registrar beneficiario"),
        (560, 210, "Gestionar viviendas/chorros"),
        (360, 290, "Actualizar tarifa anual"),
        (560, 290, "Consultar historial de pagos"),
        (460, 370, "Generar reportes PDF"),
        (700, 210, "Consultar años pendientes"),
        (700, 290, "Cobrar tarifa anual"),
        (700, 370, "Cobrar compra de chorro"),
        (700, 450, "Emitir recibo PDF"),
    ]
    for x, y, label in usecases:
        box(d, (x, y, x + 200, y + 48), label, fill=SOFT, fnt=FS)

    # links admin
    for y in (154, 234, 314, 394):
        arrow(d, (150, 280), (360, y))
    arrow(d, (150, 280), (560, 154))
    arrow(d, (150, 280), (560, 234))
    arrow(d, (150, 280), (560, 314))

    # links tesorero
    arrow(d, (950, 280), (560, 154))
    for y in (234, 314, 394, 474):
        arrow(d, (950, 280), (700, y))
    # include
    d.line((800, 314, 800, 450), fill=MUTED, width=1)
    d.text((805, 370), "<<incluye>>", fill=MUTED, font=FS)
    d.line((800, 394, 800, 450), fill=MUTED, width=1)
    save(img, "01_casos_uso.png")


# ---------- 2. Arquitectura ----------
def fig_arquitectura():
    img, d = new(1100, 640)
    d.text((40, 20), "Figura 2. Arquitectura del sistema AquaPay", fill=INK, font=FT)

    layers = [
        (40, 80, 1060, 170, "Cliente", "Next.js 15 + React 19 + Tailwind + shadcn/ui", SOFT),
        (40, 200, 1060, 290, "API", "Express 4 + TypeORM + class-validator + jose (JWT)", (220, 235, 255)),
        (40, 320, 520, 470, "Supabase Auth", "Login DPI/contraseña · JWT · JWKS", (232, 245, 233)),
        (540, 320, 1060, 470, "PostgreSQL (Supabase)", "9 tablas · integridad referencial", (255, 243, 224)),
        (40, 500, 520, 600, "Supabase Storage", "Bucket privado 'recibos' · URL firmada", (243, 232, 255)),
        (540, 500, 1060, 600, "PDF", "pdf-lib · firma P12 opcional", (255, 235, 238)),
    ]
    for x1, y1, x2, y2, title, body, fill in layers:
        box(d, (x1, y1, x2, y2), body, fill=fill, title=title, fnt=F)

    # arrows between layers
    for x in (300, 800):
        arrow(d, (x, 170), (x, 200))
        arrow(d, (x, 290), (x, 320))
    arrow(d, (280, 470), (280, 500))
    arrow(d, (800, 470), (800, 500))
    d.text((40, 615), "Comunicación: HTTPS · Authorization: Bearer JWT · Respuestas { success, data }", fill=MUTED, font=FS)
    save(img, "02_arquitectura.png")


# ---------- 3. Secuencia cobro ----------
def fig_secuencia():
    img, d = new(1100, 720)
    d.text((40, 16), "Figura 3. Diagrama de secuencia — emisión de recibo (tarifa anual)", fill=INK, font=FT)

    actors = [
        (90, "Tesorero"),
        (290, "Cliente"),
        (510, "API"),
        (730, "PostgreSQL"),
        (950, "Storage"),
    ]
    for x, name in actors:
        box(d, (x - 60, 50, x + 60, 90), name, fill=SOFT, fnt=FS)
        d.line((x, 90, x, 690), fill=SOFT, width=2)

    steps = [
        (90, 290, 130, "Selecciona beneficiario"),
        (290, 510, 165, "GET /usuarios + /pendientes"),
        (510, 730, 200, "Consulta vivienda/chorros/pagos"),
        (730, 510, 235, "Años pendientes"),
        (510, 290, 270, "Deuda + siguiente recibo"),
        (90, 290, 320, "Confirma año y fecha"),
        (290, 510, 355, "POST /cobrar/tarifa-anual"),
        (510, 730, 400, "BEGIN + INSERT recibo/pagos"),
        (510, 950, 445, "Sube PDF"),
        (950, 510, 490, "URL firmada"),
        (510, 730, 535, "INSERT recibos_pdf + COMMIT"),
        (510, 290, 580, "201 + PDF base64"),
        (290, 90, 625, "Descarga comprobante"),
    ]
    for x1, x2, y, label in steps:
        # dashed return if going left
        if x2 < x1:
            # draw dashed
            x = x1
            while x > x2:
                d.line((x, y, max(x - 8, x2), y), fill=MUTED, width=1)
                x -= 14
        else:
            arrow(d, (x1, y), (x2, y))
        # label above
        mid = (x1 + x2) / 2
        tw, th = text_size(d, label, FS)
        d.text((mid - tw / 2, y - 18), label, fill=INK, font=FS)
    save(img, "03_secuencia.png")


# ---------- 4. Flujo facturación ----------
def fig_flujo():
    img, d = new(900, 980)
    d.text((40, 16), "Figura 4. Diagrama de flujo — facturación", fill=INK, font=FT)

    def diamond(cx, cy, w, h, text):
        pts = [(cx, cy - h // 2), (cx + w // 2, cy), (cx, cy + h // 2), (cx - w // 2, cy)]
        d.polygon(pts, fill=(255, 248, 225), outline=BORDER)
        lines = wrap(d, text, FS, w - 30)
        total = sum(text_size(d, ln, FS)[1] + 2 for ln in lines)
        y = cy - total / 2
        for ln in lines:
            tw, th = text_size(d, ln, FS)
            d.text((cx - tw / 2, y), ln, fill=INK, font=FS)
            y += th + 2

    def oval(xy, text, fill=(232, 245, 233)):
        d.ellipse(xy, fill=fill, outline=BORDER, width=2)
        x1, y1, x2, y2 = xy
        tw, th = text_size(d, text, FB)
        d.text(((x1 + x2) / 2 - tw / 2, (y1 + y2) / 2 - th / 2), text, fill=INK, font=FB)

    cx = 450
    oval((cx - 80, 50, cx + 80, 100), "Inicio")
    arrow(d, (cx, 100), (cx, 130))
    box(d, (cx - 140, 130, cx + 140, 180), "Buscar y seleccionar beneficiario", fill=SOFT)
    arrow(d, (cx, 180), (cx, 210))
    box(d, (cx - 140, 210, cx + 140, 270), "Autocompletar datos y cargar años pendientes", fill=SOFT)
    arrow(d, (cx, 270), (cx, 310))
    diamond(cx, 360, 240, 90, "¿Hay deuda o compra pendiente?")
    # No
    d.line((cx + 120, 360, cx + 260, 360), fill=INK, width=2)
    d.line((cx + 260, 360, cx + 260, 900), fill=INK, width=2)
    d.text((cx + 130, 340), "No", fill=MUTED, font=FS)
    box(d, (cx + 170, 880, cx + 350, 930), "Informar: sin pendiente", fill=(255, 235, 238))
    # Yes
    arrow(d, (cx, 405), (cx, 450))
    d.text((cx + 8, 420), "Sí", fill=MUTED, font=FS)
    box(d, (cx - 160, 450, cx + 160, 510), "Elegir tipo: tarifa anual o compra de chorro", fill=SOFT)
    arrow(d, (cx, 510), (cx, 545))
    box(d, (cx - 160, 545, cx + 160, 605), "Ingresar año/fecha · total automático", fill=SOFT)
    arrow(d, (cx, 605), (cx, 640))
    diamond(cx, 690, 220, 80, "¿Validación OK?")
    d.line((cx - 110, 690, cx - 250, 690), fill=INK, width=2)
    d.line((cx - 250, 690, cx - 250, 545), fill=INK, width=2)
    arrow(d, (cx - 250, 545), (cx - 160, 575))
    d.text((cx - 240, 670), "No", fill=MUTED, font=FS)
    arrow(d, (cx, 730), (cx, 770))
    d.text((cx + 8, 745), "Sí", fill=MUTED, font=FS)
    box(d, (cx - 160, 770, cx + 160, 840), "Emitir recibo · PDF · correlativo", fill=(220, 235, 255))
    arrow(d, (cx, 840), (cx, 880))
    oval((cx - 80, 880, cx + 80, 940), "Fin", fill=(220, 235, 255))
    # connect no path to end
    arrow(d, (cx + 260, 930), (cx + 80, 910))
    save(img, "04_flujo.png")


# ---------- 5. ER ----------
def fig_er():
    img, d = new(1200, 780)
    d.text((40, 16), "Figura 5. Modelo entidad-relación (esquema actual)", fill=INK, font=FT)

    entities = [
        (40, 60, "perfiles", "id PK\nnombre\ndpi UK\nrol\nactivo"),
        (300, 60, "usuarios_comunidad", "id PK\nnombre_completo\ndpi UK\ntelefono\nactivo"),
        (620, 60, "viviendas", "id PK\nusuario_id FK\ndireccion\nanio_inicio_cobro\nactiva"),
        (920, 60, "chorros", "id PK\nvivienda_id FK\nprecio_compra\ncantidad\nactivo"),
        (180, 320, "configuracion", "id PK\nclave UK\nvalor\nactualizado_por FK"),
        (480, 320, "recibos", "id PK\nnumero_recibo UK\nanio_recibo+secuencia UK\nvivienda_id FK\ntipo_cobro\ntotal_pagado\ncreado_por FK"),
        (40, 560, "pagos_anuales", "id PK\nrecibo_id FK\nchorro_id FK\nanio\nUNIQUE(chorro,anio)"),
        (400, 560, "pagos_compra_chorro", "id PK\nrecibo_id FK\nchorro_id FK\nmonto_pagado"),
        (780, 560, "recibos_pdf", "id PK\nrecibo_id UK\nnombre_archivo\nruta_storage\nurl_publica"),
    ]
    for x, y, title, body in entities:
        lines = body.split("\n")
        h = 36 + len(lines) * 18
        # header
        d.rounded_rectangle((x, y, x + 240, y + h), radius=6, fill=BG, outline=BORDER, width=2)
        d.rectangle((x, y, x + 240, y + 28), fill=ACCENT)
        tw, _ = text_size(d, title, FS)
        d.text((x + 120 - tw / 2, y + 6), title, fill=BG, font=FS)
        yy = y + 34
        for ln in lines:
            d.text((x + 10, yy), ln, fill=INK, font=FS)
            yy += 18

    # relations labels
    rels = [
        ((420, 150), (620, 120), "1:N"),
        ((740, 150), (920, 120), "1:N"),
        ((600, 250), (600, 320), "1:N"),
        ((160, 180), (280, 320), "1:N"),
        ((160, 180), (480, 350), "emite"),
        ((520, 450), (160, 560), "1:N"),
        ((600, 450), (520, 560), "1:N"),
        ((700, 450), (880, 560), "1:1"),
        ((920, 220), (160, 560), ""),
        ((920, 220), (520, 560), ""),
    ]
    for a, b, lab in rels:
        d.line((a, b), fill=MUTED, width=1)
        if lab:
            mx, my = (a[0] + b[0]) // 2, (a[1] + b[1]) // 2
            d.text((mx, my - 12), lab, fill=MUTED, font=FS)

    d.text((40, 740), "Nota: cobro anual por chorro (no mensual). MFA en perfiles está reservado, no implementado.", fill=MUTED, font=FS)
    save(img, "05_er.png")


# ---------- 6. Despliegue ----------
def fig_despliegue():
    img, d = new(1100, 520)
    d.text((40, 16), "Figura 6. Vista de despliegue", fill=INK, font=FT)
    nodes = [
        (60, 100, 300, 220, "Usuario", "Navegador web\nChrome / Edge / Firefox"),
        (400, 80, 700, 200, "Vercel", "Frontend Next.js\nHTTPS"),
        (400, 240, 700, 360, "Render", "API Express\nNode.js 22"),
        (780, 80, 1040, 200, "Supabase Auth", "JWT / JWKS"),
        (780, 220, 1040, 340, "Supabase DB", "PostgreSQL"),
        (780, 360, 1040, 470, "Supabase Storage", "Bucket recibos"),
    ]
    for x1, y1, x2, y2, title, body in nodes:
        box(d, (x1, y1, x2, y2), body.split("\n"), fill=SOFT, title=title, fnt=F)

    arrow(d, (300, 160), (400, 140))
    arrow(d, (550, 200), (550, 240))
    arrow(d, (700, 160), (780, 140))
    arrow(d, (700, 300), (780, 280))
    arrow(d, (700, 320), (780, 400))
    d.text((40, 490), "GitHub Actions: lint + build frontend · tsc backend (CI)", fill=MUTED, font=FS)
    save(img, "06_despliegue.png")


# ---------- 7. Contexto ----------
def fig_contexto():
    img, d = new(1000, 480)
    d.text((40, 16), "Figura 7. Diagrama de contexto", fill=INK, font=FT)
    box(d, (380, 180, 620, 300), ["AquaPay", "Sistema web de cobro"], fill=ACCENT, border=ACCENT, fnt=FB)
    # overwrite text in white
    d.rounded_rectangle((380, 180, 620, 300), radius=8, fill=ACCENT, outline=ACCENT)
    for i, line in enumerate(["AquaPay", "Sistema web de cobro"]):
        tw, th = text_size(d, line, FB if i == 0 else FS)
        d.text((500 - tw / 2, 210 + i * 28), line, fill=BG, font=FB if i == 0 else FS)

    externals = [
        (60, 80, 260, 160, "Administrador"),
        (60, 300, 260, 380, "Tesorero"),
        (740, 60, 960, 150, "Supabase Auth"),
        (740, 180, 960, 270, "PostgreSQL"),
        (740, 300, 960, 390, "Storage PDF"),
    ]
    for x1, y1, x2, y2, t in externals:
        box(d, (x1, y1, x2, y2), t, fill=SOFT)
    arrow(d, (260, 120), (380, 220))
    arrow(d, (260, 340), (380, 260))
    arrow(d, (620, 220), (740, 105))
    arrow(d, (620, 240), (740, 225))
    arrow(d, (620, 270), (740, 345))
    save(img, "07_contexto.png")


if __name__ == "__main__":
    fig_casos_uso()
    fig_arquitectura()
    fig_secuencia()
    fig_flujo()
    fig_er()
    fig_despliegue()
    fig_contexto()
    print("DONE")

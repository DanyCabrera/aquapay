# -*- coding: utf-8 -*-
"""Genera diagramas de actividades y de estado para el ERS AquaPay."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

OUT = r"C:\Users\Usuario\Desktop\aquapay\docs\ers_diagramas"
os.makedirs(OUT, exist_ok=True)

INK = (20, 20, 20)
MUTED = (100, 100, 100)
SOFT = (245, 245, 247)
ACCENT = (30, 30, 30)
YELLOW = (255, 248, 220)
GREEN = (232, 245, 233)
BLUE = (227, 242, 253)
ORANGE = (255, 236, 220)
# aliases used in diagrams
YELLOW_F = YELLOW
GREEN_F = GREEN
BLUE_F = BLUE
ORANGE_F = ORANGE


def font(size=13, bold=False):
    cands = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for p in cands:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


F = font(12)
FB = font(13, True)
FS = font(11)
FT = font(15, True)


def tsize(d, text, fnt):
    b = d.textbbox((0, 0), text, font=fnt)
    return b[2] - b[0], b[3] - b[1]


def wrap(d, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if tsize(d, trial, fnt)[0] <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def rounded(d, xy, fill=SOFT, outline=ACCENT, r=8):
    d.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=2)


def center_text(d, xy, text, fnt=F, fill=INK):
    x1, y1, x2, y2 = xy
    lines = text if isinstance(text, list) else wrap(d, text, fnt, x2 - x1 - 16)
    total = sum(tsize(d, ln, fnt)[1] + 2 for ln in lines)
    y = y1 + (y2 - y1 - total) / 2
    cx = (x1 + x2) / 2
    for ln in lines:
        tw, th = tsize(d, ln, fnt)
        d.text((cx - tw / 2, y), ln, fill=fill, font=fnt)
        y += th + 2


def oval(d, xy, text, fill=GREEN):
    d.ellipse(xy, fill=fill, outline=ACCENT, width=2)
    center_text(d, xy, text, FB)


def diamond(d, cx, cy, w, h, text, fill=YELLOW):
    pts = [(cx, cy - h // 2), (cx + w // 2, cy), (cx, cy + h // 2), (cx - w // 2, cy)]
    d.polygon(pts, fill=fill, outline=ACCENT)
    lines = wrap(d, text, FS, w - 40)
    total = sum(tsize(d, ln, FS)[1] + 2 for ln in lines)
    y = cy - total / 2
    for ln in lines:
        tw, th = tsize(d, ln, FS)
        d.text((cx - tw / 2, y), ln, fill=INK, font=FS)
        y += th + 2


def arrow(d, a, b, color=INK):
    import math
    d.line((a, b), fill=color, width=2)
    ang = math.atan2(b[1] - a[1], b[0] - a[0])
    for da in (2.6, -2.6):
        lx = b[0] - 10 * math.cos(ang + da)
        ly = b[1] - 10 * math.sin(ang + da)
        d.line((b[0], b[1], lx, ly), fill=color, width=2)


def box(d, xy, text, fill=SOFT, fnt=F):
    rounded(d, xy, fill=fill)
    center_text(d, xy, text, fnt)


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path, "PNG")
    print("OK", path)
    return path


# ---------- Diagrama de actividades: emisión de recibo ----------
def actividad():
    img = Image.new("RGB", (920, 1100), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((40, 20), "Diagrama de actividades — Emisión de recibo (AquaPay)", fill=INK, font=FT)

    # swimlanes
    d.line((40, 70, 880, 70), fill=MUTED, width=1)
    d.text((80, 78), "Tesorero", fill=MUTED, font=FS)
    d.text((400, 78), "Sistema AquaPay", fill=MUTED, font=FS)
    d.text((700, 78), "Supabase", fill=MUTED, font=FS)
    d.line((300, 70, 300, 1060), fill=(220, 220, 220), width=1)
    d.line((620, 70, 620, 1060), fill=(220, 220, 220), width=1)

    cx = 450
    oval(d, (cx - 55, 110, cx + 55, 155), "Inicio")
    arrow(d, (cx, 155), (cx, 185))

    box(d, (120, 185, 280, 245), "Seleccionar\nbeneficiario", BLUE)
    arrow(d, (280, 215), (350, 215))
    box(d, (350, 185, 550, 245), "Autocompletar datos\ny cargar pendientes", SOFT)
    arrow(d, (cx, 245), (cx, 285))

    diamond(d, cx, 340, 220, 90, "¿Hay deuda o compra pendiente?")
    # No
    d.line((cx + 110, 340, cx + 250, 340), fill=INK, width=2)
    d.line((cx + 250, 340, cx + 250, 980), fill=INK, width=2)
    d.text((cx + 120, 318), "No", fill=MUTED, font=FS)
    box(d, (cx + 170, 960, cx + 330, 1010), "Informar sin pendiente", ORANGE)
    arrow(d, (cx + 250, 1010), (cx + 55, 1020))

    # Sí
    arrow(d, (cx, 385), (cx, 430))
    d.text((cx + 8, 400), "Sí", fill=MUTED, font=FS)
    box(d, (350, 430, 550, 500), "Elegir tipo de cobro\n(tarifa / compra)", SOFT)
    arrow(d, (cx, 500), (cx, 540))
    box(d, (350, 540, 550, 610), "Ingresar año/fecha\nTotal automático", SOFT)
    arrow(d, (cx, 610), (cx, 650))

    diamond(d, cx, 710, 200, 80, "¿Validación OK?")
    d.line((cx - 100, 710, cx - 200, 710), fill=INK, width=2)
    d.line((cx - 200, 710, cx - 200, 540), fill=INK, width=2)
    arrow(d, (cx - 200, 540), (cx - 150, 575))
    d.text((cx - 190, 688), "No", fill=MUTED, font=FS)

    arrow(d, (cx, 750), (cx, 790))
    d.text((cx + 8, 765), "Sí", fill=MUTED, font=FS)
    box(d, (350, 790, 550, 860), "Emitir recibo\n(transacción)", SOFT)
    arrow(d, (550, 825), (680, 825))
    box(d, (680, 790, 850, 860), "Guardar PDF\nen Storage", GREEN)
    arrow(d, (cx, 860), (cx, 900))
    box(d, (350, 900, 550, 960), "Entregar PDF\nal tesorero", BLUE)
    arrow(d, (cx, 960), (cx, 1000))
    oval(d, (cx - 55, 1000, cx + 55, 1050), "Fin", BLUE)

    save(img, "08_actividades.png")


# ---------- Diagrama de estado: recibo / beneficiario / sesión ----------
def estado():
    img = Image.new("RGB", (1100, 720), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((40, 18), "Diagrama de estados — AquaPay", fill=INK, font=FT)

    # ---- Beneficiario ----
    d.text((40, 55), "A) Beneficiario (padrón)", fill=INK, font=FB)
    # initial
    d.ellipse((70, 120, 95, 145), fill=INK)
    arrow(d, (95, 132), (140, 132))
    box(d, (140, 100, 300, 165), "Activo", GREEN)
    arrow(d, (300, 132), (360, 132))
    d.text((310, 110), "desactivar", fill=MUTED, font=FS)
    box(d, (360, 100, 520, 165), "Inactivo", ORANGE)
    arrow(d, (440, 165), (440, 200))
    arrow(d, (440, 200), (220, 200))
    arrow(d, (220, 200), (220, 165))
    d.text((280, 180), "activar", fill=MUTED, font=FS)
    # final from inactivo optional
    arrow(d, (520, 132), (560, 132))
    d.ellipse((560, 120, 585, 145), outline=INK, width=3)
    d.ellipse((565, 125, 580, 140), fill=INK)
    d.text((595, 122), "baja lógica\n(sin borrado)", fill=MUTED, font=FS)

    # ---- Chorro ----
    d.text((40, 240), "B) Chorro", fill=INK, font=FB)
    d.ellipse((70, 300, 95, 325), fill=INK)
    arrow(d, (95, 312), (140, 312))
    box(d, (140, 280, 300, 345), "Activo\n(genera deuda)", GREEN)
    arrow(d, (300, 312), (360, 312))
    d.text((305, 290), "desactivar", fill=MUTED, font=FS)
    box(d, (360, 280, 540, 345), "Inactivo\n(no genera deuda)", ORANGE)
    # compra
    d.ellipse((70, 400, 95, 425), fill=INK)
    arrow(d, (95, 412), (160, 412))
    box(d, (160, 380, 340, 445), "Compra pendiente", YELLOW)
    arrow(d, (340, 412), (420, 412))
    d.text((345, 390), "cobrar compra", fill=MUTED, font=FS)
    box(d, (420, 380, 600, 445), "Compra pagada", GREEN)
    arrow(d, (600, 412), (650, 412))
    d.ellipse((650, 400, 675, 425), outline=INK, width=3)
    d.ellipse((655, 405, 670, 420), fill=INK)

    # ---- Recibo / cobro ----
    d.text((40, 480), "C) Proceso de cobro (recibo)", fill=INK, font=FB)
    d.ellipse((70, 560, 95, 585), fill=INK)
    arrow(d, (95, 572), (150, 572))
    box(d, (150, 540, 300, 605), "Borrador\n(formulario)", SOFT)
    arrow(d, (300, 572), (360, 572))
    d.text((310, 550), "validar", fill=MUTED, font=FS)
    box(d, (360, 540, 520, 605), "Validado", BLUE)
    arrow(d, (520, 572), (580, 572))
    d.text((525, 550), "emitir", fill=MUTED, font=FS)
    box(d, (580, 540, 740, 605), "Emitido\n+ PDF", GREEN)
    arrow(d, (740, 572), (800, 572))
    d.ellipse((800, 560, 825, 585), outline=INK, width=3)
    d.ellipse((805, 565, 820, 580), fill=INK)
    d.text((835, 562), "persistido\n(no anulable)", fill=MUTED, font=FS)

    # rejection path
    arrow(d, (440, 540), (440, 500))
    d.line((440, 500, 225, 500), fill=INK, width=2)
    arrow(d, (225, 500), (225, 540))
    d.text((280, 482), "error de validación", fill=MUTED, font=FS)

    # ---- Sesión ----
    d.text((700, 55), "D) Sesión de usuario", fill=INK, font=FB)
    d.ellipse((720, 110, 745, 135), fill=INK)
    arrow(d, (745, 122), (780, 122))
    box(d, (780, 95, 960, 150), "No autenticado", ORANGE)
    arrow(d, (870, 150), (870, 190))
    d.text((880, 160), "login OK", fill=MUTED, font=FS)
    box(d, (780, 190, 960, 250), "Autenticado\n(JWT válido)", GREEN)
    arrow(d, (870, 250), (870, 290))
    d.text((880, 260), "logout / expiración", fill=MUTED, font=FS)
    box(d, (780, 290, 960, 345), "Sesión cerrada\n(cliente)", SOFT)
    arrow(d, (780, 317), (740, 317))
    arrow(d, (740, 317), (740, 122))
    arrow(d, (740, 122), (780, 122))

    d.text(
        (40, 670),
        "Nota: el sistema no implementa anulación de recibos; el estado Emitido es terminal. "
        "MFA existe en esquema pero no cambia estados de sesión.",
        fill=MUTED,
        font=FS,
    )
    save(img, "09_estados.png")


if __name__ == "__main__":
    actividad()
    estado()
    print("DONE")

# -*- coding: utf-8 -*-
"""
Aplica la acentuacion ortografica del espanol al documento .docx generado.

El texto se escribe sin tildes en el generador para evitar problemas de
codificacion; este paso las restituye sin tocar identificadores de codigo.

Elementos protegidos (nunca se modifican):
  - Ejecuciones de texto con fuente Consolas (bloques de codigo).
  - Cadenas entre comillas simples: 'pagos_anuales'.
  - Identificadores con punto, guion bajo o barra: facturacion.service.ts.
  - Celdas cuyo contenido completo es un nombre de columna o tabla.
"""

import re
import sys
from docx import Document

DOCX = r"C:\Users\Usuario\Desktop\aquapay\docs\Documentacion-Tecnica-AquaPay.docx"

# Celdas cuyo contenido completo es un identificador de base de datos.
RUNS_PROTEGIDOS = {
    "direccion", "telefono", "anio", "configuracion", "descripcion",
    "(chorro_id, anio)",
}

# Reglas contextuales aplicadas antes del diccionario general.
REGLAS_CONTEXTO = [
    # "esta" verbo frente a "esta" demostrativo
    (r"\besta(?=\s+(?:basado|organizado|implementado|implementada|"
     r"definida|definido|declarada|declarado|disponible|pendiente|vacia|"
     r"restringido|restringida|excluido|excluida|activa|activo)\b)", "está"),
    (r"\bno\s+lo\s+esta\b", "no lo está"),
    (r"\bestan\b", "están"),
    (r"\bque\s+este\s+activo\b", "que esté activo"),
    (r"\bSe\s+desarrollo\s+un\s+sistema\b", "Se desarrolló un sistema"),
    (r"\bque\s+correspondera\s+a\b", "que correspondería a"),
    (r"\bno\s+se\s+prevee\b", "no se prevé"),
]

# Diccionario general: forma sin tilde -> forma acentuada.
PALABRAS = {
    # -cion / -sion
    "accion": "acción", "adopcion": "adopción", "adquisicion": "adquisición",
    "agregacion": "agregación", "administracion": "administración",
    "aplicacion": "aplicación", "asignacion": "asignación",
    "anulacion": "anulación", "autenticacion": "autenticación",
    "autorizacion": "autorización", "automatizacion": "automatización",
    "coleccion": "colección", "combinacion": "combinación",
    "comparacion": "comparación", "compilacion": "compilación",
    "composicion": "composición", "comunicacion": "comunicación",
    "condicion": "condición", "conexion": "conexión",
    "configuracion": "configuración", "confirmacion": "confirmación",
    "conmutacion": "conmutación", "construccion": "construcción",
    "conversion": "conversión", "correccion": "corrección",
    "creacion": "creación", "decision": "decisión",
    "definicion": "definición", "depuracion": "depuración",
    "desactivacion": "desactivación", "descripcion": "descripción",
    "determinacion": "determinación", "deteccion": "detección",
    "direccion": "dirección", "distribucion": "distribución",
    "division": "división", "documentacion": "documentación",
    "edicion": "edición", "ejecucion": "ejecución",
    "eliminacion": "eliminación", "emision": "emisión",
    "evaluacion": "evaluación", "evolucion": "evolución",
    "excepcion": "excepción", "exclusion": "exclusión",
    "expiracion": "expiración", "exportacion": "exportación",
    "expresion": "expresión", "extension": "extensión",
    "facturacion": "facturación", "funcion": "función",
    "generacion": "generación", "gestion": "gestión",
    "identificacion": "identificación", "implantacion": "implantación",
    "implementacion": "implementación", "impresion": "impresión",
    "inclusion": "inclusión", "informacion": "información",
    "instalacion": "instalación", "integracion": "integración",
    "introduccion": "introducción", "invalidacion": "invalidación",
    "inyeccion": "inyección", "justificacion": "justificación",
    "legislacion": "legislación", "limitacion": "limitación",
    "medicion": "medición", "migracion": "migración",
    "navegacion": "navegación", "numeracion": "numeración",
    "omision": "omisión", "opcion": "opción", "operacion": "operación",
    "organizacion": "organización", "paginacion": "paginación",
    "planificacion": "planificación", "precision": "precisión",
    "preparacion": "preparación", "presentacion": "presentación",
    "prevencion": "prevención", "produccion": "producción",
    "programacion": "programación", "proteccion": "protección",
    "provision": "provisión", "proyeccion": "proyección",
    "recaudacion": "recaudación", "recoleccion": "recolección",
    "recomendacion": "recomendación", "recuperacion": "recuperación",
    "redireccion": "redirección", "regeneracion": "regeneración",
    "relacion": "relación", "resolucion": "resolución",
    "restriccion": "restricción", "revalidacion": "revalidación",
    "revision": "revisión", "satisfaccion": "satisfacción",
    "seccion": "sección", "segregacion": "segregación",
    "separacion": "separación", "sesion": "sesión",
    "sincronizacion": "sincronización", "situacion": "situación",
    "solucion": "solución", "supervision": "supervisión",
    "transaccion": "transacción", "ubicacion": "ubicación",
    "validacion": "validación", "version": "versión",
    # -ia / -io acentuados
    "auditoria": "auditoría", "bibliografia": "bibliografía",
    "categoria": "categoría", "cronologia": "cronología",
    "guia": "guía", "ingenieria": "ingeniería",
    "metodologia": "metodología", "tecnologia": "tecnología",
    "tecnologias": "tecnologías", "garantia": "garantía",
    # esdrujulas y otras
    "academica": "académica", "academicas": "académicas",
    "academico": "académico", "acromatica": "acromática",
    "agiles": "ágiles", "ambito": "ámbito", "analisis": "análisis",
    "arbol": "árbol", "atomica": "atómica", "automatica": "automática",
    "automaticas": "automáticas", "automatico": "automático",
    "basico": "básico", "basicos": "básicos", "bitacora": "bitácora",
    "calculo": "cálculo", "capitulo": "capítulo", "capitulos": "capítulos",
    "caracteristicas": "características", "codigo": "código",
    "codigos": "códigos", "comite": "comité", "computo": "cómputo",
    "criptografica": "criptográfica", "criptograficos": "criptográficos",
    "critica": "crítica", "criticas": "críticas", "critico": "crítico",
    "criticos": "críticos", "diagnostico": "diagnóstico",
    "digito": "dígito", "digitos": "dígitos",
    "economica": "económica", "economicas": "económicas",
    "economico": "económico", "economicos": "económicos",
    "electronico": "electrónico", "electronica": "electrónica",
    "erronea": "errónea", "erroneo": "erróneo",
    "especifica": "específica", "especificacion": "especificación",
    "especifico": "específico", "especificos": "específicos",
    "estandares": "estándares", "estatico": "estático",
    "exito": "éxito", "explicita": "explícita", "explicitos": "explícitos",
    "fisica": "física", "fisicos": "físicos", "generico": "genérico",
    "generica": "genérica", "genericos": "genéricos",
    "grafico": "gráfico", "graficos": "gráficos",
    "indice": "índice", "indices": "índices", "limite": "límite",
    "linea": "línea", "lineas": "líneas", "logica": "lógica",
    "maximo": "máximo", "metodo": "método", "metodos": "métodos",
    "metodologica": "metodológica", "metrica": "métrica",
    "metricas": "métricas", "minima": "mínima", "minimo": "mínimo",
    "minusculas": "minúsculas", "modulo": "módulo", "modulos": "módulos",
    "movil": "móvil", "moviles": "móviles", "multiples": "múltiples",
    "numerico": "numérico", "numericos": "numéricos",
    "numero": "número", "numeros": "números",
    "pagina": "página", "paginas": "páginas",
    "parametro": "parámetro", "parametros": "parámetros",
    "parentesis": "paréntesis", "politica": "política",
    "politicas": "políticas", "portatil": "portátil",
    "practica": "práctica", "practicas": "prácticas",
    "proposito": "propósito", "proximo": "próximo",
    "publica": "pública", "publicas": "públicas", "publico": "público",
    "raiz": "raíz", "razon": "razón", "recalculo": "recálculo",
    "septima": "séptima", "simbolico": "simbólico", "simbolos": "símbolos",
    "simultanea": "simultánea", "sintetica": "sintética",
    "sintetico": "sintético", "sintoma": "síntoma", "tecnica": "técnica",
    "tecnicas": "técnicas", "tecnico": "técnico", "tecnicos": "técnicos",
    "tecnologica": "tecnológica", "teorico": "teórico",
    "terminos": "términos", "tipico": "típico", "titulo": "título",
    "ultima": "última", "ultimas": "últimas", "ultimo": "último",
    "unica": "única", "unico": "único", "unicos": "únicos",
    "valido": "válido", "validos": "válidos", "validas": "válidas",
    "invalido": "inválido", "invalida": "inválida", "invalidas": "inválidas",
    "carne": "carné", "interes": "interés", "jerarquia": "jerarquía",
    "teoria": "teoría", "foranea": "foránea", "foraneas": "foráneas",
    "imagenes": "imágenes", "boton": "botón", "botones": "botones",
    "dialogo": "diálogo", "actua": "actúa", "padron": "padrón",
    "demas": "demás",
    # adverbios en -mente
    "automaticamente": "automáticamente",
    "criptograficamente": "criptográficamente",
    "especificamente": "específicamente",
    "explicitamente": "explícitamente",
    "facilmente": "fácilmente", "logicamente": "lógicamente",
    "simultaneamente": "simultáneamente", "unicamente": "únicamente",
    # monosilabos y palabras funcionales
    "ademas": "además", "algun": "algún", "asi": "así", "aun": "aún",
    "despues": "después", "mas": "más", "ningun": "ningún",
    "segun": "según", "tambien": "también", "vease": "véase",
    # con enie
    "anio": "año", "anios": "años", "contrasena": "contraseña",
    "contrasenas": "contraseñas", "diseno": "diseño",
    "senalados": "señalados", "tamano": "tamaño", "sibana": "Sibaná",
    # verbos conjugados
    "alcanzo": "alcanzó", "constituia": "constituía",
    "construyo": "construyó", "consulto": "consultó",
    "delego": "delegó", "deberia": "debería", "deberian": "deberían",
    "efectuo": "efectuó", "ejecuto": "ejecutó",
    "implemento": "implementó", "localizo": "localizó",
    "permitio": "permitió", "permitiria": "permitiría",
    "podria": "podría", "quedo": "quedó", "verifico": "verificó",
    "emitio": "emitió", "modifico": "modificó",
}

# Terminaciones regulares: cualquier sustantivo en -cion / -sion lleva tilde.
SUFIJOS = [
    (re.compile(r"([A-Za-zÑÁÉÍÓÚñáéíóú]{2,})(cion|Cion|CION)\b"),
     {"cion": "ción", "Cion": "ción", "CION": "CIÓN"}),
    (re.compile(r"([A-Za-zÑÁÉÍÓÚñáéíóú]{2,})(sion|Sion|SION)\b"),
     {"sion": "sión", "Sion": "sión", "SION": "SIÓN"}),
]

# Correcciones literales aplicadas al final: revierten falsos positivos,
# restituyen tildes diacriticas y corrigen etiquetas reales de la interfaz.
POSFIJOS = [
    # Nombre de tabla enumerado junto a otras tablas.
    ("viviendas, configuración", "viviendas, configuracion"),
    # Prosa unida por barra, protegida por parecer una ruta.
    ("activacion/desactivacion", "activación/desactivación"),
    # Etiquetas y mensajes tal como aparecen en el codigo fuente.
    ("'anio de inicio de cobro'", "'año de inicio de cobro'"),
    ("'Iniciar sesion'", "'Iniciar sesión'"),
    ("'Cerrar sesion'", "'Cerrar sesión'"),
    ("'DPI o contrasena incorrectos'", "'DPI o contraseña incorrectos'"),
    ("modulo 'Configuracion'", "módulo 'Configuración'"),
    ("módulo 'Configuracion'", "módulo 'Configuración'"),
    # Tildes diacriticas en interrogativas indirectas.
    ("determinar automáticamente que años",
     "determinar automáticamente qué años"),
    ("con precisión que información fue verificada",
     "con precisión qué información fue verificada"),
    ("que información debe ser aportada", "qué información debe ser aportada"),
    ("y que afirmaciones requieren", "y qué afirmaciones requieren"),
    ("que describa como opera", "que describa cómo opera"),
    ("que registre quien emitió", "que registre quién emitió"),
    ("sin distinguir cual de los dos", "sin distinguir cuál de los dos"),
]

PATRON_PALABRAS = re.compile(
    r"\b(" + "|".join(sorted(PALABRAS, key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)

# Cadenas entre comillas simples, identificadores con . _ / y URLs.
PATRON_PROTEGIDO = re.compile(
    r"'[^']*'"
    r"|https?://\S+"
    r"|[A-Za-z_][A-Za-z0-9_-]*(?:[._/][A-Za-z0-9_{}:*\[\]-]+)+"
    r"|[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9_]+"
)


def con_caso(original, reemplazo):
    if original.isupper():
        return reemplazo.upper()
    if original[0].isupper():
        return reemplazo[0].upper() + reemplazo[1:]
    return reemplazo


def acentuar(texto):
    guardados = []

    def guardar(m):
        guardados.append(m.group(0))
        return "\x00%d\x00" % (len(guardados) - 1)

    texto = PATRON_PROTEGIDO.sub(guardar, texto)

    for patron, reemplazo in REGLAS_CONTEXTO:
        texto = re.sub(patron, reemplazo, texto)

    texto = PATRON_PALABRAS.sub(
        lambda m: con_caso(m.group(0), PALABRAS[m.group(0).lower()]), texto
    )

    for patron, mapa in SUFIJOS:
        texto = patron.sub(lambda m: m.group(1) + mapa[m.group(2)], texto)

    texto = re.sub(r"\x00(\d+)\x00", lambda m: guardados[int(m.group(1))], texto)

    for viejo, nuevo in POSFIJOS:
        texto = texto.replace(viejo, nuevo)
    return texto


def procesar_parrafo(par, stats):
    for run in par.runs:
        if run.font.name == "Consolas":
            continue
        original = run.text
        if not original.strip():
            continue
        if original.strip() in RUNS_PROTEGIDOS:
            continue
        if original.strip() == "Si":
            run.text = original.replace("Si", "Sí")
            stats["cambios"] += 1
            continue
        nuevo = acentuar(original)
        if nuevo != original:
            run.text = nuevo
            stats["cambios"] += 1


def main():
    doc = Document(DOCX)
    stats = {"cambios": 0}

    for par in doc.paragraphs:
        procesar_parrafo(par, stats)

    for tabla in doc.tables:
        for fila in tabla.rows:
            for celda in fila.cells:
                for par in celda.paragraphs:
                    procesar_parrafo(par, stats)

    doc.save(DOCX)
    print("Ejecuciones de texto modificadas:", stats["cambios"])


if __name__ == "__main__":
    sys.exit(main())

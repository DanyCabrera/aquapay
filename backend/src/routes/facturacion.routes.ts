import { Router } from "express";
import {
  ActualizarTarifaDto,
  CobroCompraChorroDto,
  CobroTarifaAnualDto,
} from "../dto/facturacion.dto";
import { requireAuth, requireRoles } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { configService } from "../services/config.service";
import { facturacionService } from "../services/facturacion.service";

const router = Router();

router.use(requireAuth);

router.get("/dashboard", async (_req, res, next) => {
  try {
    const data = await facturacionService.dashboard();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.get("/config", async (_req, res, next) => {
  try {
    const data = await configService.getPublicConfig();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.put(
  "/config/tarifa",
  requireRoles("administrador"),
  validateBody(ActualizarTarifaDto),
  async (req, res, next) => {
    try {
      const data = await configService.setTarifaAnual(
        Number(req.body.tarifaAnual),
        req.user!.id,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/siguiente-recibo", requireRoles("tesorero"), async (_req, res, next) => {
  try {
    const data = await facturacionService.previewSiguienteRecibo();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.get("/pendientes/:viviendaId", requireRoles("tesorero"), async (req, res, next) => {
  try {
    const data = await facturacionService.aniosPendientes(req.params.viviendaId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/cobrar/tarifa-anual",
  requireRoles("tesorero"),
  validateBody(CobroTarifaAnualDto),
  async (req, res, next) => {
    try {
      const data = await facturacionService.cobrarTarifaAnual(
        req.body,
        req.user!.id,
      );
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/cobrar/compra-chorro",
  requireRoles("tesorero"),
  validateBody(CobroCompraChorroDto),
  async (req, res, next) => {
    try {
      const data = await facturacionService.cobrarCompraChorro(
        req.body,
        req.user!.id,
      );
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/recibos", requireRoles("tesorero", "administrador"), async (req, res, next) => {
  try {
    const data = await facturacionService.listarRecibos({
      q: req.query.q as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.get("/recibos/:id", async (req, res, next) => {
  try {
    const data = await facturacionService.obtenerRecibo(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.get("/recibos/:id/pdf", async (req, res, next) => {
  try {
    const data = await facturacionService.leerPdf(req.params.id);
    res.setHeader("Content-Type", data.tipoMime || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${data.nombreArchivo}"`,
    );
    res.send(data.bytes);
  } catch (e) {
    next(e);
  }
});

router.get("/historial/:usuarioId", async (req, res, next) => {
  try {
    const anio = req.query.anio ? Number(req.query.anio) : undefined;
    const data = await facturacionService.historialPorUsuario(
      req.params.usuarioId,
      anio,
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

export default router;

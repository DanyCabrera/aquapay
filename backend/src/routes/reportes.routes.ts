import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth";
import { reportesService } from "../services/reportes.service";

const router = Router();

router.use(requireAuth, requireRoles("administrador"));

router.get("/:tipo/pdf", async (req, res, next) => {
  try {
    const anio = req.query.anio ? Number(req.query.anio) : undefined;
    const bytes = await reportesService.exportarPdf(req.params.tipo, anio);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reporte-${req.params.tipo}.pdf"`,
    );
    res.send(Buffer.from(bytes));
  } catch (e) {
    next(e);
  }
});

router.get("/:tipo", async (req, res, next) => {
  try {
    const anio = req.query.anio ? Number(req.query.anio) : undefined;
    const data = await reportesService.datos(req.params.tipo, anio);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

export default router;

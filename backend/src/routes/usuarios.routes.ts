import { Router } from "express";
import {
  ActualizarUsuarioDto,
  CrearUsuarioDto,
} from "../dto/usuario.dto";
import {
  ActualizarChorroDto,
  ActualizarViviendaDto,
  CrearChorroDto,
  CrearViviendaDto,
} from "../dto/vivienda.dto";
import { requireAuth, requireRoles } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { usuariosService } from "../services/usuarios.service";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const data = await usuariosService.listar(req.query.q as string | undefined);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.get("/dpi/:dpi", async (req, res, next) => {
  try {
    const data = await usuariosService.buscarPorDpi(req.params.dpi);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const data = await usuariosService.obtener(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  requireRoles("administrador"),
  validateBody(CrearUsuarioDto),
  async (req, res, next) => {
    try {
      const data = await usuariosService.crear(req.body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/:id",
  requireRoles("administrador"),
  validateBody(ActualizarUsuarioDto),
  async (req, res, next) => {
    try {
      const data = await usuariosService.actualizar(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  "/:id",
  requireRoles("administrador"),
  async (req, res, next) => {
    try {
      const data = await usuariosService.desactivar(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/:id/activar",
  requireRoles("administrador"),
  async (req, res, next) => {
    try {
      const data = await usuariosService.activar(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/:id/desactivar",
  requireRoles("administrador"),
  async (req, res, next) => {
    try {
      const data = await usuariosService.desactivar(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/:id/viviendas",
  requireRoles("administrador"),
  validateBody(CrearViviendaDto),
  async (req, res, next) => {
    try {
      const data = await usuariosService.crearVivienda(req.params.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/viviendas/:id",
  requireRoles("administrador"),
  validateBody(ActualizarViviendaDto),
  async (req, res, next) => {
    try {
      const data = await usuariosService.actualizarVivienda(
        req.params.id,
        req.body,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/viviendas/:id/chorros",
  requireRoles("administrador"),
  validateBody(CrearChorroDto),
  async (req, res, next) => {
    try {
      const data = await usuariosService.crearChorro(req.params.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/chorros/:id",
  requireRoles("administrador"),
  validateBody(ActualizarChorroDto),
  async (req, res, next) => {
    try {
      const data = await usuariosService.actualizarChorro(
        req.params.id,
        req.body,
      );
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
);

export default router;

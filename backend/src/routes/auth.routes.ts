import { Router } from "express";
import { LoginDto, RegistroDto } from "../dto/auth.dto";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { authService } from "../services/auth.service";

const router = Router();

router.get("/registro-opciones", async (_req, res, next) => {
  try {
    const permitirAdministrador = await authService.puedeRegistrarAdministrador();
    res.json({
      success: true,
      data: { permitirAdministrador },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/registro", validateBody(RegistroDto), async (req, res, next) => {
  try {
    const data = await authService.registrar(req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.post("/login", validateBody(LoginDto), async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const data = await authService.miPerfil(req.user!.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const token = req.headers.authorization!.slice(7);
    await authService.logout(token);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;

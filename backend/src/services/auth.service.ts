import bcrypt from "bcryptjs";
import { AppDataSource } from "../database/data-source";
import { Perfil } from "../entities/Perfil";
import { LoginDto, RegistroDto } from "../dto/auth.dto";
import { normalizarDpi } from "../utils/dpi";
import { signAccessToken } from "../utils/jwt";
import { conflict, forbidden, unauthorized } from "../utils/errors";

function toUsuario(perfil: Perfil) {
  return {
    id: perfil.id,
    nombre: perfil.nombre,
    dpi: perfil.dpi,
    rol: perfil.rol,
  };
}

export class AuthService {
  private perfiles = () => AppDataSource.getRepository(Perfil);

  /** True solo si aún no existe ningún administrador activo (bootstrap). */
  async puedeRegistrarAdministrador() {
    const admins = await this.perfiles().count({
      where: { rol: "administrador", activo: true },
    });
    return admins === 0;
  }

  async registrar(dto: RegistroDto) {
    const dpi = normalizarDpi(dto.dpi);
    const existente = await this.perfiles().findOne({ where: { dpi } });
    if (existente) throw conflict("Ya existe un usuario del sistema con ese DPI");

    if (dto.rol === "administrador") {
      const permitido = await this.puedeRegistrarAdministrador();
      if (!permitido) {
        throw forbidden(
          "El registro público de administradores está cerrado. Solicite acceso a un administrador existente.",
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const perfil = this.perfiles().create({
      nombre: dto.nombre.trim(),
      dpi,
      passwordHash,
      rol: dto.rol,
      mfaSecreto: null,
      mfaHabilitado: false,
      activo: true,
    });

    await this.perfiles().save(perfil);
    return toUsuario(perfil);
  }

  async login(dto: LoginDto) {
    const dpi = normalizarDpi(dto.dpi);
    const perfil = await this.perfiles().findOne({ where: { dpi } });
    if (!perfil || !perfil.activo) {
      throw unauthorized("DPI o contraseña incorrectos");
    }

    const ok = await bcrypt.compare(dto.password, perfil.passwordHash);
    if (!ok) {
      throw unauthorized("DPI o contraseña incorrectos");
    }

    const { token, expiresIn } = await signAccessToken({
      sub: perfil.id,
      dpi: perfil.dpi,
      nombre: perfil.nombre,
      rol: perfil.rol,
    });

    return {
      accessToken: token,
      refreshToken: null,
      expiresIn,
      usuario: toUsuario(perfil),
    };
  }

  async miPerfil(userId: string) {
    const perfil = await this.perfiles().findOneOrFail({ where: { id: userId } });
    return toUsuario(perfil);
  }

  async logout(_token: string) {
    // JWT stateless: el cliente elimina el token localmente.
    return { ok: true };
  }
}

export const authService = new AuthService();

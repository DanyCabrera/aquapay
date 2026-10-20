"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { UsuarioSistema } from "@/lib/types";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";
import {
  DPI_LENGTH,
  authFieldClass,
  authSubmitClass,
  formatDpiDisplay,
  parseDpiInput,
} from "@/components/auth/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { setSession, token, user } = useAuth();
  const router = useRouter();

  const dpiId = useId();
  const passwordId = useId();
  const rememberId = useId();
  const dpiErrorId = useId();
  const passwordErrorId = useId();
  const formErrorId = useId();
  const recoverDpiId = useId();
  const recoverPasswordId = useId();
  const recoverConfirmId = useId();

  const [mode, setMode] = useState<"entrar" | "restablecer">("entrar");
  const [dpi, setDpi] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ dpi: false, password: false });
  const [formError, setFormError] = useState<string | null>(null);

  const [recoverDpi, setRecoverDpi] = useState("");
  const [recoverPassword, setRecoverPassword] = useState("");
  const [recoverConfirm, setRecoverConfirm] = useState("");
  const [showRecoverPassword, setShowRecoverPassword] = useState(false);
  const [recoverTouched, setRecoverTouched] = useState({
    dpi: false,
    password: false,
    confirm: false,
  });
  const [recoverError, setRecoverError] = useState<string | null>(null);

  const dpiError =
    touched.dpi && dpi.length === 0
      ? "Ingrese el DPI."
      : touched.dpi && dpi.length < DPI_LENGTH
        ? "El DPI debe tener 13 dígitos."
        : null;

  const passwordError =
    touched.password && password.length === 0
      ? "Ingrese la contraseña."
      : touched.password && password.length < 8
        ? "Mínimo 8 caracteres."
        : null;

  const recoverDpiError =
    recoverTouched.dpi && recoverDpi.length === 0
      ? "Ingrese el DPI con el que se registró."
      : recoverTouched.dpi && recoverDpi.length < DPI_LENGTH
        ? "El DPI debe tener 13 dígitos."
        : null;

  const recoverPasswordError =
    recoverTouched.password && recoverPassword.length === 0
      ? "Ingrese la nueva contraseña."
      : recoverTouched.password && recoverPassword.length < 8
        ? "Mínimo 8 caracteres."
        : null;

  const recoverConfirmError =
    recoverTouched.confirm && recoverConfirm.length === 0
      ? "Confirme la nueva contraseña."
      : recoverTouched.confirm && recoverConfirm !== recoverPassword
        ? "Las contraseñas no coinciden."
        : null;

  const dpiComplete = dpi.length === DPI_LENGTH;
  const canSubmit = dpiComplete && password.length >= 8 && !loading;
  const canRecover =
    recoverDpi.length === DPI_LENGTH &&
    recoverPassword.length >= 8 &&
    recoverPassword === recoverConfirm &&
    !loading;

  useEffect(() => {
    if (token && user) {
      router.replace("/dashboard");
    }
  }, [token, user, router]);

  function abrirRestablecer() {
    setMode("restablecer");
    setRecoverDpi(dpi);
    setRecoverPassword("");
    setRecoverConfirm("");
    setRecoverTouched({ dpi: false, password: false, confirm: false });
    setRecoverError(null);
    setFormError(null);
  }

  function volverAEntrar() {
    setMode("entrar");
    if (recoverDpi) setDpi(recoverDpi);
    setRecoverError(null);
    setFormError(null);
  }

  async function onCredentialsSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ dpi: true, password: true });
    setFormError(null);

    if (dpi.length !== DPI_LENGTH || password.length < 8 || loading) return;

    setLoading(true);
    try {
      const data = await api<{
        accessToken: string;
        usuario: UsuarioSistema;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ dpi, password }),
      });
      setSession(data.accessToken, data.usuario, { remember });
      router.push("/dashboard");
    } catch {
      setFormError("DPI o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  async function onRestablecer(e: FormEvent) {
    e.preventDefault();
    setRecoverTouched({ dpi: true, password: true, confirm: true });
    setRecoverError(null);

    if (!canRecover && recoverPassword !== recoverConfirm) return;
    if (recoverDpi.length !== DPI_LENGTH || recoverPassword.length < 8 || loading) {
      return;
    }
    if (recoverPassword !== recoverConfirm) return;

    setLoading(true);
    try {
      await api("/api/auth/restablecer-password", {
        method: "POST",
        body: JSON.stringify({ dpi: recoverDpi, password: recoverPassword }),
      });
      toast.success("Contraseña actualizada. Entre con el mismo DPI.");
      setDpi(recoverDpi);
      setPassword("");
      setMode("entrar");
    } catch (err) {
      setRecoverError(
        err instanceof ApiError
          ? err.message
          : "No se pudo restablecer la contraseña.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell mode="login">
      <div className="space-y-6">
        {mode === "entrar" ? (
          <>
            <div><h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Inicia sesión</h1></div>

            <form onSubmit={onCredentialsSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor={dpiId} className="text-caption font-medium">
                  DPI
                </Label>
                <Input
                  id={dpiId}
                  name="dpi"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="0000 00000 0000"
                  value={formatDpiDisplay(dpi)}
                  onChange={(e) => {
                    setDpi(parseDpiInput(e.target.value));
                    if (formError) setFormError(null);
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, dpi: true }))}
                  disabled={loading}
                  aria-invalid={Boolean(dpiError || formError) || undefined}
                  aria-describedby={dpiError ? dpiErrorId : undefined}
                  className={cn(authFieldClass, "font-mono tracking-wider")}
                />
                {dpiError ? (
                  <p id={dpiErrorId} className="text-sm text-destructive">
                    {dpiError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={passwordId} className="text-caption font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id={passwordId}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    disabled={loading}
                    aria-invalid={Boolean(passwordError || formError) || undefined}
                    aria-describedby={passwordError ? passwordErrorId : undefined}
                    className={cn(authFieldClass, "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={loading}
                    className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-ui hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30 disabled:opacity-50"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p id={passwordErrorId} className="text-caption text-destructive">
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                <label
                  htmlFor={rememberId}
                  className="flex cursor-pointer items-center gap-2 text-caption text-muted-foreground"
                >
                  <input
                    id={rememberId}
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={loading}
                    className="size-3.5 rounded border-border accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40"
                  />
                  Recordarme
                </label>
                <button
                  type="button"
                  onClick={abrirRestablecer}
                  className="text-caption font-medium text-primary underline-offset-4 transition-ui hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  ¿Olvidó la contraseña?
                </button>
              </div>

              {formError && (
                <p
                  id={formErrorId}
                  role="alert"
                  className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  {formError}
                </p>
              )}

              <Button
                type="submit"
                className={authSubmitClass}
                disabled={!canSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Iniciando sesión…
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div>
              <h1>Restablecer</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Use el mismo DPI con el que se registró para crear una contraseña nueva.
              </p>
            </div>

            <form onSubmit={onRestablecer} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor={recoverDpiId} className="text-caption font-medium">
                  DPI registrado
                </Label>
                <Input
                  id={recoverDpiId}
                  name="dpi"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="0000 00000 0000"
                  value={formatDpiDisplay(recoverDpi)}
                  onChange={(e) => {
                    setRecoverDpi(parseDpiInput(e.target.value));
                    if (recoverError) setRecoverError(null);
                  }}
                  onBlur={() => setRecoverTouched((t) => ({ ...t, dpi: true }))}
                  disabled={loading}
                  aria-invalid={Boolean(recoverDpiError || recoverError) || undefined}
                  className={cn(authFieldClass, "font-mono tracking-wider")}
                />
                {recoverDpiError ? (
                  <p className="text-sm text-destructive">{recoverDpiError}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={recoverPasswordId} className="text-caption font-medium">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Input
                    id={recoverPasswordId}
                    name="new-password"
                    type={showRecoverPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={recoverPassword}
                    onChange={(e) => {
                      setRecoverPassword(e.target.value);
                      if (recoverError) setRecoverError(null);
                    }}
                    onBlur={() =>
                      setRecoverTouched((t) => ({ ...t, password: true }))
                    }
                    disabled={loading}
                    aria-invalid={Boolean(recoverPasswordError) || undefined}
                    className={cn(authFieldClass, "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecoverPassword((v) => !v)}
                    disabled={loading}
                    className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-ui hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30 disabled:opacity-50"
                    aria-label={
                      showRecoverPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {showRecoverPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
                {recoverPasswordError ? (
                  <p className="text-caption text-destructive">
                    {recoverPasswordError}
                  </p>
                ) : (
                  <PasswordStrengthMeter password={recoverPassword} />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={recoverConfirmId} className="text-caption font-medium">
                  Confirmar contraseña
                </Label>
                <Input
                  id={recoverConfirmId}
                  name="confirm-password"
                  type={showRecoverPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={recoverConfirm}
                  onChange={(e) => {
                    setRecoverConfirm(e.target.value);
                    if (recoverError) setRecoverError(null);
                  }}
                  onBlur={() =>
                    setRecoverTouched((t) => ({ ...t, confirm: true }))
                  }
                  disabled={loading}
                  aria-invalid={Boolean(recoverConfirmError) || undefined}
                  className={authFieldClass}
                />
                {recoverConfirmError ? (
                  <p className="text-caption text-destructive">
                    {recoverConfirmError}
                  </p>
                ) : null}
              </div>

              {recoverError ? (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  {recoverError}
                </p>
              ) : null}

              <Button
                type="submit"
                className={authSubmitClass}
                disabled={!canRecover}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Guardando…
                  </>
                ) : (
                  "Restablecer"
                )}
              </Button>

              <button
                type="button"
                onClick={volverAEntrar}
                disabled={loading}
                className="w-full text-center text-caption text-muted-foreground underline-offset-4 transition-ui hover:text-foreground hover:underline disabled:opacity-50"
              >
                Volver a entrar
              </button>
            </form>
          </>
        )}

        <p className="border-t border-border pt-5 text-center text-caption text-muted-foreground">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

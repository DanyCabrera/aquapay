"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { UsuarioSistema } from "@/lib/types";
import { AuthShell } from "@/components/auth/auth-shell";
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

  const [dpi, setDpi] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ dpi: false, password: false });
  const [formError, setFormError] = useState<string | null>(null);
  const [showRecoverHint, setShowRecoverHint] = useState(false);

  const dpiError =
    touched.dpi && dpi.length === 0
      ? "Ingresa tu DPI."
      : touched.dpi && dpi.length < DPI_LENGTH
        ? "El DPI debe tener 13 dígitos."
        : null;

  const passwordError =
    touched.password && password.length === 0
      ? "Ingresa tu contraseña."
      : touched.password && password.length < 8
        ? "La contraseña debe tener al menos 8 caracteres."
        : null;

  const dpiComplete = dpi.length === DPI_LENGTH;
  const canSubmit = dpiComplete && password.length >= 8 && !loading;

  useEffect(() => {
    if (token && user) {
      router.replace("/dashboard");
    }
  }, [token, user, router]);

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
      setFormError(
        "DPI o contraseña incorrectos. Verifica e intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell mode="login">
      <div className="space-y-7">
        <div>
          <h1>Entrar</h1>
          <p className="mt-2 text-base text-muted-foreground">
            DPI y contraseña del tesorero o administrador.
          </p>
        </div>

        <form onSubmit={onCredentialsSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor={dpiId} className="text-[13px] font-medium">
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
            <Label htmlFor={passwordId} className="text-[13px] font-medium">
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
              <p id={passwordErrorId} className="text-xs text-destructive">
                {passwordError}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <label
              htmlFor={rememberId}
              className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground"
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
              onClick={() => setShowRecoverHint((v) => !v)}
              className="text-[13px] text-foreground underline-offset-4 transition-ui hover:underline focus-visible:outline-none"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {showRecoverHint && (
            <p className="rounded-md border border-border bg-muted/60 px-3 py-2 text-caption leading-relaxed text-muted-foreground">
              El restablecimiento automático no está disponible. Contacte al
              administrador del sistema para recuperar el acceso.
            </p>
          )}

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
                Entrando…
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>

        <p className="border-t border-border pt-5 text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

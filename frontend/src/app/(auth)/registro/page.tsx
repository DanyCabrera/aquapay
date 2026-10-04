"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";
import {
  DPI_LENGTH,
  authFieldClass,
  authSubmitClass,
  formatDpiDisplay,
  getPasswordStrength,
  parseDpiInput,
} from "@/components/auth/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function RegistroPage() {
  const router = useRouter();

  const nombreId = useId();
  const dpiId = useId();
  const passwordId = useId();
  const termsId = useId();
  const nombreErrorId = useId();
  const dpiErrorId = useId();
  const passwordErrorId = useId();
  const termsErrorId = useId();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [permitirAdministrador, setPermitirAdministrador] = useState(false);
  const [opcionesCargadas, setOpcionesCargadas] = useState(false);
  const [touched, setTouched] = useState({
    nombre: false,
    dpi: false,
    password: false,
    terms: false,
  });
  const [form, setForm] = useState({
    nombre: "",
    dpi: "",
    password: "",
    rol: "tesorero" as "administrador" | "tesorero",
  });

  useEffect(() => {
    api<{ permitirAdministrador: boolean }>("/api/auth/registro-opciones")
      .then((data) => {
        setPermitirAdministrador(Boolean(data.permitirAdministrador));
        if (!data.permitirAdministrador) {
          setForm((f) => ({ ...f, rol: "tesorero" }));
        }
        setOpcionesCargadas(true);
      })
      .catch((err) => {
        toast.error(
          err instanceof ApiError
            ? err.message
            : "No hay conexión con el servidor.",
        );
        setOpcionesCargadas(false);
      });
  }, []);

  const nombreError =
    touched.nombre && form.nombre.trim().length === 0
              ? "Ingrese el nombre completo."
              : touched.nombre && form.nombre.trim().length < 3
                ? "Mínimo 3 caracteres."
        : null;

  const dpiError =
    touched.dpi && form.dpi.length === 0
              ? "Ingrese el DPI."
              : touched.dpi && form.dpi.length < DPI_LENGTH
                ? "El DPI debe tener 13 dígitos."
        : null;

  const passwordError =
    touched.password && form.password.length === 0
              ? "Ingrese una contraseña."
              : touched.password && form.password.length < 8
                ? "Mínimo 8 caracteres."
        : null;

  const termsError =
    touched.terms && !terms
              ? "Acepte los términos para continuar."
      : null;

  const strength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );

  const dpiComplete = form.dpi.length === DPI_LENGTH;

  const formValid =
    form.nombre.trim().length >= 3 &&
    dpiComplete &&
    form.password.length >= 8 &&
    (strength === "media" || strength === "fuerte") &&
    terms;

  const canSubmit = formValid && !loading;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({
      nombre: true,
      dpi: true,
      password: true,
      terms: true,
    });

    if (!formValid || loading) return;

    const rol =
      form.rol === "administrador" && !permitirAdministrador
        ? "tesorero"
        : form.rol;

    setLoading(true);
    try {
      await api("/api/auth/registro", {
        method: "POST",
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          dpi: form.dpi,
          password: form.password,
          rol,
        }),
      });
      toast.success("Cuenta creada.");
      router.push("/login");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "No se pudo crear la cuenta",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell mode="registro">
      <div className="space-y-8">
        <h1>Crear cuenta</h1>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor={nombreId} className="text-caption font-medium">
              Nombre completo
            </Label>
            <Input
              id={nombreId}
              name="nombre"
              autoComplete="name"
              placeholder="Carlos Méndez"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, nombre: true }))}
              disabled={loading}
              aria-invalid={Boolean(nombreError) || undefined}
              aria-describedby={nombreError ? nombreErrorId : undefined}
              className={authFieldClass}
            />
            {nombreError && (
              <p id={nombreErrorId} className="text-caption text-destructive">
                {nombreError}
              </p>
            )}
          </div>

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
              value={formatDpiDisplay(form.dpi)}
              onChange={(e) =>
                setForm({ ...form, dpi: parseDpiInput(e.target.value) })
              }
              onBlur={() => setTouched((t) => ({ ...t, dpi: true }))}
              disabled={loading}
              aria-invalid={Boolean(dpiError) || undefined}
              aria-describedby={dpiError ? dpiErrorId : undefined}
              className={cn(authFieldClass, "font-mono tracking-wider")}
            />
            {dpiError ? (
              <p id={dpiErrorId} className="text-sm text-destructive">
                {dpiError}
              </p>
            ) : null}
          </div>

          {permitirAdministrador ? (
          <div className="space-y-1.5">
            <Label className="text-caption font-medium">Rol</Label>
            <div
              className="flex flex-wrap gap-x-8 gap-y-1"
              role="radiogroup"
              aria-label="Rol del sistema"
            >
              <RoleCard
                selected={form.rol === "tesorero"}
                title="Tesorero"
                disabled={loading}
                onSelect={() => setForm({ ...form, rol: "tesorero" })}
              />
              <RoleCard
                selected={form.rol === "administrador"}
                title="Administrador"
                disabled={loading}
                onSelect={() => setForm({ ...form, rol: "administrador" })}
              />
            </div>
          </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor={passwordId} className="text-caption font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id={passwordId}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder=""
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                disabled={loading}
                aria-invalid={Boolean(passwordError) || undefined}
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
            {passwordError ? (
              <p id={passwordErrorId} className="text-caption text-destructive">
                {passwordError}
              </p>
            ) : (
              <PasswordStrengthMeter password={form.password} />
            )}
            {touched.password && !passwordError && strength === "debil" && (
              <p className="text-caption text-destructive">
                Use mayúsculas, números o símbolos.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={termsId}
              className="flex cursor-pointer items-start gap-2 text-caption text-muted-foreground"
            >
              <input
                id={termsId}
                type="checkbox"
                checked={terms}
                onChange={(e) => {
                  setTerms(e.target.checked);
                  setTouched((t) => ({ ...t, terms: true }));
                }}
                disabled={loading}
                aria-invalid={Boolean(termsError) || undefined}
                aria-describedby={termsError ? termsErrorId : undefined}
                className="mt-0.5 size-3.5 rounded border-border accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40"
              />
              <span>
                Acepto el tratamiento del DPI.
              </span>
            </label>
            {termsError && (
              <p id={termsErrorId} className="text-caption text-destructive">
                {termsError}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className={authSubmitClass}
            disabled={!canSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Registrando…
              </>
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </form>

        <p className="border-t border-border pt-5 text-center text-caption text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

function RoleCard({
  selected,
  title,
  disabled,
  onSelect,
}: {
  selected: boolean;
  title: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "min-h-10 border-b px-0 py-2 text-left text-sm transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:text-muted-foreground",
        selected
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {title}
    </button>
  );
}

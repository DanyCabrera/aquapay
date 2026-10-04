import { getPasswordStrength } from "@/components/auth/auth-utils";

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (strength === "empty") return null;

  const label =
    strength === "debil" ? "Débil" : strength === "media" ? "Media" : "Fuerte";

  return (
    <p className="text-caption text-muted-foreground" aria-live="polite">
      {label}
    </p>
  );
}

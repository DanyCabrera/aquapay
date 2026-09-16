import { cn } from "@/lib/utils";
import {
  getPasswordStrength,
  type PasswordStrength,
} from "@/components/auth/auth-utils";

const labels: Record<Exclude<PasswordStrength, "empty">, string> = {
  debil: "Débil",
  media: "Media",
  fuerte: "Fuerte",
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (strength === "empty") return null;

  const level = strength === "debil" ? 1 : strength === "media" ? 2 : 3;

  const tone =
    strength === "debil"
      ? "bg-destructive"
      : strength === "media"
        ? "bg-warning"
        : "bg-success";

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn(
              "h-[3px] flex-1 rounded-sm transition-ui",
              n <= level ? tone : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="text-caption text-muted-foreground">
        Seguridad: {labels[strength]}
      </p>
    </div>
  );
}

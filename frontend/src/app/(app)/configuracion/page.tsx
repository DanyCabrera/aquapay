"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageStack, PageIntro } from "@/components/layout/page-stack";

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tarifa, setTarifa] = useState("");
  const [lugar, setLugar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user.rol !== "administrador") {
      router.replace("/dashboard");
      return;
    }
    api<{ tarifaAnual: number; lugarPago: string }>("/api/facturacion/config")
      .then((c) => {
        setTarifa(String(c.tarifaAnual));
        setLugar(c.lugarPago);
      })
      .catch(console.error);
  }, [user, router]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/facturacion/config/tarifa", {
        method: "PUT",
        body: JSON.stringify({ tarifaAnual: Number(tarifa) }),
      });
      toast.success("Tarifa anual actualizada");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar. Revise la conexión e intente de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageStack>
      <PageIntro description="Precio anual por chorro. El lugar de pago no se edita aquí." />

      <form onSubmit={guardar} className="max-w-xl space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tarifa">Tarifa anual por chorro</Label>
            <Input
              id="tarifa"
              type="number"
              min="0.01"
              step="0.01"
              className="font-mono"
              value={tarifa}
              onChange={(e) => setTarifa(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lugar">Lugar de pago</Label>
            <Input
              id="lugar"
              value={lugar}
              readOnly
              className="bg-muted text-muted-foreground"
            />
          </div>
          <Button type="submit" className="w-full rounded-full sm:w-auto" disabled={saving}>
            <Save className="size-4" />
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </form>
    </PageStack>
  );
}

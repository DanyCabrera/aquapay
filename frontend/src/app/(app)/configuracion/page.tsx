"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Surface } from "@/components/layout/page-header";

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
    <div className="space-y-6">
      <PageHeader
        title="Tarifa anual"
        description="Monto fijo por chorro para el próximo cobro anual."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Configuración" },
        ]}
      />

      <Surface className="max-w-xl p-5 sm:p-6">
        <form onSubmit={guardar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tarifa">Tarifa anual por chorro (Q)</Label>
            <Input
              id="tarifa"
              type="number"
              min="0.01"
              step="0.01"
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
          <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
            {saving ? "Guardando…" : "Guardar tarifa"}
          </Button>
        </form>
      </Surface>
    </div>
  );
}

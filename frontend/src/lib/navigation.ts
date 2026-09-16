import type { Rol } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  LayoutDashboard,
  Receipt,
  Settings2,
  Users,
  Wallet,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Rol[];
};

/** Navegación por rol:
 * - Admin: dashboard, beneficiarios (CRUD), pagos, reportes, config
 * - Tesorero: dashboard y facturas (emitir cobros)
 */
export const NAV_LINKS: NavLink[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
    roles: ["administrador", "tesorero"],
  },
  {
    href: "/usuarios",
    label: "Beneficiarios",
    icon: Users,
    roles: ["administrador"],
  },
  {
    href: "/facturacion",
    label: "Emitir",
    icon: Receipt,
    roles: ["tesorero"],
  },
  {
    href: "/pagos",
    label: "Pagos",
    icon: Wallet,
    roles: ["administrador"],
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: FileText,
    roles: ["administrador"],
  },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: Settings2,
    roles: ["administrador"],
  },
];

export function linksForRole(rol: Rol | undefined | null): NavLink[] {
  if (!rol) return [];
  return NAV_LINKS.filter((l) => l.roles.includes(rol));
}

export function canAccessPath(rol: Rol | undefined | null, pathname: string): boolean {
  if (!rol) return false;

  // Beneficiarios: solo administrador
  if (pathname.startsWith("/usuarios")) {
    return rol === "administrador";
  }

  const match = NAV_LINKS.find(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
  );
  if (!match) return true;
  return match.roles.includes(rol);
}

// Ambos roles aterrizan aquí; el panel se ramifica por rol adentro.
export const HOME_ROUTE = "/dashboard";

export const PRECIO_CHORRO_UNITARIO = 1500;

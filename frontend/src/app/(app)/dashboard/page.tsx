"use client";

import { useAuth } from "@/lib/auth-context";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { TesoreroDashboard } from "@/components/tesorero/tesorero-dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.rol === "administrador" ? <AdminDashboard /> : <TesoreroDashboard />;
}

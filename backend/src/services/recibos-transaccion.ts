import { EntityManager, In } from "typeorm";
import { Recibo } from "../entities/Recibo";
import { ReciboPdf } from "../entities/ReciboPdf";
import { PagoAnual } from "../entities/PagoAnual";
import { PagoCompraChorro } from "../entities/PagoCompraChorro";

// Emisión y eliminación comparten el bloqueo hasta confirmar o revertir.
export async function bloquearRecibos(manager: EntityManager) {
  await manager.query("SELECT pg_advisory_xact_lock(734281, 1)");
}

export async function borrarRecibos(manager: EntityManager, ids: string[]) {
  if (!ids.length) return;
  const criterio = { reciboId: In(ids) };
  await manager.getRepository(PagoAnual).delete(criterio);
  await manager.getRepository(PagoCompraChorro).delete(criterio);
  await manager.getRepository(ReciboPdf).delete(criterio);
  await manager.getRepository(Recibo).delete({ id: In(ids) });
}

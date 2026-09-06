import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Recibo } from "./Recibo";
import { Chorro } from "./Chorro";

@Entity("pagos_compra_chorro")
export class PagoCompraChorro {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "recibo_id", type: "uuid" })
  reciboId!: string;

  @ManyToOne(() => Recibo, (r) => r.pagosCompra)
  @JoinColumn({ name: "recibo_id" })
  recibo!: Recibo;

  @Column({ name: "chorro_id", type: "uuid" })
  chorroId!: string;

  @ManyToOne(() => Chorro)
  @JoinColumn({ name: "chorro_id" })
  chorro!: Chorro;

  @Column({ name: "monto_pagado", type: "numeric", precision: 12, scale: 2 })
  montoPagado!: string;

  @Column({ name: "fecha_pago", type: "date" })
  fechaPago!: string;
}

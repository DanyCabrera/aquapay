import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Recibo } from "./Recibo";
import { Chorro } from "./Chorro";

@Entity("pagos_anuales")
export class PagoAnual {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "recibo_id", type: "uuid" })
  reciboId!: string;

  @ManyToOne(() => Recibo, (r) => r.pagosAnuales)
  @JoinColumn({ name: "recibo_id" })
  recibo!: Recibo;

  @Column({ name: "chorro_id", type: "uuid" })
  chorroId!: string;

  @ManyToOne(() => Chorro)
  @JoinColumn({ name: "chorro_id" })
  chorro!: Chorro;

  @Column({ type: "int" })
  anio!: number;

  @Column({ name: "monto_pagado", type: "numeric", precision: 12, scale: 2 })
  montoPagado!: string;
}

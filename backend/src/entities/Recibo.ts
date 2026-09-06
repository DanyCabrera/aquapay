import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Vivienda } from "./Vivienda";
import { Perfil } from "./Perfil";
import { PagoAnual } from "./PagoAnual";
import { PagoCompraChorro } from "./PagoCompraChorro";
import { ReciboPdf } from "./ReciboPdf";

export type TipoCobro = "tarifa_anual" | "compra_chorro";

@Entity("recibos")
export class Recibo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "numero_recibo", type: "varchar", length: 20, unique: true })
  numeroRecibo!: string;

  @Column({ name: "anio_recibo", type: "int" })
  anioRecibo!: number;

  @Column({ type: "int" })
  secuencia!: number;

  @Column({ name: "vivienda_id", type: "uuid" })
  viviendaId!: string;

  @ManyToOne(() => Vivienda, (v) => v.recibos)
  @JoinColumn({ name: "vivienda_id" })
  vivienda!: Vivienda;

  @Column({ name: "tipo_cobro", type: "varchar", length: 30 })
  tipoCobro!: TipoCobro;

  @Column({ name: "total_pagado", type: "numeric", precision: 12, scale: 2 })
  totalPagado!: string;

  @Column({ name: "cantidad_en_letras", type: "text" })
  cantidadEnLetras!: string;

  @Column({ name: "descripcion_pago", type: "text" })
  descripcionPago!: string;

  @Column({ name: "lugar_pago", type: "varchar", length: 200 })
  lugarPago!: string;

  @Column({ name: "fecha_pago", type: "date" })
  fechaPago!: string;

  @Column({ name: "creado_por", type: "uuid" })
  creadoPor!: string;

  @ManyToOne(() => Perfil)
  @JoinColumn({ name: "creado_por" })
  tesorero!: Perfil;

  @CreateDateColumn({ name: "fecha_creacion", type: "timestamptz" })
  fechaCreacion!: Date;

  @OneToMany(() => PagoAnual, (p) => p.recibo)
  pagosAnuales!: PagoAnual[];

  @OneToMany(() => PagoCompraChorro, (p) => p.recibo)
  pagosCompra!: PagoCompraChorro[];

  @OneToOne(() => ReciboPdf, (p) => p.recibo)
  pdf!: ReciboPdf | null;
}

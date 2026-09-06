import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Vivienda } from "./Vivienda";

@Entity("chorros")
export class Chorro {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "vivienda_id", type: "uuid" })
  viviendaId!: string;

  @ManyToOne(() => Vivienda, (v) => v.chorros)
  @JoinColumn({ name: "vivienda_id" })
  vivienda!: Vivienda;

  @Column({
    name: "precio_compra",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  precioCompra!: string;

  @Column({ type: "int", default: 1 })
  cantidad!: number;

  @Column({ type: "boolean", default: true })
  activo!: boolean;

  @Column({ name: "fecha_instalacion", type: "date" })
  fechaInstalacion!: string;

  @CreateDateColumn({ name: "fecha_registro", type: "timestamptz" })
  fechaRegistro!: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UsuarioComunidad } from "./UsuarioComunidad";
import { Chorro } from "./Chorro";
import { Recibo } from "./Recibo";

@Entity("viviendas")
export class Vivienda {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "usuario_id", type: "uuid" })
  usuarioId!: string;

  @ManyToOne(() => UsuarioComunidad, (u) => u.viviendas)
  @JoinColumn({ name: "usuario_id" })
  usuario!: UsuarioComunidad;

  @Column({ type: "varchar", length: 300 })
  direccion!: string;

  @Column({ type: "boolean", default: true })
  activa!: boolean;

  @Column({ name: "anio_inicio_cobro", type: "int" })
  anioInicioCobro!: number;

  @CreateDateColumn({ name: "fecha_registro", type: "timestamptz" })
  fechaRegistro!: Date;

  @OneToMany(() => Chorro, (c) => c.vivienda)
  chorros!: Chorro[];

  @OneToMany(() => Recibo, (r) => r.vivienda)
  recibos!: Recibo[];
}

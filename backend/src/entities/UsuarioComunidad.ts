import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Vivienda } from "./Vivienda";

@Entity("usuarios_comunidad")
export class UsuarioComunidad {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "nombre_completo", type: "varchar", length: 200 })
  nombreCompleto!: string;

  @Column({ type: "varchar", length: 20, unique: true })
  dpi!: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  telefono!: string | null;

  @Column({ type: "boolean", default: true })
  activo!: boolean;

  @CreateDateColumn({ name: "fecha_registro", type: "timestamptz" })
  fechaRegistro!: Date;

  @OneToMany(() => Vivienda, (v) => v.usuario)
  viviendas!: Vivienda[];
}

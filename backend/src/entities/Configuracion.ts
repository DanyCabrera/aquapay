import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("configuracion")
export class Configuracion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 80, unique: true })
  clave!: string;

  @Column({ type: "text" })
  valor!: string;

  @UpdateDateColumn({ name: "actualizado_en", type: "timestamptz" })
  actualizadoEn!: Date;

  @Column({ name: "actualizado_por", type: "uuid", nullable: true })
  actualizadoPor!: string | null;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

export type RolSistema = "administrador" | "tesorero";

@Entity("perfiles")
export class Perfil {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 150 })
  nombre!: string;

  @Column({ type: "varchar", length: 20, unique: true })
  dpi!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({
    type: "enum",
    enum: ["administrador", "tesorero"],
    enumName: "rol_sistema",
  })
  rol!: RolSistema;

  @Column({ name: "mfa_secreto", type: "text", nullable: true })
  mfaSecreto!: string | null;

  @Column({ name: "mfa_habilitado", type: "boolean", default: false })
  mfaHabilitado!: boolean;

  @Column({ type: "boolean", default: true })
  activo!: boolean;

  @CreateDateColumn({ name: "fecha_creacion", type: "timestamptz" })
  fechaCreacion!: Date;
}

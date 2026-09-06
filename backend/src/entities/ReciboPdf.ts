import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Recibo } from "./Recibo";

@Entity("recibos_pdf")
export class ReciboPdf {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "recibo_id", type: "uuid", unique: true })
  reciboId!: string;

  @OneToOne(() => Recibo, (r) => r.pdf)
  @JoinColumn({ name: "recibo_id" })
  recibo!: Recibo;

  @Column({ name: "nombre_archivo", type: "varchar", length: 255 })
  nombreArchivo!: string;

  @Column({ name: "ruta_storage", type: "text" })
  rutaStorage!: string;

  @Column({ name: "url_publica", type: "text", nullable: true })
  urlPublica!: string | null;

  // Columna en BD sin tilde (tamano_bytes); TypeORM falla si se usa "tamaño_bytes"
  @Column({ name: "tamano_bytes", type: "int", default: 0 })
  tamañoBytes!: number;

  @Column({ name: "tipo_mime", type: "varchar", length: 80, default: "application/pdf" })
  tipoMime!: string;

  @CreateDateColumn({ name: "fecha_subida", type: "timestamptz" })
  fechaSubida!: Date;
}

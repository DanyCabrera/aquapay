import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class CobroTarifaAnualDto {
  @IsUUID()
  viviendaId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(2000, { each: true })
  @Max(2100, { each: true })
  anios!: number[];

  @IsOptional()
  @IsString()
  fechaPago?: string;

  @IsOptional()
  @IsString()
  descripcionPago?: string;
}

export class CobroCompraChorroDto {
  @IsUUID()
  viviendaId!: string;

  @IsUUID()
  chorroId!: string;

  @IsOptional()
  @IsString()
  fechaPago?: string;

  @IsOptional()
  @IsString()
  descripcionPago?: string;
}

export class ActualizarTarifaDto {
  @IsNumber()
  @Min(0.01)
  tarifaAnual!: number;
}

export class TipoReporteDto {
  @IsIn(["usuarios", "viviendas", "pagos", "ingresos"])
  tipo!: "usuarios" | "viviendas" | "pagos" | "ingresos";

  @IsOptional()
  @IsInt()
  anio?: number;
}

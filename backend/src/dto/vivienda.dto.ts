import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CrearViviendaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  direccion!: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  anioInicioCobro?: number;
}

export class ActualizarViviendaDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  direccion?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  anioInicioCobro?: number;
}

export class CrearChorroDto {
  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioCompra?: number;

  @IsOptional()
  @IsString()
  fechaInstalacion?: string;
}

export class ActualizarChorroDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioCompra?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  fechaInstalacion?: string;
}

import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CrearUsuarioDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  nombreCompleto!: string;

  @IsString()
  @Matches(/^\d{13,20}$/, {
    message: "El DPI debe tener entre 13 y 20 dígitos",
  })
  dpi!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;
}

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  nombreCompleto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

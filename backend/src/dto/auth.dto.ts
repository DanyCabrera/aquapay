import {
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegistroDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nombre!: string;

  @IsString()
  @Matches(/^\d{13,20}$/, {
    message: "El DPI debe tener entre 13 y 20 dígitos",
  })
  dpi!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  /**
   * Público: solo tesorero.
   * administrador solo se acepta en bootstrap (0 admins) — validado en servicio.
   */
  @IsIn(["administrador", "tesorero"])
  rol!: "administrador" | "tesorero";
}

export class LoginDto {
  @IsString()
  @Matches(/^\d{13,20}$/, {
    message: "El DPI debe tener entre 13 y 20 dígitos",
  })
  dpi!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

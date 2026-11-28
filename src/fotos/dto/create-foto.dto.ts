import {
    IsArray,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateFotoDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    titulo: string;

    @IsOptional()
    @IsString()
    descripcion?: string | null;

    @IsNumber()
    @Min(0)
    @Max(5)
    calificacion: number;

    @IsUrl()
    ruta: string;

    @IsOptional()
    @IsInt()
    albumId?: number | null;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @MaxLength(30, { each: true })
    etiquetas?: string[] | null;
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, Repository } from 'typeorm';
import { Foto } from './entities/foto.entity.js';

export type DatosFoto = Pick<Foto, 'titulo' | 'descripcion' | 'calificacion' | 'ruta'>;

export interface FiltroFotos {
    min: number;
    max: number;
    q?: string;
    page: number;
    limit: number;
    etiqueta?: string;
    orden?: string;
}

@Injectable()
export class FotosService {
    constructor(
        @InjectRepository(Foto)
        private readonly fotosRepo: Repository<Foto>,
    ) {}

    async findAll({ min, max, q, page, limit, etiqueta, orden }: FiltroFotos) {
        if (page < 1 || limit < 1) {
            throw new BadRequestException('page y limit deben ser mayores que cero');
        }
        if (etiqueta !== undefined && typeof etiqueta !== 'string') {
            throw new BadRequestException('etiqueta debe ser un texto');
        }
        if (orden !== undefined && orden !== 'asc' && orden !== 'desc') {
            throw new BadRequestException('orden debe ser asc o desc');
        }

        const [data, total] = await this.fotosRepo.findAndCount({
            where: {
                calificacion: Between(min, max),
                ...(q && { titulo: ILike(`%${q}%`) }),
                ...(etiqueta && { etiquetas: { texto: etiqueta } }),
            },
            relations: { etiquetas: true, album: true },
            // Al filtrar por una etiqueta, carga todas las etiquetas de cada foto encontrada.
            relationLoadStrategy: etiqueta ? 'query' : 'join',
            order: orden
                ? { calificacion: orden === 'asc' ? 'ASC' : 'DESC', id: 'ASC' }
                : { id: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit };
    }

    async findOne(id: number, fotosRepo = this.fotosRepo): Promise<Foto> {
        const enTransaccion = fotosRepo.queryRunner?.isTransactionActive;
        const foto = await fotosRepo.findOne({
            where: { id },
            relations: enTransaccion ? undefined : { album: true, etiquetas: true },
            lock: enTransaccion ? { mode: 'pessimistic_write' } : undefined,
        });
        if (!foto) {
            throw new NotFoundException(`Foto ${id} no encontrada`);
        }
        return foto;
    }

    create({ titulo, descripcion, calificacion, ruta }: DatosFoto): Promise<Foto> {
        if (typeof titulo !== 'string' || !titulo.trim()) {
            throw new BadRequestException('El título es obligatorio');
        }
        const foto = this.fotosRepo.create({ titulo, descripcion, calificacion, ruta });
        return this.fotosRepo.save(foto);
    }

    async update(id: number, { titulo, descripcion, calificacion, ruta }: Partial<DatosFoto>): Promise<Foto> {
        if (titulo !== undefined && (typeof titulo !== 'string' || !titulo.trim())) {
            throw new BadRequestException('El título es obligatorio');
        }
        return this.fotosRepo.manager.transaction(async manager => {
            const fotosRepo = manager.getRepository(Foto);
            const foto = await this.findOne(id, fotosRepo);
            fotosRepo.merge(foto, { titulo, descripcion, calificacion, ruta });
            return fotosRepo.save(foto);
        });
    }

    async remove(id: number): Promise<void> {
        await this.fotosRepo.manager.transaction(async manager => {
            const fotosRepo = manager.getRepository(Foto);
            const foto = await this.findOne(id, fotosRepo);
            await fotosRepo.remove(foto);
        });
    }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Foto } from './entities/foto.entity.js';

export type DatosFoto = Pick<Foto, 'titulo' | 'descripcion' | 'calificacion' | 'ruta'>;

@Injectable()
export class FotosService {
    constructor(
        @InjectRepository(Foto)
        private readonly fotosRepo: Repository<Foto>,
    ) {}

    findAll(): Promise<Foto[]> {
        return this.fotosRepo.find({ order: { id: 'ASC' } });
    }

    async findOne(id: number, fotosRepo = this.fotosRepo): Promise<Foto> {
        const foto = await fotosRepo.findOne({
            where: { id },
            lock: fotosRepo.queryRunner?.isTransactionActive ? { mode: 'pessimistic_write' } : undefined,
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
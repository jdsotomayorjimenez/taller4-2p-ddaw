import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, In, Repository } from 'typeorm';
import type { CreateFotoDto } from './dto/create-foto.dto.js';
import type { QueryFotosDto } from './dto/query-fotos.dto.js';
import type { UpdateFotoDto } from './dto/update-foto.dto.js';
import { Etiqueta } from './entities/etiqueta.entity.js';
import { Foto } from './entities/foto.entity.js';

@Injectable()
export class FotosService {
    constructor(
        @InjectRepository(Foto)
        private readonly fotosRepo: Repository<Foto>,
        @InjectRepository(Etiqueta)
        private readonly etiquetasRepo: Repository<Etiqueta>,
    ) {}

    async findAll({ min, max, q, page, limit, etiqueta, orden }: QueryFotosDto) {
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

    async findOne(id: number, fotosRepo = this.fotosRepo, bloquear = false): Promise<Foto> {
        const foto = await fotosRepo.findOne({
            where: { id },
            relations: bloquear ? undefined : { album: true, etiquetas: true },
            lock: bloquear ? { mode: 'pessimistic_write' } : undefined,
        });
        if (!foto) {
            throw new NotFoundException(`Foto ${id} no encontrada`);
        }
        return foto;
    }

    async create({ albumId, etiquetas, ...datos }: CreateFotoDto): Promise<Foto> {
        if (!datos.titulo.trim()) {
            throw new BadRequestException('El título es obligatorio');
        }
        return this.fotosRepo.manager.transaction(async (manager) => {
            const fotosRepo = manager.withRepository(this.fotosRepo);
            const etiquetasRepo = manager.withRepository(this.etiquetasRepo);
            const foto = fotosRepo.create({
                ...datos,
                album: albumId == null ? null : { id: albumId },
                etiquetas: await this.buscarOCrearEtiquetas(etiquetas ?? [], etiquetasRepo),
            });
            const guardada = await fotosRepo.save(foto);
            return this.findOne(guardada.id, fotosRepo);
        });
    }

    async update(id: number, { albumId, etiquetas, ...datos }: UpdateFotoDto): Promise<Foto> {
        if (datos.titulo !== undefined && !datos.titulo.trim()) {
            throw new BadRequestException('El título es obligatorio');
        }
        return this.fotosRepo.manager.transaction(async (manager) => {
            const fotosRepo = manager.withRepository(this.fotosRepo);
            const foto = await this.findOne(id, fotosRepo, true);
            Object.assign(foto, datos);
            if (albumId !== undefined) {
                foto.album = albumId === null ? null : { id: albumId } as Foto['album'];
            }
            if (etiquetas) {
                const etiquetasRepo = manager.withRepository(this.etiquetasRepo);
                foto.etiquetas = await this.buscarOCrearEtiquetas(etiquetas, etiquetasRepo);
            }
            await fotosRepo.save(foto);
            return this.findOne(id, fotosRepo);
        });
    }

    async remove(id: number): Promise<void> {
        await this.fotosRepo.manager.transaction(async (manager) => {
            const fotosRepo = manager.withRepository(this.fotosRepo);
            const foto = await this.findOne(id, fotosRepo, true);
            await fotosRepo.remove(foto);
        });
    }

    private async buscarOCrearEtiquetas(textos: string[], etiquetasRepo: Repository<Etiqueta>) {
        if (textos.length === 0) {
            return [];
        }
        const limpios = [...new Set(textos.map((texto) => texto.trim().toLowerCase()))].sort();
        const existentes = await etiquetasRepo.findBy({ texto: In(limpios) });
        const nuevas = limpios
            .filter((texto) => !existentes.some((etiqueta) => etiqueta.texto === texto))
            .map((texto) => ({ texto }));
        if (nuevas.length === 0) {
            return existentes;
        }
        // Si otra solicitud crea la misma etiqueta, reutiliza esa fila.
        await etiquetasRepo.createQueryBuilder().insert().values(nuevas).orIgnore().execute();
        return etiquetasRepo.findBy({ texto: In(limpios) });
    }
}

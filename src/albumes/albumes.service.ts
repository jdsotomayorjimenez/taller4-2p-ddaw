import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateAlbumDto } from './dto/create-album.dto.js';
import type { UpdateAlbumDto } from './dto/update-album.dto.js';
import { Album } from './entities/albumes.entity.js';

@Injectable()
export class AlbumesService {
    constructor(
        @InjectRepository(Album)
        private readonly albumesRepo: Repository<Album>,
    ) {}

    findAll() {
        return this.albumesRepo.find({ order: { id: 'ASC' } });
    }

    async findFotos(id: number) {
        const album = await this.albumesRepo.findOne({
            where: { id },
            relations: { fotos: true },
        });
        if (!album) throw new NotFoundException(`Álbum ${id} no encontrado`);
        return album;
    }

    create(dto: CreateAlbumDto): Promise<Album> {
        const album = this.albumesRepo.create(dto);
        return this.albumesRepo.save(album);
    }

    update(id: number, dto: UpdateAlbumDto): Promise<Album> {
        return this.albumesRepo.manager.transaction(async (manager) => {
            const albumesRepo = manager.withRepository(this.albumesRepo);
            const album = await albumesRepo.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!album) throw new NotFoundException(`Álbum ${id} no encontrado`);

            Object.assign(album, dto);
            return albumesRepo.save(album);
        });
    }

    async remove(id: number): Promise<void> {
        const { affected } = await this.albumesRepo.delete(id);
        if (!affected) throw new NotFoundException(`Álbum ${id} no encontrado`);
    }
}

import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module.js';
import { Foto } from './fotos/entities/foto.entity.js';

const app = await NestFactory.createApplicationContext(AppModule);

try {
    const dataSource = app.get(DataSource);
    const insertadas = await dataSource.transaction('SERIALIZABLE', async (manager) => {
        const fotosRepo = manager.getRepository(Foto);
        if (await fotosRepo.count() > 0) {
            return 0;
        }

        const fotos = Array.from({ length: 10 }, (_, indice) => {
            const i = indice + 1;
            return {
                titulo: `Foto ${i}`,
                descripcion: `Descripción de la foto ${i}`,
                calificacion: i === 3 ? 4.5 : Math.round(Math.random() * 50) / 10,
                ruta: `https://picsum.photos/id/${i * 10}/600/400`,
            };
        });

        await fotosRepo.save(fotos);
        return fotos.length;
    });

    console.log(insertadas > 0
        ? `✓ ${insertadas} fotos insertadas`
        : 'La tabla ya contiene fotos. Se omitió la carga.');
} finally {
    await app.close();
}
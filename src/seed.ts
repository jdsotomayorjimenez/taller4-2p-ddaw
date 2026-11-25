import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module.js';
import { Foto } from './fotos/entities/foto.entity.js';
import { Album } from './albumes/entities/albumes.entity.js';
import { Etiqueta } from './fotos/entities/etiqueta.entity.js';

const app = await NestFactory.createApplicationContext(AppModule);

try {
    const ds = app.get(DataSource);
    await ds.transaction(async (manager) => {
        await manager.query(
            'TRUNCATE fotos_etiquetas, fotos, etiquetas, albumes RESTART IDENTITY CASCADE',
        );
        const albumes = await manager.getRepository(Album).save(
            ['Viajes', 'Guayaquil', 'Naturaleza'].map((nombre) => ({ nombre })),
        );
        const etiquetas = await manager.getRepository(Etiqueta).save(
            ['playa', 'ciudad', 'noche', 'cielo', 'montaña', 'río'].map((texto) => ({ texto })),
        );
        const fotosRepo = manager.getRepository(Foto);
        const azar = <T>(lista: T[]) => lista[Math.floor(Math.random() * lista.length)];

        for (let i = 1; i <= 20; i++) {
            await fotosRepo.save({
                titulo: `Foto ${i}`,
                calificacion: Math.round(Math.random() * 50) / 10,
                ruta: `https://picsum.photos/id/${i * 10}/600/400`,
                album: azar(albumes),
                etiquetas: [...new Set([azar(etiquetas), azar(etiquetas)])],
            });
        }
    });

    console.log('✓ 20 fotos, 3 álbumes y 6 etiquetas insertados');
} finally {
    await app.close();
}

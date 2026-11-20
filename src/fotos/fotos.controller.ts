import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { FotosService } from './fotos.service.js';
import type { DatosFoto } from './fotos.service.js';

@Controller('fotos')
export class FotosController {
    constructor(
        private readonly fotosService: FotosService,
    ) {}

    @Get()
    findAll() {
        return this.fotosService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.fotosService.findOne(id);
    }

    @Post()
    create(@Body() datos: DatosFoto) {
        return this.fotosService.create(datos);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() datos: Partial<DatosFoto>,
    ) {
        return this.fotosService.update(id, datos);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.fotosService.remove(id);
    }
}
import { prisma } from "../config/prisma.js";

export class ContinentService {
    async executeList() {
        return await prisma.continent.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async executeFindById(id: string) {
        const continent = await prisma.continent.findUnique({
            where: { id }
        });
        if (!continent) throw new Error("Continente não encontrado.");
        return continent;
    }

    async executeListWithCountries() {
        return await prisma.continent.findMany({
            orderBy: { name: 'asc' },
            include: {
                countries: {
                    orderBy: { name: 'asc' },
                    select: { id: true, name: true, createdAt: true }
                }
            }
        });
    }

    async executeCreate(name: string, description?: string) {
        const continentExists = await prisma.continent.findUnique({
            where: { name }
        });
        if (continentExists) throw new Error("Este continente já está cadastrado.");
        return await prisma.continent.create({
            data: {
                name: name,
                description: description ?? null
            }
        });
    }

    async executeUpdate(id: string, name: string, description?: string) {
        const continentExists = await prisma.continent.findUnique({ where: { id } });
        if (!continentExists) throw new Error("Continente não encontrado.");
        return await prisma.continent.update({
            where: { id },
            data: {
                name: name,
                description: description ?? null
            }
        });
    }

    async executeDelete(id: string) {
        const continentExists = await prisma.continent.findUnique({ where: { id } });
        if (!continentExists) throw new Error("Continente não encontrado.");
        return await prisma.continent.delete({ where: { id } });
    }
}

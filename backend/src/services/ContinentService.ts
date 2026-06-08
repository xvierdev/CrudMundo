import { prisma } from "../config/prisma";

export class ContinentService {
    async executeList() {
        return await prisma.continent.findMany({
            orderBy: {
                name: 'asc'
            }
        });
    }

    async executeCreate(name: string) {
        const continentExists = await prisma.continent.findUnique({
            where: { name }
        });

        if (continentExists) {
            throw new Error("Este continente já está cadastrado.")
        }

        return await prisma.continent.create({
            data: { name }
        })
    }
}
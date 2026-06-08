import { prisma } from "../config/prisma";

interface CreateCountryData {
    name: string;
    continentId: string;
}

export class CountryService {
    async executeList() {
        return await prisma.country.findMany({
            orderBy: { name: 'asc' },
            include: { continent: true }
        });
    }

    async executeFindById(id: string) {
        const country = await prisma.country.findUnique({
            where: { id },
            include: { continent: true }
        });
        if (!country) throw new Error("País não encontrado.");
        return country;
    }

    async executeCreate({ name, continentId }: CreateCountryData) {
        const continentExists = await prisma.continent.findUnique({ where: { id: continentId } });
        if (!continentExists) throw new Error("O continente informado não existe.");

        const countryExists = await prisma.country.findUnique({ where: { name } });
        if (countryExists) throw new Error("Este país já está cadastrado.");

        return await prisma.country.create({
            data: { name, continentId }
        });
    }

    async executeUpdate(id: string, data: Partial<CreateCountryData>) {
        const countryExists = await prisma.country.findUnique({ where: { id } });
        if (!countryExists) throw new Error("País não encontrado.");

        return await prisma.country.update({
            where: { id },
            data
        });
    }

    async executeDelete(id: string) {
        const countryExists = await prisma.country.findUnique({ where: { id } });
        if (!countryExists) throw new Error("País não encontrado.");
        return await prisma.country.delete({ where: { id } });
    }
}

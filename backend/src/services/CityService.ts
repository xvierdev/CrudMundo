import { prisma } from '../config/prisma';

interface CreateCityData {
    name: string;
    stateId?: string;
    countryId: string;
}

export class CityService {
    async executeList() {
        return await prisma.city.findMany({
            orderBy: { name: 'asc' },
            include: { state: true, country: true }
        });
    }

    async executeFindById(id: string) {
        const city = await prisma.city.findUnique({
            where: { id },
            include: { state: true, country: true }
        });
        if (!city) throw new Error("Cidade não encontrada.");
        return city;
    }

    async executeCreate({ name, stateId, countryId }: CreateCityData) {
        if (stateId) {
            const cityExistsInState = await prisma.city.findFirst({
                where: { name, stateId }
            });
            if (cityExistsInState) throw new Error("Esta cidade já está cadastrada neste estado.");
        } else {
            const cityExistsInCountry = await prisma.city.findFirst({
                where: { name, countryId, stateId: null }
            });
            if (cityExistsInCountry) throw new Error("Esta cidade já está cadastrada neste país.");
        }

        return await prisma.city.create({
            data: { name, stateId, countryId }
        });
    }

    async executeUpdate(id: string, data: Partial<CreateCityData>) {
        const cityExists = await prisma.city.findUnique({ where: { id } });
        if (!cityExists) throw new Error("Cidade não encontrada.");

        return await prisma.city.update({
            where: { id },
            data
        });
    }

    async executeDelete(id: string) {
        const cityExists = await prisma.city.findUnique({ where: { id } });
        if (!cityExists) throw new Error("Cidade não encontrada.");
        return await prisma.city.delete({ where: { id } });
    }
}

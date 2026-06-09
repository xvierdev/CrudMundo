import { prisma } from '../config/prisma';

interface CreateCityData {
    name: string;
    stateId?: string;
    countryId: string;
    population?: number;
    latitude?: number;
    longitude?: number;
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

    async executeCreate({ name, stateId, countryId, population, latitude, longitude }: CreateCityData) {
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
            data: {
                name: name,
                countryId: countryId,
                stateId: stateId ?? null,
                population: population ? Number(population) : null,
                latitude: latitude ? Number(latitude) : null,
                longitude: longitude ? Number(longitude) : null
            }
        });
    }

    async executeUpdate(id: string, data: Partial<CreateCityData>) {
        const cityExists = await prisma.city.findUnique({ where: { id } });
        if (!cityExists) throw new Error("Cidade não encontrada.");

        const updateData = { ...data };
        if (updateData.population !== undefined) {
            updateData.population = updateData.population ? Number(updateData.population) : null as any;
        }
        if (updateData.latitude !== undefined) {
            updateData.latitude = updateData.latitude ? Number(updateData.latitude) : null as any;
        }
        if (updateData.longitude !== undefined) {
            updateData.longitude = updateData.longitude ? Number(updateData.longitude) : null as any;
        }

        return await prisma.city.update({
            where: { id },
            data: updateData as any
        });
    }

    async executeDelete(id: string) {
        const cityExists = await prisma.city.findUnique({ where: { id } });
        if (!cityExists) throw new Error("Cidade não encontrada.");
        return await prisma.city.delete({ where: { id } });
    }
}

import { prisma } from '../config/prisma.js';

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
        if (!name || name.trim().length < 3) {
            throw new Error("O nome da cidade deve ter pelo menos 3 caracteres.");
        }
        if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
            throw new Error("A latitude deve estar entre -90 e 90.");
        }
        if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
            throw new Error("A longitude deve estar entre -180 e 180.");
        }
        if (population && (population < 0 || population > 1000000000000)) {
            throw new Error("A população deve ser um número positivo e não maior que 1 trilhão.");
        }
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
        if (data.name !== undefined && data.name.trim().length < 3) {
            throw new Error("O nome da cidade deve ter pelo menos 3 caracteres.");
        }
        if (data.population && (data.population < 0 || data.population > 1000000000000)) {
            throw new Error("A população deve ser um número positivo e não maior que 1 trilhão.");
        }
        if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
            throw new Error("A latitude deve estar entre -90 e 90.");
        }
        if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
            throw new Error("A longitude deve estar entre -180 e 180.");
        }
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

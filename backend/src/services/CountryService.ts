import { prisma } from "../config/prisma.js";

// 1. Unificamos a interface aqui no topo com todos os campos necessários
interface CreateCountryData {
    name: string;
    continentId: string;
    exactName?: string;
    population?: number | string; // Permitindo string caso venha direto de um formulário/query
    officialLanguage?: string;
    currency?: string;
}

export class CountryService {
    
    // Método para listar
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

    // Método para criar
    async executeCreate({ name, continentId, exactName, population, officialLanguage, currency }: CreateCountryData) {
        if (!name || name.trim().length < 3) {
            throw new Error("O nome do país deve ter pelo menos 3 caracteres.");
        }
        if (population && (Number(population) < 0 || Number(population) > 1000000000000)) {
            throw new Error("A população deve ser um número positivo e não maior que 1 trilhão.");
        }
        const continentExists = await prisma.continent.findUnique({ where: { id: continentId } });
        if (!continentExists) throw new Error("O continente informado não existe.");

        const countryExists = await prisma.country.findUnique({ where: { name } });
        if (countryExists) throw new Error("Este país já está cadastrado.");

        return await prisma.country.create({
            data: { 
                name, 
                continentId, 
                exactName: exactName ?? null,
                population: population ? Number(population) : null,
                officialLanguage: officialLanguage ?? null,
                currency: currency ?? null,
            }
        });
    }

    // Método para atualizar
    async executeUpdate(id: string, data: Partial<CreateCountryData>) {
        if (data.name !== undefined && (data.name.trim().length < 3)) {
            throw new Error("O nome do país deve ter pelo menos 3 caracteres.");
        }
        if (data.population && (Number(data.population) < 0 || Number(data.population) > 1000000000000)) {
            throw new Error("A população deve ser um número positivo e não maior que 1 trilhão.");
        }
        const countryExists = await prisma.country.findUnique({ where: { id } });
        if (!countryExists) throw new Error("País não encontrado.");

        const updateData = { ...data };
        if (updateData.population !== undefined) {
            updateData.population = updateData.population ? Number(updateData.population) : null as any;
        }

        return await prisma.country.update({
            where: { id },
            data: updateData as any
        });
    }

    // Método para deletar
    async executeDelete(id: string) {
        const countryExists = await prisma.country.findUnique({ where: { id } });
        if (!countryExists) throw new Error("País não encontrado.");
        return await prisma.country.delete({ where: { id } });
    }
}
import { prisma } from "../config/prisma";

interface CreateStateData {
    name: string;
    countryId: string;
}

export class StateService {
    async executeList() {
        return await prisma.state.findMany({
            orderBy: { name: 'asc' },
            include: { country: true }
        });
    }

    async executeFindById(id: string) {
        const state = await prisma.state.findUnique({
            where: { id },
            include: { country: true }
        });

        if (!state) {
            throw new Error("Estado não encontrado.");
        }

        return state;
    }

    async executeCreate({ name, countryId }: CreateStateData) {
        const countryExists = await prisma.country.findUnique({
            where: { id: countryId }
        });

        if (!countryExists) {
            throw new Error("O país informado não existe.");
        }

        const stateExists = await prisma.state.findUnique({
            where: {
                name_countryId: { name, countryId }
            }
        });

        if (stateExists) {
            throw new Error("Este estado já está cadastrado para este país.");
        }

        return await prisma.state.create({
            data: { name, countryId }
        });
    }

    async executeUpdate(id: string, { name, countryId }: Partial<CreateStateData>) {
        const stateExists = await prisma.state.findUnique({
            where: { id }
        });

        if (!stateExists) {
            throw new Error("Estado não encontrado.");
        }

        const updateData: any = {};

        if (name !== undefined) updateData.name = name;
        if (countryId !== undefined) updateData.countryId = countryId;

        return await prisma.state.update({
            where: { id },
            data: updateData
        });
    }

    async executeDelete(id: string) {
        const stateExists = await prisma.state.findUnique({
            where: { id }
        });

        if (!stateExists) {
            throw new Error("Estado não encontrado.");
        }

        return await prisma.state.delete({
            where: { id }
        });
    }
}

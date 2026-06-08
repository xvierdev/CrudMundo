import { prisma } from '../config/prisma';
import bcrypt from 'bcrypt';

// Definindo a interface para criação de usuário
interface CreateUserData {
    email: string;
    password: string;
    name?: string;
}

export class UserService {
    async executeCreate({ email, password, name }: CreateUserData) {
        if (!email) {
            throw new Error("Email é obrigatório");
        }

        if (!password) {
            throw new Error("A senha é obrigatória");
        }

        const userAlreadyExists = await prisma.user.findUnique({
            where: { email }
        });

        if (userAlreadyExists) {
            throw new Error("Este e-mail já está cadastrado.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name ?? null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            }
        });

        return user;
    }

    async executeList() {
        return await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
}
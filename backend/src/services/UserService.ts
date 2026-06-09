import { prisma } from '../config/prisma.js';
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

        if (password.length < 6) {
            throw new Error("A senha deve ter pelo menos 6 caracteres.");
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

    async executeUpdatePassword(userId: string, oldPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("Usuário não encontrado.");

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw new Error("A senha antiga está incorreta.");
        }

        if (!newPassword || newPassword.length < 6) {
            throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return { message: "Senha atualizada com sucesso." };
    }
}
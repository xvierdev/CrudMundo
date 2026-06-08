import { prisma } from "../config/prisma";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface LoginData {
    email: string;
    password: string;
}

export class AuthService {
    async executeLogin({ email, password }: LoginData){
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new Error("E-mail ou senha inválidos.")
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch){
            throw new Error ("E-mail ou senha inválidos.")
        }
        
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("Chave secreta do JWT não configurada.")
        }

        const token = jwt.sign(
            {name: user.name, email: user.email},
            secret,
            {
                subject: user.id,
                expiresIn: '1d'
            }
        );

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        };
    }
}
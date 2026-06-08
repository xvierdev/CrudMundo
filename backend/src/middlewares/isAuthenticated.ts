import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';

interface TokenPayload {
    sub: string;
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    const authToken = req.headers.authorization;

    if (!authToken) {
        return res.status(401).json({ error: "Token não enviado." });
    }

    const [, token] = authToken.split(" ");

    if (!token) {
        return res.status(401).json({ error: "Token não enviado ou em formato inválido." })
    }

    try {
        const secret = process.env.JWT_SECRET as string;
        const { sub } = jwt.verify(token, secret) as TokenPayload;

        req.headers['x-user-id'] = sub;

        return next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
}

/*
// usar isso nas outras rotas
import { isAuthenticated } from '../middlewares/isAuthenticated';
routes.get('/continents', isAuthenticated, locationController.list);
*/
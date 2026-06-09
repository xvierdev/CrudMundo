import type { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';

const authService = new AuthService();

export class AuthController {
    login = async (req: Request, res: Response) => {
        const { email, password } = req.body;

        try {
            const result = await authService.executeLogin({ email, password });
            return res.json(result);
        }
        catch (error: any) {
            return res.status(401).json({ error: error.message });
        }
    }
}
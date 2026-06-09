import type { Request, Response } from 'express';
import { UserService } from '../services/UserService.js';

const userService = new UserService();

export class UserController {
  create = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    try {
      const user = await userService.executeCreate({ email, password, name });
      return res.status(201).json(user);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const users = await userService.executeList();
      return res.json(users);
    } catch (error: any) {
      return res.status(500).json({ error: "Erro interno no servidor." });
    }
  }

  updatePassword = async (req: Request, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = (req as any).user_id; // Pegamos do middleware isAuthenticated

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      const result = await userService.executeUpdatePassword(userId, oldPassword, newPassword);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
import type { Request, Response } from 'express';
import { UserService } from '../services/UserService';

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
}
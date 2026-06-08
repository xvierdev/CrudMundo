import type { Request, Response } from "express";
import { ContinentService } from "../services/ContinentService";

const continentService = new ContinentService();

export class ContinentController {
    list = async (req: Request, res: Response) => {
        try {
            console.log("Usuário que está requisitando:", req.headers['x-user-id']);
            const continents = await continentService.executeList();
            return res.json(continents);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    create = async (req: Request, res: Response) => {
        try {
            const { name } = req.body;

            const autorId = req.headers['x-user-id'];
            console.log(`Usuário ${autorId} está criando o continente: ${name}`);

            if (!name) {
                return res.status(400).json({ error: "O nome do continente é obrigatório." })
            }

            const continent = await continentService.executeCreate(name);
            return res.status(201).json(continent);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
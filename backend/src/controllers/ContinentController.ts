import type { Request, Response } from "express";
import { ContinentService } from "../services/ContinentService";

const continentService = new ContinentService();

export class ContinentController {
    list = async (req: Request, res: Response) => {
        try {
            const continents = await continentService.executeList();
            return res.json(continents);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    show = async (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const continent = await continentService.executeFindById(id);
            return res.json(continent);
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    }

    listWithCountries = async (req: Request, res: Response) => {
        try {
            const data = await continentService.executeListWithCountries();
            return res.json(data);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    create = async (req: Request, res: Response) => {
        try {
            const { name, description } = req.body;
            if (!name) return res.status(400).json({ error: "O nome do continente é obrigatório." });
            const continent = await continentService.executeCreate(name, description);
            return res.status(201).json(continent);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const { name, description } = req.body;
            if (!name) return res.status(400).json({ error: "O nome é obrigatório." });
            const continent = await continentService.executeUpdate(id, name, description);
            return res.json(continent);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            await continentService.executeDelete(id);
            return res.status(204).send();
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}

import type { Request, Response } from 'express';
import { CityService } from '../services/CityService.js';

const cityService = new CityService();

export class CityController {
    list = async (req: Request, res: Response) => {
        try {
            const cities = await cityService.executeList();
            return res.json(cities);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    show = async (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const city = await cityService.executeFindById(id);
            return res.json(city);
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    }

    create = async (req: Request, res: Response) => {
        try {
            const { name, stateId, countryId, population, latitude, longitude } = req.body;
            if (!name || !countryId) {
                return res.status(400).json({ error: "Nome da cidade e ID do país são obrigatórios" });
            }
            const city = await cityService.executeCreate({ name, stateId, countryId, population, latitude, longitude });
            return res.status(201).json(city);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const { name, stateId, countryId, population, latitude, longitude } = req.body;
            const city = await cityService.executeUpdate(id, { name, stateId, countryId, population, latitude, longitude });
            return res.json(city);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            await cityService.executeDelete(id);
            return res.status(204).send();
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
